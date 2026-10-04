import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('screenshots');

async function capturePopulatedHistory() {
  const tempDir = `C:\\temp_cap_${Date.now()}`;
  const port = 9670;
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    'http://localhost:3000/history'
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
                  width: 390,
                  height: 844,
                  deviceScaleFactor: 2,
                  mobile: true,
                }
              }));
              // Click "Load sample Kerala data" button
              setTimeout(() => {
                ws.send(JSON.stringify({
                  id: 3,
                  method: 'Runtime.evaluate',
                  params: {
                    expression: `
                      const buttons = Array.from(document.querySelectorAll('button'));
                      const btn = buttons.find(b => b.textContent.includes('Load sample') || b.textContent.includes('ഉദാഹരണം'));
                      if (btn) btn.click();
                    `
                  }
                }));
              }, 800);

              setTimeout(() => {
                ws.send(JSON.stringify({
                  id: 4,
                  method: 'Page.captureScreenshot',
                  params: { format: 'png', captureBeyondViewport: false }
                }));
              }, 1800);
            };
            ws.onmessage = (msg) => {
              const data = JSON.parse(msg.data);
              if (data.id === 4 && data.result && data.result.data) {
                fs.writeFileSync(path.join(outDir, 'history_populated.png'), Buffer.from(data.result.data, 'base64'));
                ws.close();
                resolve();
              }
            };
            ws.onerror = reject;
          });
          break;
        }
      } catch (e) {}
    }
  } finally {
    proc.kill();
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
  }
}

async function captureScrolledPredict() {
  const tempDir = `C:\\temp_cap_predict_${Date.now()}`;
  const port = 9675;
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    'http://localhost:3000/predict'
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
                  width: 390,
                  height: 844,
                  deviceScaleFactor: 2,
                  mobile: true,
                }
              }));
              // Fill input and scroll down
              setTimeout(() => {
                ws.send(JSON.stringify({
                  id: 3,
                  method: 'Runtime.evaluate',
                  params: {
                    expression: `
                      const currInput = document.getElementById('curr-reading-input');
                      if (currInput) {
                        currInput.value = '10295';
                        currInput.dispatchEvent(new Event('input', { bubbles: true }));
                        currInput.dispatchEvent(new Event('change', { bubbles: true }));
                      }
                      window.scrollTo({ top: 380, behavior: 'instant' });
                    `
                  }
                }));
              }, 800);

              setTimeout(() => {
                ws.send(JSON.stringify({
                  id: 4,
                  method: 'Page.captureScreenshot',
                  params: { format: 'png', captureBeyondViewport: false }
                }));
              }, 1800);
            };
            ws.onmessage = (msg) => {
              const data = JSON.parse(msg.data);
              if (data.id === 4 && data.result && data.result.data) {
                fs.writeFileSync(path.join(outDir, 'predict_scrolled.png'), Buffer.from(data.result.data, 'base64'));
                ws.close();
                resolve();
              }
            };
            ws.onerror = reject;
          });
          break;
        }
      } catch (e) {}
    }
  } finally {
    proc.kill();
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
  }
}

async function run() {
  await capturePopulatedHistory();
  await captureScrolledPredict();
  console.log('Both screenshots captured!');
}

run();
