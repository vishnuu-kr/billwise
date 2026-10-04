import { spawn } from 'child_process';

const tempDir = 'C:\\temp_chrome_prof';
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chrome, [
  '--headless=new',
  '--remote-debugging-port=9334',
  '--disable-gpu',
  `--user-data-dir=${tempDir}`,
  'http://localhost:3000/'
]);

async function check() {
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const res = await fetch('http://127.0.0.1:9334/json');
      const tabs = await res.json();
      const tab = tabs.find(t => t.url.includes('localhost:3000'));
      if (tab && tab.webSocketDebuggerUrl) {
        const ws = new WebSocket(tab.webSocketDebuggerUrl);
        ws.onopen = () => {
          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 2,
              method: 'Runtime.evaluate',
              params: {
                expression: `(() => {
                  const portal = document.querySelector('nextjs-portal');
                  if (!portal || !portal.shadowRoot) return 'no portal';
                  const sr = portal.shadowRoot;
                  // Click the issues open button if present
                  const btn = sr.querySelector('[data-issues-open]');
                  if (btn) btn.click();
                  return 'clicked';
                })()`
              }
            }));
            
            setTimeout(() => {
              ws.send(JSON.stringify({
                id: 3,
                method: 'Runtime.evaluate',
                params: {
                  expression: `(() => {
                    const portal = document.querySelector('nextjs-portal');
                    if (!portal || !portal.shadowRoot) return 'no portal';
                    const sr = portal.shadowRoot;
                    // Find any error title or description or dialog text
                    const dialog = sr.querySelector('[role="dialog"]') || sr.querySelector('[data-nextjs-dialog]') || sr;
                    return dialog.innerText;
                  })()`
                }
              }));
            }, 1000);
          }, 3000);
        };
        ws.onmessage = (msg) => {
          const d = JSON.parse(msg.data);
          if (d.id === 3) {
            console.log('DIALOG_INNER_TEXT:\n', d.result?.result?.value);
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
