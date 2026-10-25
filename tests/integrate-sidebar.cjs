/* Run from the repository root after integrating the final search catalog. */
const fs = require('node:fs');
const path = require('node:path');
const { catalog } = require('../assets/tool-search.js');
const groups = [ ['Money','Money & investing','money.html'], ['Career','Career & compensation','career.html'], ['Family','Family & education','family.html'], ['Travel','Travel & vacations','travel.html'], ['Health','Health & fitness','health.html'], ['Home','Home & renovation','home.html'] ];
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(page) {
  function link(href, label) {
    const resolved = href.startsWith('#') ? 'index.html'+href : href;
    if (!/^[a-z0-9-]+\.html(?:#[a-z0-9-]+)?$/.test(resolved)) throw Error('Unsafe catalog route '+resolved);
    if (!fs.existsSync(path.resolve(resolved.split('#')[0]))) throw Error('Missing catalog route '+resolved);
    return `<a href="${escape(resolved)}"${resolved === page ? ' aria-current="page"' : ''}>${escape(label)}</a>`;
  }
  return `<!-- cyf-sidebar:start -->
<div id="cyf-navigation-shell">
<button id="cyf-menu-toggle" class="cyf-menu-toggle" type="button" aria-controls="cyf-sidebar" aria-expanded="false"><span aria-hidden="true">☰</span> Explore tools</button>
<div class="cyf-nav-backdrop" hidden></div>
<aside id="cyf-sidebar" aria-label="Explore Compound Your Future">
<div class="cyf-sidebar-heading"><span>Make your next move</span><button type="button" class="cyf-menu-close" aria-label="Close navigation">×</button></div>
<nav aria-label="Calculator categories">
${link('index.html', 'All tools & search')}
${groups.map(([key,label,hub]) => `<details${hub === page || catalog.some(t=>t.category===key && t.href===page) ? ' open' : ''}><summary>${escape(label)}</summary><div class="cyf-category-links">${link(hub,'Explore '+label.toLowerCase())}${catalog.filter(t=>t.category===key).map(t=>link(t.href,t.name)).join('')}</div></details>`).join('\n')}
</nav>
<nav class="cyf-sidebar-about" aria-label="About this website">${link('about.html','Our mission')}${link('methodology.html','How our tools work')}</nav>
<p class="cyf-sidebar-note">Free tools. Clear assumptions.<br>Better everyday decisions.</p>
</aside></div>
<!-- cyf-sidebar:end -->`;
}
function integrate() {
 for (const file of fs.readdirSync('.').filter(f=>f.endsWith('.html'))) {
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/\n?<!-- cyf-sidebar:start -->[\s\S]*?<!-- cyf-sidebar:end -->\n?/g,'\n');
  html=html.replace(/\n?<link rel="stylesheet" href="assets\/site-sidebar.css">/g,'').replace(/\n?<script src="assets\/site-sidebar.js" defer><\/script>/g,'');
  html=html.replace(/\s*<\/head>/,'<link rel="stylesheet" href="assets/site-sidebar.css">\n<script src="assets/site-sidebar.js" defer></script>\n</head>');
  html=html.replace(/(<body\b[^>]*>)\s*/i, (_, tag)=>tag+'\n'+render(file)+'\n');
  fs.writeFileSync(file,html);
 }
}
if (require.main === module) integrate();
module.exports={groups,render,integrate};
