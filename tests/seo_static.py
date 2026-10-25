"""Dependency-free technical SEO checks; no ranking or live HTTP claims.
Run: python tests/seo_static.py [site-directory]
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import sys
import xml.etree.ElementTree as ET

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
BASE = 'https://compoundyourfuture.com/'
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.links=[]; self.ids=set(); self.canonicals=[]; self.descriptions=[]; self.robots=[]; self.title=''; self.in_title=False
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.add(a['id'])
        if tag == 'a' and a.get('href'): self.links.append(a['href'])
        if tag == 'link' and a.get('rel') == 'canonical': self.canonicals.append(a.get('href'))
        if tag == 'meta' and a.get('name') == 'description': self.descriptions.append(a.get('content',''))
        if tag == 'meta' and a.get('name') == 'robots': self.robots.append(a.get('content',''))
        if tag == 'title': self.in_title=True
    def handle_endtag(self,tag):
        if tag=='title': self.in_title=False
    def handle_data(self,data):
        if self.in_title:self.title+=data
pages={p.name:Page(p.read_text()) for p in ROOT.glob('*.html')}
assert pages, 'No HTML pages found'
seen_titles=set(); seen_descriptions=set(); link_count=0
for name,p in pages.items():
    assert p.canonicals==[BASE+('' if name=='index.html' else name)], (name,'canonical')
    assert p.title and p.title not in seen_titles,(name,'missing/duplicate title')
    seen_titles.add(p.title)
    assert len(p.descriptions)==1 and p.descriptions[0].strip(),(name,'description')
    assert p.descriptions[0] not in seen_descriptions,(name,'duplicate description')
    seen_descriptions.add(p.descriptions[0])
    for href in p.links:
        assert ' ' not in href,(name,'space in URL',href)
        u=urlsplit(href)
        if u.scheme or u.netloc: continue
        path=unquote(u.path)
        target=(Path(name).parent/path).as_posix() if path else name
        if target in ('.','./'):target='index.html'
        if target.endswith('/'):target+='index.html'
        assert (ROOT/target).is_file(),(name,'missing local target',href)
        if u.fragment and target in pages: assert unquote(u.fragment) in pages[target].ids,(name,'missing fragment',href)
        link_count+=1
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls=[e.text for e in ET.parse(ROOT/'sitemap.xml').findall('s:url/s:loc',ns)]
expected={p.canonicals[0] for p in pages.values() if not any('noindex' in r for r in p.robots)}
assert len(urls)==len(set(urls)) and set(urls)==expected,'Sitemap mismatch/duplicate'
assert all(u.startswith(BASE) and not urlsplit(u).fragment for u in urls),'Bad sitemap URL'
assert 'Sitemap: '+BASE+'sitemap.xml' in (ROOT/'robots.txt').read_text(),'Robots sitemap mismatch'
for name in ['options.html','compare-performance.html','privacy.html','terms.html']:
    assert any('noindex' in r for r in pages[name].robots),(name,'beta/legal noindex lost')
print(f'PASS: {len(pages)} unique titles/descriptions/canonicals; {len(urls)} indexable sitemap URLs; {link_count} local links/fragments; noindex preserved.')
