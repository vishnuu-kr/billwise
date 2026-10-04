import { spawn } from 'child_process';

const tempDir = 'C:\\temp_chrome_prof';
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chrome, [
  '--headless=new',
  '--remote-debugging-port=9335',
  '--disable-gpu',
  `--user-data-dir=${tempDir}`,
  'http://localhost:3000/'
]);

async function check() {
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const res = await fetch('http://127.0.0.1:9335/json');
      const tabs = await res.json();
      const tab = tabs.find(t => t.url.includes('localhost:3000'));
      if (tab && tab.webSocketDebuggerUrl) {
        const ws = new WebSocket(tab.webSocketDebuggerUrl);
        const logs = [];
        ws.onopen = () => {
          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
          setTimeout(() => {
            console.log('ALL_LOGS:\n', logs.join('\n'));
            proc.kill();
            process.exit(0);
          }, 4000);
        };
        ws.onmessage = (msg) => {
          const d = JSON.parse(msg.data);
          if (d.method === 'Runtime.consoleAPICalled') {
            logs.push(`[CONSOLE ${d.params.type}] ` + d.params.args.map(a => JSON.stringify(a.value || a.description || a)).join(' '));
          }
          if (d.method === 'Log.entryAdded') {
            logs.push(`[LOG ${d.params.entry.level}] ` + d.params.entry.text);
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
