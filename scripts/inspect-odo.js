import { spawn } from 'child_process';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chrome, [
  '--headless=new',
  '--remote-debugging-port=9445',
  '--disable-gpu',
  'http://localhost:3000/budget'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9445/json');
    const tabs = await res.json();
    const tab = tabs.find(t => t.url.includes('budget'));
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          returnByValue: true,
          expression: `(() => {
            const root = document.querySelector('[aria-label*="2000"]');
            if (!root) return null;
            return {
              rootRect: root.getBoundingClientRect(),
              children: Array.from(root.children).map(c => ({
                text: c.innerText,
                tag: c.tagName,
                top: c.getBoundingClientRect().top,
                bottom: c.getBoundingClientRect().bottom,
                height: c.getBoundingClientRect().height,
                width: c.getBoundingClientRect().width,
              }))
            };
          })()`
        }
      }));
    };
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id === 1) {
        console.log('BOXES:', JSON.stringify(d.result?.result?.value, null, 2));
        proc.kill();
        process.exit(0);
      }
    };
  } catch(e) {
    console.error(e);
    proc.kill();
  }
}, 2000);
