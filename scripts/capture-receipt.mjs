import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('screenshots');

async function captureReceipt() {
  const tempDir = `C:\\temp_cap_receipt_${Date.now()}`;
  const port = 9701;
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    'http://localhost:3000/result?units=280'
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
                  width: 412,
                  height: 915,
                  deviceScaleFactor: 2,
                  mobile: true,
                }
              }));
              
              // Click the 'Receipt' tab and scroll to printer
              setTimeout(() => {
                ws.send(JSON.stringify({
                  id: 3,
                  method: 'Runtime.evaluate',
                  params: {
                    expression: `
                      const buttons = Array.from(document.querySelectorAll('button'));
                      const receiptBtn = buttons.find(b => b.textContent.trim() === 'Receipt' || b.textContent.trim() === 'ബിൽ');
                      if (receiptBtn) receiptBtn.click();
                      setTimeout(() => {
                        window.scrollTo({ top: 120, behavior: 'instant' });
                      }, 200);
                    `
                  }
                }));
              }, 1000);

              // Wait for paper feed animation to complete
              setTimeout(() => {
                ws.send(JSON.stringify({
                  id: 4,
                  method: 'Page.captureScreenshot',
                  params: { format: 'png' }
                }));
              }, 3800);
            };

            ws.onmessage = (msg) => {
              const data = JSON.parse(msg.data);
              if (data.id === 4 && data.result && data.result.data) {
                const buffer = Buffer.from(data.result.data, 'base64');
                fs.writeFileSync(path.join(outDir, 'receipt_printer.png'), buffer);
                console.log('Saved screenshot to receipt_printer.png');
                ws.close();
                resolve();
              }
            };

            ws.onerror = (e) => reject(e);
          });
          break;
        }
      } catch (err) {
        // retry
      }
    }
  } finally {
    proc.kill();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

captureReceipt().catch(console.error);
