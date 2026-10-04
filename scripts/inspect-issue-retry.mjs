import { spawn } from 'child_process';
import http from 'http';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chrome, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--user-data-dir=C:\\Users\\Windows 10\\AppData\\Local\\Temp\\chrome_debug_profile',
  'http://localhost:3000/'
]);

async function waitAndQuery() {
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const res = await fetch('http://127.0.0.1:9222/json');
      const tabs = await res.json();
      const pageTab = tabs.find(t => t.url.includes('localhost:3000'));
      if (pageTab && pageTab.webSocketDebuggerUrl) {
        console.log('Found page tab:', pageTab.webSocketDebuggerUrl);
        const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
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
                  if (!portal) return 'NO_PORTAL';
                  const root = portal.shadowRoot || portal;
                  return root.innerHTML;
                })()`
              }
            }));
          }, 2000);
        };

        ws.onmessage = (msg) => {
          const data = JSON.parse(msg.data);
          if (data.method === 'Runtime.consoleAPICalled') {
            console.log('CONSOLE_EVENT:', data.params.type, JSON.stringify(data.params.args));
          }
          if (data.id === 3) {
            console.log('PORTAL_HTML:', data.result?.result?.value);
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
  console.error('Timeout waiting for CDP');
  proc.kill();
  process.exit(1);
}

waitAndQuery();
