import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('screenshots/gate');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function runCdpScript(taskName, setupFn) {
  const tempDir = `C:\\temp_cap_gate_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const port = 9690 + Math.floor(Math.random() * 100);
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    'http://localhost:3000/'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 400));
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

    if (!wsUrl) throw new Error(`Could not connect to Chrome CDP for ${taskName}`);

    await new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let idCounter = 1;
      const callbacks = new Map();

      function send(method, params = {}) {
        return new Promise((res, rej) => {
          const id = idCounter++;
          callbacks.set(id, { res, rej });
          ws.send(JSON.stringify({ id, method, params }));
        });
      }

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id && callbacks.has(msg.id)) {
          const { res, rej } = callbacks.get(msg.id);
          callbacks.delete(msg.id);
          if (msg.error) rej(msg.error);
          else res(msg.result);
        }
      };

      ws.onopen = async () => {
        try {
          await send('Page.enable');
          await send('Runtime.enable');
          await send('Emulation.setDeviceMetricsOverride', {
            width: 390,
            height: 844,
            deviceScaleFactor: 2,
            mobile: true,
          });

          await setupFn(send);

          // Capture screenshot
          const { data } = await send('Page.captureScreenshot', { format: 'png' });
          const filePath = path.join(outDir, `${taskName}.png`);
          fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
          console.log(`Saved screenshot: ${filePath}`);
          ws.close();
          resolve();
        } catch (err) {
          ws.close();
          reject(err);
        }
      };

      ws.onerror = (err) => reject(err);
    });

  } finally {
    try { proc.kill('SIGKILL'); } catch {}
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}

const mockSavedHome = {
  id: 'home_mock_1',
  billingCycle: 'bi-monthly',
  tariff: 'LT-1A',
  phase: 'single',
  connectedLoadWatts: 3000,
  lastBillAmount: 1148,
  lastBillUnits: 240,
  lastBillDate: new Date(Date.now() - 74 * 86400000).toISOString(),
  lastReading: 10295,
  lastReadingDate: new Date(Date.now() - 14 * 86400000).toISOString(),
  latestPrediction: {
    estimatedBill: 1284,
    likelyRangeMin: 1210,
    likelyRangeMax: 1360,
    projectedUnits: 258,
    unitsPerDay: 3.8,
    daysElapsed: 14,
    daysRemaining: 46,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - 86400000).toISOString(),
};

async function main() {
  // 2. Returning-user home
  console.log('Capturing: 2-returning-home');
  await runCdpScript('2-returning-home', async (send) => {
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('billwise_saved_home_v1', JSON.stringify(${JSON.stringify(mockSavedHome)}));
        location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 1500));
  });

  // 3. Result screen
  console.log('Capturing: 3-result');
  await runCdpScript('3-result', async (send) => {
    await send('Page.navigate', { url: 'http://localhost:3000/result?units=240&days=60&prevBill=1148' });
    await new Promise(r => setTimeout(r, 1500));
  });

  // 4. Quick meter update
  console.log('Capturing: 4-quick-meter-update');
  await runCdpScript('4-quick-meter-update', async (send) => {
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('billwise_saved_home_v1', JSON.stringify(${JSON.stringify(mockSavedHome)}));
        location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 1200));
    // Click [ Update reading ] button
    await send('Runtime.evaluate', {
      expression: `
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Update reading') || b.textContent.includes('റീഡിംഗ് പുതുക്കുക'));
        if (btn) btn.click();
      `
    });
    await new Promise(r => setTimeout(r, 800));
  });

  // 6. Tools sheet
  console.log('Capturing: 6-tools-sheet');
  await runCdpScript('6-tools-sheet', async (send) => {
    // Click "More" tab on bottom nav
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const moreBtn = btns.find(b => b.textContent.includes('More') || b.textContent.includes('കൂടുതൽ'));
        if (moreBtn) {
          moreBtn.click();
        } else {
          // Find 4th button in nav
          const navButtons = document.querySelectorAll('nav button');
          if (navButtons.length >= 4) navButtons[3].click();
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));
  });

  console.log('Re-captured targeted screens!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
