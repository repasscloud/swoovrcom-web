import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import config from '../site.config.json' with {type:'json'};
test('draft articles are absent from production routes, listings and sitemap manifest',()=>{
 const routes=JSON.parse(readFileSync('src/data/published-routes.json'));
 const news=readFileSync('dist/news/index.html','utf8');
 for(const file of readdirSync('src/content/news')) {
  const source=readFileSync('src/content/news/'+file,'utf8');
  if(/^draft: true$/m.test(source)){
   const slug=file.replace(/\.md$/,'');assert.ok(!routes.includes(`/news/${slug}/`));assert.ok(!existsSync(`dist/news/${slug}/index.html`));assert.ok(!news.includes(slug));
  }
 }
});
test('published route links resolve and all pages include shared footer and social channels',()=>{
 const routes=JSON.parse(readFileSync('src/data/published-routes.json'));
 for(const route of routes){
  const html=readFileSync(`dist${route}index.html`,'utf8');
  for(const match of html.matchAll(/href="(\/[^"#?]*)(?:[?#][^"]*)?"/g)){
   const path=match[1];if(path.startsWith('/_') || path.startsWith('/api/') || /\.[a-z]+$/i.test(path))continue;
   assert.ok(routes.includes(path),`${route} links to ${path}`);
  }
  assert.ok(html.includes('https://x.com/swoovrapp'));assert.ok(html.includes('https://www.instagram.com/swoovr.app/'));
 }
 assert.ok(config.cities.includes('Adelaide'));assert.ok(config.cities.includes('Other'));
});
