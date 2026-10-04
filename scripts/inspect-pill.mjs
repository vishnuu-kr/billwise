import { spawn } from 'child_process';

const tempDir = 'C:\\temp_chrome_inspect2';
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chrome, [
  '--headless=new',
  '--remote-debugging-port=9339',
  '--disable-gpu',
  '--window-size=390,844',
  `--user-data-dir=${tempDir}`,
  'http://localhost:3000/result?units=240'
]);

async function check() {
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const res = await fetch('http://127.0.0.1:9339/json');
      const tabs = await res.json();
      const tab = tabs.find(t => t.url.includes('result'));
      if (tab && tab.webSocketDebuggerUrl) {
        const ws = new WebSocket(tab.webSocketDebuggerUrl);
        ws.onopen = () => {
          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 2,
              method: 'Runtime.evaluate',
              params: {
                returnByValue: true,
                expression: `(() => {
                  const segs = document.querySelectorAll('[role="radiogroup"]');
                  return Array.from(segs).map(s => {
                    const btns = Array.from(s.querySelectorAll('button')).map(b => {
                      const pill = b.querySelector('div');
                      return {
                        btnText: b.innerText,
                        hasPill: !!pill,
                        pillRect: pill ? pill.getBoundingClientRect() : null,
                        btnRect: b.getBoundingClientRect(),
                        btnColor: window.getComputedStyle(b).color,
                        pillBg: pill ? window.getComputedStyle(pill).backgroundColor : null,
                        pillZIndex: pill ? window.getComputedStyle(pill).zIndex : null
                      };
                    });
                    return btns;
                  });
                })()`
              }
            }));
          }, 1500);
        };
        ws.onmessage = (msg) => {
          const d = JSON.parse(msg.data);
          if (d.id === 2) {
            console.log('SEG_PILL_DETAILS:', JSON.stringify(d.result?.result?.value, null, 2));
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
