import { spawn } from 'child_process';
import fs from 'fs';

const tempDir = 'C:\\temp_chrome_prof';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chrome, [
  '--headless=new',
  '--remote-debugging-port=9333',
  '--disable-gpu',
  `--user-data-dir=${tempDir}`,
  'http://localhost:3000/'
]);

async function check() {
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const res = await fetch('http://127.0.0.1:9333/json');
      const tabs = await res.json();
      console.log('TABS:', tabs.length);
      const tab = tabs.find(t => t.url.includes('localhost:3000'));
      if (tab && tab.webSocketDebuggerUrl) {
        console.log('Found tab ws:', tab.webSocketDebuggerUrl);
        const ws = new WebSocket(tab.webSocketDebuggerUrl);
        ws.onopen = () => {
          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 3,
              method: 'Runtime.evaluate',
              params: {
                expression: `(() => {
                  const portal = document.querySelector('nextjs-portal');
                  if (!portal) return 'NO_PORTAL_ELEMENT';
                  const sr = portal.shadowRoot;
                  if (!sr) return 'NO_SHADOW_ROOT';
                  // Extract all text inside shadow root
                  return sr.innerText || sr.textContent || sr.innerHTML;
                })()`
              }
            }));
          }, 3000);
        };
        ws.onmessage = (msg) => {
          const d = JSON.parse(msg.data);
          if (d.method === 'Runtime.consoleAPICalled') {
            console.log('CONSOLE_MSG:', d.params.type, d.params.args.map(a => a.value || a.description).join(' '));
          }
          if (d.method === 'Log.entryAdded') {
            console.log('LOG_ENTRY:', d.params.entry.level, d.params.entry.text);
          }
          if (d.id === 3) {
            console.log('DEV_OVERLAY_TEXT:', d.result?.result?.value);
            proc.kill();
            process.exit(0);
          }
        };
        return;
      }
    } catch (e) {
      // retry
    }
  }
  proc.kill();
  process.exit(1);
}

check();
