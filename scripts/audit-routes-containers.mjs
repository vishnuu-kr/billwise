import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') results = results.concat(walk(full));
    } else if (file === 'page.tsx') {
      results.push(full);
    }
  });
  return results;
}

const pages = walk('src/app');
for (const p of pages) {
  const content = fs.readFileSync(p, 'utf8');
  const route = p.replace(/src[\\/]app/, '').replace(/[\\/]page\.tsx/, '') || '/';
  const match = content.match(/return\s*\(\s*(?:<[^>]+>\s*)*<div[^>]*className=["']([^"']+)["']/);
  const cls = match ? match[1] : 'CUSTOM_OR_FRAGMENT';
  console.log(`${route.padEnd(30)} -> ${cls}`);
}
