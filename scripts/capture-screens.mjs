import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const routes = [
  '/',
  '/predict',
  '/scan',
  '/result',
  '/manual',
  '/what-if',
  '/budget',
  '/history',
  '/usage',
  '/appliances',
  '/tariff',
  '/explain',
  '/settings',
  '/about',
  '/privacy',
  '/how-it-works'
];

const outDir = path.resolve('screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

for (const r of routes) {
  const name = r === '/' ? 'home' : r.replace(/^\//, '').replace(/\//g, '-');
  const outPath = path.join(outDir, `${name}.png`);
  const url = `http://localhost:3000${r}`;
  try {
    execSync(`"${chrome}" --headless --disable-gpu --blink-settings=preferredColorScheme=0 --window-size=390,844 --screenshot="${outPath}" "${url}"`, { stdio: 'ignore' });
    console.log(`Captured ${r} -> ${name}.png`);
  } catch (e) {
    console.error(`Failed ${r}:`, e.message);
  }
}
