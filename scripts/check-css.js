async function test() {
  try {
    const res = await fetch('http://localhost:3000');
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('HTML size:', text.length);
    const cssMatches = [...text.matchAll(/href="([^"]+\.css[^"]*)"/g)];
    console.log('CSS links found:', cssMatches.map(m => m[1]));
    for (const m of cssMatches) {
      const cssUrl = 'http://localhost:3000' + m[1];
      const cssRes = await fetch(cssUrl);
      console.log('Fetched', m[1], 'Status:', cssRes.status, 'Type:', cssRes.headers.get('content-type'));
    }
  } catch (err) {
    console.error('Error fetching:', err);
  }
}
test();
