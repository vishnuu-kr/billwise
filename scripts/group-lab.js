const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Windows 10\\.gemini\\antigravity\\brain\\48ced2c9-1672-4f57-80fc-200892d2c72d\\.system_generated\\steps\\1502\\content.md', 'utf8');

const categories = ['Buttons', 'Inputs', 'Navigation', 'Feedback', 'Data', 'Objects', 'Playground', 'Text'];
const grouped = {};

for (let i = 0; i < categories.length; i++) {
  const cat = categories[i];
  const nextCat = categories[i + 1];
  const startIdx = content.indexOf(`>${cat}<span`);
  const endIdx = nextCat ? content.indexOf(`>${nextCat}<span`) : content.indexOf('</nav>');
  
  if (startIdx !== -1 && endIdx !== -1) {
    const chunk = content.slice(startIdx, endIdx);
    const itemRegex = /href="\/lab\/([^"]+)"[^>]*>[\s\S]*?<span class="truncate">([^<]+)<\/span>/g;
    let m;
    grouped[cat] = [];
    while ((m = itemRegex.exec(chunk)) !== null) {
      grouped[cat].push({ slug: m[1], name: m[2] });
    }
  }
}

for (const [cat, items] of Object.entries(grouped)) {
  console.log(`\n=== ${cat} (${items.length}) ===`);
  items.forEach(it => console.log(`  - ${it.name} (/lab/${it.slug})`));
}

fs.writeFileSync('scripts/lab-grouped.json', JSON.stringify(grouped, null, 2));
