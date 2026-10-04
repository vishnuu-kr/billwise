import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('screenshots');

async function captureUrl(url, filename, scrollY = 0) {
  const tempDir = `C:\\temp_cap_donut_${Date.now()}`;
  const port = 9699;
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    url
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
              
              if (scrollY > 0) {
                setTimeout(() => {
                  ws.send(JSON.stringify({
                    id: 3,
                    method: 'Runtime.evaluate',
                    params: {
                      expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`
                    }
                  }));
                }, 1000);
              }

              setTimeout(() => {
                ws.send(JSON.stringify({
                  id: 4,
                  method: 'Page.captureScreenshot',
                  params: { format: 'png' }
                }));
              }, 2200);
            };

            ws.onmessage = (msg) => {
              const data = JSON.parse(msg.data);
              if (data.id === 4 && data.result && data.result.data) {
                const buffer = Buffer.from(data.result.data, 'base64');
                fs.writeFileSync(path.join(outDir, filename), buffer);
                console.log(`Saved screenshot to ${filename}`);
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

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Capturing Explain Cost Breakdown Donut...');
  await captureUrl('http://localhost:3000/explain?units=280', 'explain_donut.png', 160);

  await new Promise(r => setTimeout(r, 1000));

  console.log('Capturing Appliances Share Donut...');
  await captureUrl('http://localhost:3000/appliances', 'appliances_donut.png', 240);

  console.log('Done!');
}

main().catch(console.error);
