import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('screenshots/gate');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function runCdpScript(taskName, targetUrl, setupFn) {
  const tempDir = `C:\\temp_cap_ftue_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const port = 9690 + Math.floor(Math.random() * 100);
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    targetUrl
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 25; i++) {
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

async function main() {
  console.log('Capturing FTUE screens...');

  // 1. First-time Home Screen (with 30s setup card)
  await runCdpScript('1-first-time-home', 'http://localhost:3000/', async (send) => {
    await send('Runtime.evaluate', {
      expression: `
        localStorage.clear();
        localStorage.setItem('billwise_onboarding_completed', 'true');
        location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 2000));
  });

  // 2. Onboarding Wizard Step 1
  await runCdpScript('onboarding-wizard-step1', 'http://localhost:3000/?mode=setup', async (send) => {
    await new Promise(r => setTimeout(r, 2000));
  });

  // 3. Onboarding Wizard Step 2
  await runCdpScript('onboarding-wizard-step2', 'http://localhost:3000/?mode=setup', async (send) => {
    await new Promise(r => setTimeout(r, 1500));
    // Click 'Continue'
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const continueBtn = btns.find(b => b.innerText.includes('Continue') || b.innerText.includes('തുടങ്ങാം'));
        if (continueBtn) continueBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 1000));
  });

  // 4. Predict page for first-time user
  await runCdpScript('predict-first-time', 'http://localhost:3000/predict', async (send) => {
    await new Promise(r => setTimeout(r, 2000));
  });

  // 5. Budget page for first-time user
  await runCdpScript('budget-first-time', 'http://localhost:3000/budget', async (send) => {
    await new Promise(r => setTimeout(r, 2000));
  });

  // 6. History page for first-time user
  await runCdpScript('history-first-time', 'http://localhost:3000/history', async (send) => {
    await new Promise(r => setTimeout(r, 2000));
  });

  console.log('Finished capturing FTUE screenshots!');
}

main().catch(console.error);
