'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const search = require('../assets/tool-search.js');
const share = require('../assets/share-tools.js');
let checks = 0;
function ok(value, message) { assert.ok(value, message); checks++; }
for (const [q,id] of [['renovation quotes','renovation-quotes'],['material quote','renovation-quotes'],['aesthetics durability','renovation-quotes'],['hard project cap','renovation-quotes'],['trip quotes','trip-quote-tradeoffs'],['hard budget alternatives','trip-quote-tradeoffs'],['airfare ceiling','trip-quote-tradeoffs'],['options investing','options'],['put option','options'],['school','school-costs'],['education','school-costs'],['college','college-paths'],['university','college-paths'],['cash reserve','cash-goals'],['grocery','meals'],['meal','meals'],['renovation','renovation'],['retire','retirement'],['mortgage','mortgage'],['down payment','home-savings'],['travel savings','travel-savings'],['compound interest','growth'],['pay raise','raise'],['workout schedule','workout']]) ok(search.search(q)[0].id === id, q);
ok(search.search('').length === search.catalog.length, 'empty lists all');
ok(search.search('  THE calculator! ').length === search.catalog.length, 'stop words list all');
ok(search.search('zzzzxyz').length === 0, 'no result');
ok(search.search('input').every(t => t.id !== 'options'), 'no substring match');
ok(search.search('OPTIONS investing')[0].id === 'options', 'case independent');
ok(search.search('<script>alert(1)</script>').length === 0, 'untrusted query stays data');
for (const tool of search.catalog) {
 const [path, fragment] = tool.href.split('#'); const file = path || 'index.html';
 ok(fs.existsSync(file), 'real route ' + file);
 if (fragment) ok(fs.readFileSync(file,'utf8').includes('id="'+fragment+'"'), 'real fragment '+fragment);
}
const doc = href => ({querySelector: () => href ? {href} : null});
const status = {textContent:''}; const manual = {hidden:true,value:'',focus(){},select(){}};
(async () => {
 ok(share.canonicalURL(doc('https://compoundyourfuture.com/?salary=999#child')) === 'https://compoundyourfuture.com/', 'strips query and fragment');
 ok(share.canonicalURL(doc('https://compoundyourfuture.com/home-renovation-quotes.html?budget=30000#private')) === 'https://compoundyourfuture.com/home-renovation-quotes.html', 'renovation canonical strips private state');
 ok(share.canonicalURL(doc('https://evil.example/')) === null, 'rejects unrelated origin');
 ok(share.canonicalURL(doc(null)) === null, 'requires canonical');
 let payload; await share.share(doc('https://compoundyourfuture.com/options.html?secret=1#private'), {share: async data => { payload=data; }},status,manual);
 ok(payload.url === 'https://compoundyourfuture.com/options.html', 'native canonical only');
 ok(!JSON.stringify(payload).includes('secret'), 'no private input');
 let copied = false; await share.share(doc('https://compoundyourfuture.com/'), {share:async()=>{throw {name:'AbortError'}},clipboard:{writeText:async()=>{copied=true}}},status,manual);
 ok(!copied && status.textContent.includes('canceled'), 'cancel does not copy');
 let copiedText; await share.share(doc('https://compoundyourfuture.com/'),{clipboard:{writeText:async text=>{copiedText=text}}},status,manual);
 ok(copiedText === 'https://compoundyourfuture.com/', 'clipboard fallback');
 await share.share(doc('https://compoundyourfuture.com/'),{share:async()=>{throw Error('not supported')},clipboard:{writeText:async()=>{throw Error('denied')}}},status,manual);
 ok(!manual.hidden && manual.value === 'https://compoundyourfuture.com/', 'manual fallback');
 await share.share(doc(null),{},status,manual); ok(manual.hidden && status.textContent.includes('unavailable'), 'no canonical no share');
 console.log(checks + ' search/sharing checks passed');
})().catch(error => { console.error(error); process.exitCode=1; });
