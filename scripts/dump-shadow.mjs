import { spawn } from 'child_process';

const tempDir = 'C:\\temp_chrome_prof';
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chrome, [
  '--headless=new',
  '--remote-debugging-port=9336',
  '--disable-gpu',
  `--user-data-dir=${tempDir}`,
  'http://localhost:3000/'
]);

async function check() {
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const res = await fetch('http://127.0.0.1:9336/json');
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
                  function getAllText(node) {
                    let text = '';
                    if (node.nodeType === 3) text += node.nodeValue + ' ';
                    if (node.childNodes) {
                      for (let c of node.childNodes) text += getAllText(c);
                    }
                    if (node.shadowRoot) text += getAllText(node.shadowRoot);
                    return text;
                  }
                  return getAllText(sr);
                })()`
              }
            }));
          }, 3000);
        };
        ws.onmessage = (msg) => {
          const d = JSON.parse(msg.data);
          if (d.id === 2) {
            console.log('SHADOW_TEXT_DUMP:\n', d.result?.result?.value);
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
