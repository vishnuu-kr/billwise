import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('screenshots/gate');

async function captureUrl(url, outFileName) {
  const tempDir = `C:\\temp_c_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const port = 9880 + Math.floor(Math.random() * 80);
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    url
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json`);
        const tabs = await res.json();
        const tab = tabs.find(t => t.url.includes('localhost:3000'));
        if (tab && tab.webSocketDebuggerUrl) {
          wsUrl = tab.webSocketDebuggerUrl;
          break;
        }
      } catch {}
    }

    if (!wsUrl) throw new Error('No wsUrl for ' + url);

    await new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({
          id: 1,
          method: 'Emulation.setDeviceMetricsOverride',
          params: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
        }));
        setTimeout(() => {
          ws.send(JSON.stringify({ id: 2, method: 'Page.captureScreenshot', params: { format: 'png' } }));
        }, 1500);
      };

      ws.onmessage = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === 2 && data.result && data.result.data) {
          const outPath = path.join(outDir, outFileName);
          fs.writeFileSync(outPath, Buffer.from(data.result.data, 'base64'));
          console.log('Saved', outPath);
          ws.close();
          resolve();
        }
      };

      ws.onerror = reject;
    });
  } finally {
    try { proc.kill('SIGKILL'); } catch {}
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}

async function main() {
  console.log('Capturing 8 final screens...');
  await captureUrl('http://localhost:3000/', '1-first-time-home.png');
  await captureUrl('http://localhost:3000/?mode=returning', '2-returning-home.png');
  await captureUrl('http://localhost:3000/result?units=240&days=60&prevBill=1148', '3-result.png');
  await captureUrl('http://localhost:3000/?mode=quick-update', '4-quick-meter-update.png');
  await captureUrl('http://localhost:3000/history', '5-history.png');
  await captureUrl('http://localhost:3000/?sheet=more', '6-tools-sheet.png');
  await captureUrl('http://localhost:3000/scan', '7-scan.png');
  await captureUrl('http://localhost:3000/manual', '8-manual.png');
  console.log('Done capturing all 8 screens!');
}

main().catch(console.error);
