import { execSync } from 'child_process';
import http from 'http';

console.log('Testing client page health...');
http.get('http://localhost:3000/', (res) => {
  console.log('Status code:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTML size:', data.length, 'bytes');
    console.log('Body tag present:', data.includes('<body'));
    console.log('React scripts present:', data.includes('/_next/static/chunks/'));
  });
}).on('error', (err) => {
  console.error('HTTP get failed:', err.message);
});
