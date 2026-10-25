const fs=require('node:fs'),assert=require('node:assert/strict');
const h=fs.readFileSync('index.html','utf8');
assert.equal((h.match(/class="cyf-life-context"/g)||[]).length,1);
assert.ok(h.indexOf('class="cyf-life-context"')>h.indexOf('id="preview-monthly"'));
assert.ok(h.includes('AI-generated illustration of a fictional family, not customers.'));
assert.ok(h.includes('loading="lazy" decoding="async" alt="Illustration of a multigenerational family sharing a picnic."'));
assert.ok(h.includes('width="1200" height="800"'));
for(const format of ['avif','webp'])for(const width of [480,768,1200]){
 const name='assets/family-life-illustration-'+width+'.'+format;
 assert.ok(fs.existsSync(name));assert.ok(h.includes(name+' '+width+'w'));
}
assert.equal((h.match(/sizes="\(max-width:640px\) calc\(100vw - 44px\), 480px"/g)||[]).length,2);
assert.ok(!/<link[^>]*rel="preload"[^>]*family-life/.test(h));
console.log('PASS one local responsive fictional illustration, caption, alt, dimensions and lazy-loading contract');
