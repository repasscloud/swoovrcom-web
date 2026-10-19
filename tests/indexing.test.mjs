import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';
import routes from '../src/data/published-routes.json' with {type:'json'};
for (const origin of ['https://swoovr.com']) {
  test(`${origin} publishes its own sitemap and robots directive`, async () => {
    const response = await worker.fetch(new Request(origin + '/sitemap.xml'), {});
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/xml/);
    const xml = await response.text();
    assert.ok(xml.includes(`<loc>${origin}/</loc>`));
    assert.ok(xml.includes(`<loc>${origin}/privacy/</loc>`));
    assert.equal((xml.match(/<url>/g) || []).length, routes.length);
    for(const route of routes) assert.ok(xml.includes(`<loc>${origin}${route}</loc>`));
    assert.deepEqual(
      [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]),
      routes.map((route) => `${origin}${route}`),
      'sitemap must contain exactly the published routes',
    );
    const index = await worker.fetch(new Request(origin + '/sitemap-index.xml'), {});
    assert.ok((await index.text()).includes(`<loc>${origin}/sitemap.xml</loc>`));
    const robots = await worker.fetch(new Request(origin + '/robots.txt'), {});
    assert.equal(robots.status, 200);
    assert.ok((await robots.text()).includes(`Sitemap: ${origin}/sitemap-index.xml`));
    assert.equal(response.headers.has('location'), false);
  });
}
test('indexing endpoints support HEAD and reject unsupported methods and hosts', async () => {
  const head = await worker.fetch(new Request('https://swoovr.com/sitemap.xml', { method: 'HEAD' }), {});
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  const post = await worker.fetch(new Request('https://swoovr.com/robots.txt', { method: 'POST' }), {});
  assert.equal(post.status, 405); assert.equal(post.headers.get('allow'), 'GET, HEAD');
  const unknown = await worker.fetch(new Request('https://attacker.example/sitemap.xml'), {});
  assert.equal(unknown.status, 404);
});

test('unconfigured hostnames cannot serve the corporate page or signup endpoint', async () => {
  for (const path of ['/', '/api/waitlist', '/brand/logo.svg']) {
    assert.equal((await worker.fetch(new Request('https://application.invalid' + path), {})).status, 404);
  }
});
