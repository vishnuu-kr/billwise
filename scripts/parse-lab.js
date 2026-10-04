const fs = require('fs');
const path = 'C:\\Users\\Windows 10\\.gemini\\antigravity\\brain\\48ced2c9-1672-4f57-80fc-200892d2c72d\\.system_generated\\steps\\1502\\content.md';
const content = fs.readFileSync(path, 'utf8');

// Extract categories and their links
const categoryRegex = /<p class="[^"]*">([^<]+)<span class="[^"]*">(\d+)<\/span><\/p>([\s\S]*?)(?=<div><p class="|$)/g;
let catMatch;
const result = {};

// Simple regex for href="/lab/..."
const itemRegex = /href="\/lab\/([^"]+)"[^>]*>[\s\S]*?<span class="truncate">([^<]+)<\/span>/g;
let itemMatch;
const allItems = [];
while ((itemMatch = itemRegex.exec(content)) !== null) {
  allItems.push({ slug: itemMatch[1], name: itemMatch[2] });
}

console.log('Total experiments found:', allItems.length);

// Also find categories
const catPatt = /<p[^>]*>([A-Za-z\s]+)<span[^>]*>(\d+)<\/span><\/p>/g;
let c;
while ((c = catPatt.exec(content)) !== null) {
  console.log('Category:', c[1].trim(), 'Count:', c[2]);
}

fs.writeFileSync('scripts/lab-items.json', JSON.stringify(allItems, null, 2));
