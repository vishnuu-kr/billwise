import { spawn } from 'child_process';
import http from 'http';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chrome, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9222/json');
    const tabs = await res.json();
    console.log('Tabs:', tabs.map(t => ({ title: t.title, url: t.url, ws: t.webSocketDebuggerUrl })));
    
    if (tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
      const wsUrl = tabs[0].webSocketDebuggerUrl;
      const WebSocket = (await import('ws')).default || globalThis.WebSocket;
      if (WebSocket) {
        const ws = new WebSocket(wsUrl);
        ws.on('open', () => {
          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: `(() => {
                const portal = document.querySelector('nextjs-portal');
                if (!portal) return 'No nextjs-portal';
                const shadow = portal.shadowRoot;
                if (!shadow) return 'No shadowRoot';
                return shadow.innerHTML;
              })()`
            }
          }));
        });
        ws.on('message', (msg) => {
          const data = JSON.parse(msg.toString());
          if (data.id === 3) {
            console.log('NEXTJS_PORTAL_CONTENT:', data.result?.result?.value);
            proc.kill();
            process.exit(0);
          } else if (data.method === 'Runtime.consoleAPICalled') {
            console.log('CONSOLE:', data.params.type, data.params.args.map(a => a.value || a.description));
          }
        });
      }
    }
  } catch (err) {
    console.error('Error querying CDP:', err.message);
    proc.kill();
    process.exit(1);
  }
}, 2000);
