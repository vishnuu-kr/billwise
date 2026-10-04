import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempDir = `C:\\temp_qa_crawl_${Date.now()}`;
const port = 9550 + Math.floor(Math.random() * 100);

const routes = [
  '/',
  '/scan',
  '/predict',
  '/manual',
  '/result',
  '/what-if',
  '/budget',
  '/explain',
  '/history',
  '/usage',
  '/appliances',
  '/tariff',
  '/how-it-works',
  '/about',
  '/privacy',
  '/settings',
  '/admin',
  '/feedback',
  '/providers',
  '/electricity-tariffs',
  '/some-random-404-url'
];

const viewports = [
  { name: 'Mobile-360', width: 360, height: 800, mobile: true },
  { name: 'Mobile-390', width: 390, height: 844, mobile: true },
  { name: 'Mobile-430', width: 430, height: 932, mobile: true },
  { name: 'Tablet-768', width: 768, height: 1024, mobile: false },
  { name: 'Desktop-1280', width: 1280, height: 800, mobile: false },
  { name: 'Desktop-1920', width: 1920, height: 1080, mobile: false }
];

async function main() {
  console.log(`Starting Chrome CDP on port ${port}...`);
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    'http://localhost:3000/'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 400));
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json`);
        const tabs = await res.json();
        const tab = tabs.find(t => t.url.includes('localhost:3000'));
        if (tab && tab.webSocketDebuggerUrl) {
          wsUrl = tab.webSocketDebuggerUrl;
          break;
        }
      } catch {}
    }

    if (!wsUrl) throw new Error('Could not connect to Chrome CDP');

    await new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let idCounter = 1;
      const callbacks = new Map();
      const consoleIssues = [];
      const overflowIssues = [];

      function send(method, params = {}) {
        return new Promise((res, rej) => {
          const id = idCounter++;
          callbacks.set(id, { res, rej });
          ws.send(JSON.stringify({ id, method, params }));
        });
      }

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id && callbacks.has(msg.id)) {
          const { res, rej } = callbacks.get(msg.id);
          callbacks.delete(msg.id);
          if (msg.error) rej(msg.error);
          else res(msg.result);
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          const type = msg.params.type;
          if (type === 'error' || type === 'warning') {
            const text = msg.params.args.map(a => JSON.stringify(a.value || a.description || a)).join(' ');
            consoleIssues.push(`[${type.toUpperCase()}] ${text}`);
          }
        } else if (msg.method === 'Runtime.exceptionThrown') {
          consoleIssues.push(`[EXCEPTION] ${JSON.stringify(msg.params.exceptionDetails)}`);
        }
      };

      ws.onopen = async () => {
        try {
          await send('Page.enable');
          await send('Runtime.enable');

          console.log(`Auditing ${routes.length} routes across ${viewports.length} viewports...`);

          for (const route of routes) {
            console.log(`Checking route: ${route}`);
            await send('Page.navigate', { url: `http://localhost:3000${route}` });
            await new Promise(r => setTimeout(r, 600));

            // Check overflow across viewports
            for (const vp of viewports) {
              await send('Emulation.setDeviceMetricsOverride', {
                width: vp.width,
                height: vp.height,
                deviceScaleFactor: 1,
                mobile: vp.mobile
              });
              await new Promise(r => setTimeout(r, 100));

              const { result } = await send('Runtime.evaluate', {
                expression: `(() => {
                  const doc = document.documentElement;
                  const body = document.body;
                  const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
                  const clientW = window.innerWidth;
                  return {
                    overflow: scrollW > clientW + 1,
                    diff: scrollW - clientW,
                    scrollW,
                    clientW
                  };
                })()`,
                returnByValue: true
              });

              if (result && result.value && result.value.overflow) {
                overflowIssues.push({
                  route,
                  viewport: vp.name,
                  diff: result.value.diff,
                  clientW: result.value.clientW,
                  scrollW: result.value.scrollW
                });
              }
            }
          }

          console.log('\n================ AUDIT RESULTS ================');
          console.log('Console / Exception Issues:', consoleIssues.length);
          consoleIssues.forEach(c => console.log('  ', c));

          console.log('Horizontal Overflow Issues:', overflowIssues.length);
          overflowIssues.forEach(o => console.log(`  [OVERFLOW] ${o.route} on ${o.viewport}: +${o.diff}px (scroll: ${o.scrollW}px, client: ${o.clientW}px)`));

          ws.close();
          resolve();
        } catch (err) {
          ws.close();
          reject(err);
        }
      };

      ws.onerror = (err) => reject(err);
    });
  } finally {
    try { proc.kill('SIGKILL'); } catch {}
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}

main().catch(console.error);
