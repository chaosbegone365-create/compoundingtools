/* LOCAL integration helper: run from the review checkout, never publishes. */
'use strict';
const fs = require('node:fs');
const pages = [...new Set(require('../assets/tool-search.js').catalog.map(t=>t.href.split('#')[0]).filter(Boolean))];
const markup = '<section class="share-tool" aria-label="Share this page"><button type="button" data-share-tool>Share this page ↗</button><p>Share a useful tool, not your personal information. Only the page link is shared—not your inputs or results.</p><p data-share-status role="status" aria-live="polite"></p><input data-share-link aria-label="Page link to copy" readonly hidden></section>';
for (const path of pages) {
 let html = fs.readFileSync(path,'utf8');
 if (html.includes('data-share-tool')) continue;
 if (!html.includes('</head>') || !html.includes('</body>') || !html.includes('<footer')) throw Error('Unexpected page structure: ' + path);
 html = html.replace('</head>', '<link rel="stylesheet" href="assets/tool-discovery.css"></head>');
 html = html.replace(/<footer\b/, markup + '<footer');
 html = html.replace('</body>', '<script src="assets/share-tools.js"></script></body>');
 fs.writeFileSync(path, html);
 console.log('Added explicit share control: '+path);
}
