const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
let scripts = 0;
let externalScripts = 0;
for (const name of fs.readdirSync(path.join(root, "assets")).filter(n => n.endsWith(".js"))) {
  new vm.Script(fs.readFileSync(path.join(root, "assets", name), "utf8"), {filename:name});
  externalScripts++;
}
for (const name of fs.readdirSync(root).filter(n => n.endsWith('.html'))) {
  const text = fs.readFileSync(path.join(root, name), 'utf8');
  assert.equal((text.match(/<!doctype\s+html\s*>/gi)||[]).length,1,name+' doctype');
  for(const tag of ['html','head','body']) {
    assert.equal((text.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>','gi'))||[]).length,1,name+' opening '+tag);
    assert.equal((text.match(new RegExp('</'+tag+'\\s*>','gi'))||[]).length,1,name+' closing '+tag);
  }
  assert(/<\/html>\s*$/i.test(text),name+' document must end at closing html');
  assert.equal((text.match(/<script\b[^>]*>/gi)||[]).length,(text.match(/<\/script\s*>/gi)||[]).length,name+' script balance');
  for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=|application\/ld\+json/i.test(match[1])) continue;
    new vm.Script(match[2], { filename: name });
    scripts++;
  }
}
console.log(`PASS: ${scripts} inline and ${externalScripts} external JavaScript blocks parse; all HTML single-document wrappers and script tag balances pass.`);
