import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('screenshots/gate');

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

async function captureScreen({ name, url, initScript, actionScript, waitMs = 1200 }) {
  const tempDir = `C:\\temp_cap_g_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const port = 9700 + Math.floor(Math.random() * 100);
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    'about:blank'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json`);
        const tabs = await res.json();
        const tab = tabs[0];
        if (tab && tab.webSocketDebuggerUrl) {
          wsUrl = tab.webSocketDebuggerUrl;
          break;
        }
      } catch {}
    }

    if (!wsUrl) throw new Error(`Could not connect to Chrome CDP for ${name}`);

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

          if (initScript) {
            await send('Page.addScriptToEvaluateOnNewDocument', {
              source: initScript,
            });
          }

          await send('Page.navigate', { url });
          await new Promise(r => setTimeout(r, waitMs));

          if (actionScript) {
            await send('Runtime.evaluate', { expression: actionScript });
            await new Promise(r => setTimeout(r, 800));
          }

          const { data } = await send('Page.captureScreenshot', { format: 'png' });
          const filePath = path.join(outDir, `${name}.png`);
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

async function run() {
  const seedInit = `
    localStorage.setItem('billwise_saved_home_v1', ${JSON.stringify(JSON.stringify(mockSavedHome))});
  `;

  // 2. Returning-user home
  console.log('Capturing 2-returning-home...');
  await captureScreen({
    name: '2-returning-home',
    url: 'http://localhost:3000/',
    initScript: seedInit,
  });

  // 4. Quick meter update modal
  console.log('Capturing 4-quick-meter-update...');
  await captureScreen({
    name: '4-quick-meter-update',
    url: 'http://localhost:3000/',
    initScript: seedInit,
    actionScript: `
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Update reading') || b.textContent.includes('റീഡിംഗ് പുതുക്കുക'));
      if (btn) btn.click();
    `,
  });

  // 6. Tools sheet
  console.log('Capturing 6-tools-sheet...');
  await captureScreen({
    name: '6-tools-sheet',
    url: 'http://localhost:3000/',
    actionScript: `
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const moreBtn = navButtons.find(b => b.textContent.includes('More') || b.textContent.includes('കൂടുതൽ'));
      if (moreBtn) moreBtn.click();
      else if (navButtons.length >= 4) navButtons[navButtons.length - 1].click();
    `,
  });

  // 3b. Result screen full/scrolled to show SaveHomePrompt
  console.log('Capturing 3b-result-save-prompt...');
  await captureScreen({
    name: '3b-result-save-prompt',
    url: 'http://localhost:3000/result?units=240&days=60&prevBill=1148',
    actionScript: `
      window.scrollTo(0, 500);
    `,
  });
}

run().catch(console.error);
