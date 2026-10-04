import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const routes = [
  { path: '/', name: 'home' },
  { path: '/predict', name: 'predict' },
  { path: '/result', name: 'result' },
  { path: '/appliances', name: 'appliances' },
  { path: '/what-if', name: 'what-if' },
  { path: '/budget', name: 'budget' },
  { path: '/history', name: 'history' },
];

async function captureRoute(route) {
  const tempDir = `C:\\temp_cap_${Date.now()}`;
  const port = 9555 + Math.floor(Math.random() * 100);
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    `http://localhost:3000${route.path}`
  ]);

  try {
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 600));
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json`);
        const tabs = await res.json();
        const tab = tabs.find(t => t.url.includes('localhost:3000'));
        if (tab && tab.webSocketDebuggerUrl) {
          await new Promise((resolve, reject) => {
            const ws = new WebSocket(tab.webSocketDebuggerUrl);
            ws.onopen = () => {
              ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
              ws.send(JSON.stringify({
                id: 2,
                method: 'Emulation.setDeviceMetricsOverride',
                params: {
                  width: 390,
                  height: 844,
                  deviceScaleFactor: 2,
                  mobile: true,
                }
              }));
              setTimeout(() => {
                ws.send(JSON.stringify({
                  id: 3,
                  method: 'Page.captureScreenshot',
                  params: { format: 'png', captureBeyondViewport: false }
                }));
              }, 1200);
            };
            ws.onmessage = (msg) => {
              const d = JSON.parse(msg.data);
              if (d.id === 3 && d.result && d.result.data) {
                const filePath = path.join(outDir, `${route.name}.png`);
                fs.writeFileSync(filePath, Buffer.from(d.result.data, 'base64'));
                console.log(`Captured ${route.path} -> ${route.name}.png`);
                ws.close();
                resolve();
              }
            };
            ws.onerror = reject;
          });
          break;
        }
      } catch (e) {
        // retry
      }
    }
  } finally {
    proc.kill();
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e) {}
  }
}

async function run() {
  for (const r of routes) {
    await captureRoute(r);
  }
  console.log('All mobile screenshots captured successfully!');
  process.exit(0);
}

run();
