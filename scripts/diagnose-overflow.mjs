import { spawn } from 'child_process';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chrome, [
  '--headless=new',
  '--remote-debugging-port=9455',
  '--disable-gpu',
  '--window-size=390,844',
  '--user-data-dir=C:\\temp_overflow_diag',
  'http://localhost:3000/'
]);

async function check() {
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const res = await fetch('http://127.0.0.1:9455/json');
      const tabs = await res.json();
      const tab = tabs.find(t => t.url.includes('localhost:3000'));
      if (tab && tab.webSocketDebuggerUrl) {
        const ws = new WebSocket(tab.webSocketDebuggerUrl);
        ws.onopen = () => {
          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          ws.send(JSON.stringify({
            id: 2,
            method: 'Runtime.evaluate',
            params: {
              returnByValue: true,
              expression: `(() => {
                const w = window.innerWidth;
                const scrollW = document.documentElement.scrollWidth;
                const bad = [];
                document.querySelectorAll('*').forEach(el => {
                  const r = el.getBoundingClientRect();
                  if (r.right > w + 1) {
                    bad.push({ tag: el.tagName, class: String(el.className).slice(0, 50), right: Math.round(r.right), width: Math.round(r.width), w });
                  }
                });
                return { innerWidth: w, scrollWidth: scrollW, bad: bad.slice(0, 10) };
              })()`
            }
          }));
        };
        ws.onmessage = (msg) => {
          const d = JSON.parse(msg.data);
          if (d.id === 2) {
            console.log('OVERFLOW_REPORT:', JSON.stringify(d.result?.result?.value, null, 2));
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
