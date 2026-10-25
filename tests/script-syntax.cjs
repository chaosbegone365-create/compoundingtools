const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
let scripts = 0;
for (const name of fs.readdirSync(root).filter(n => n.endsWith('.html'))) {
  const text = fs.readFileSync(path.join(root, name), 'utf8');
  for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=|application\/ld\+json/i.test(match[1])) continue;
    new vm.Script(match[2], { filename: name });
    scripts++;
  }
}
console.log(`PASS: ${scripts} inline JavaScript blocks parse.`);
