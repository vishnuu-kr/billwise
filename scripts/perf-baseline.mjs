import { spawn } from 'child_process';
import fs from 'fs';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempDir = `C:\\temp_perf_baseline_${Date.now()}`;
const port = 9600 + Math.floor(Math.random() * 100);

const testRoutes = [
  { path: '/', label: 'Home Page' },
  { path: '/scan', label: 'Scan Page' },
  { path: '/predict', label: 'Predict Page' },
  { path: '/manual', label: 'Manual Input' },
  { path: '/result?units=240', label: 'Result Page (240u)' },
  { path: '/what-if', label: 'What-If Simulator' },
  { path: '/history', label: 'History Tracker' },
  { path: '/appliances', label: 'Appliance Calculator' },
  { path: '/tariff', label: 'Tariff Guide' },
  { path: '/settings', label: 'Settings' },
];

async function runBrowserPerf() {
  console.log(`=== LAUNCHING CHROME HEADLESS CDP ON PORT ${port} ===`);
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    'http://localhost:3000/'
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

    if (!wsUrl) {
      console.error('Failed to connect to Chrome CDP.');
      return;
    }

    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    const callbacks = new Map();

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (callbacks.has(msg.id)) {
        const { res, rej } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const id = msgId++;
        callbacks.set(id, { res, rej });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Performance.enable');
    await send('Runtime.enable');

    console.log('\n' + '-'.repeat(96));
    console.log(
      'Route'.padEnd(24) + ' | ' +
      'FCP (ms)'.padStart(8) + ' | ' +
      'LCP (ms)'.padStart(8) + ' | ' +
      'CLS'.padStart(8) + ' | ' +
      'DOMReady'.padStart(9) + ' | ' +
      'Load(ms)'.padStart(8) + ' | ' +
      'Heap(MB)'.padStart(8) + ' | ' +
      'DOM Nodes'.padStart(9)
    );
    console.log('-'.repeat(96));

    const results = [];

    for (const r of testRoutes) {
      const url = `http://localhost:3000${r.path}`;
      await send('Page.navigate', { url });

      // Wait for page to settle and hydrate
      await new Promise(res => setTimeout(res, 1200));

      const evalMetrics = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const p = performance.getEntriesByType('paint');
            const fcp = p.find(e => e.name === 'first-contentful-paint')?.startTime || 0;
            
            // LCP
            let lcp = 0;
            const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
            if (lcpEntries.length > 0) {
              lcp = lcpEntries[lcpEntries.length - 1].startTime;
            }

            // CLS
            let cls = 0;
            const layoutShifts = performance.getEntriesByType('layout-shift');
            for (const entry of layoutShifts) {
              if (!entry.hadRecentInput) {
                cls += entry.value;
              }
            }

            const nav = performance.getEntriesByType('navigation')[0] || {};
            const domContentLoaded = nav.domContentLoadedEventEnd || 0;
            const loadEvent = nav.loadEventEnd || 0;
            const memory = performance.memory ? performance.memory.usedJSHeapSize / (1024 * 1024) : 0;
            const domNodes = document.getElementsByTagName('*').length;

            return {
              fcp: Math.round(fcp),
              lcp: Math.round(lcp || fcp),
              cls: Number(cls.toFixed(4)),
              domContentLoaded: Math.round(domContentLoaded),
              loadEvent: Math.round(loadEvent),
              memoryMb: Number(memory.toFixed(2)),
              domNodes
            };
          })()
        `,
        returnByValue: true
      });

      const data = evalMetrics.result?.value || {};
      results.push({ ...r, ...data });

      console.log(
        r.path.padEnd(24) + ' | ' +
        String(data.fcp).padStart(8) + ' | ' +
        String(data.lcp).padStart(8) + ' | ' +
        String(data.cls).padStart(8) + ' | ' +
        String(data.domContentLoaded).padStart(9) + ' | ' +
        String(data.loadEvent).padStart(8) + ' | ' +
        String(data.memoryMb).padStart(8) + ' | ' +
        String(data.domNodes).padStart(9)
      );
    }

    // Measure interaction responsiveness (client-side route transition from / to /result)
    console.log('\n=== MEASURING IN-APP CLIENT NAVIGATION LATENCY ===');
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise(res => setTimeout(res, 800));

    const transitionEval = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const start = performance.now();
          const link = Array.from(document.querySelectorAll('a')).find(a => a.href.includes('/manual') || a.href.includes('/scan'));
          if (link) {
            link.click();
            await new Promise(r => setTimeout(r, 150));
            const end = performance.now();
            return { linkHref: link.href, elapsedMs: Math.round(end - start) };
          }
          return { error: 'No link found' };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Client-side link transition test:', transitionEval.result?.value);

    // Measure in-app calculation speed inside browser runtime
    const inBrowserCalc = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const t0 = performance.now();
          // Simulate state update calculation in browser context
          let dummy = 0;
          for (let i = 0; i < 5000; i++) {
            dummy += Math.sqrt(i * 240);
          }
          const t1 = performance.now();
          return { iterations: 5000, timeMs: Number((t1 - t0).toFixed(2)) };
        })()
      `,
      returnByValue: true
    });
    console.log('Browser V8 arithmetic throughput:', inBrowserCalc.result?.value);

    ws.close();
    return results;
  } finally {
    proc.kill('SIGKILL');
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

runBrowserPerf().then(() => {
  console.log('\n=== BASELINE RUN COMPLETE ===');
});
