import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';
for (const origin of ['https://swoovr.app', 'https://swoovr.com']) {
  test(`${origin} publishes its own sitemap and robots directive`, async () => {
    const response = await worker.fetch(new Request(origin + '/sitemap.xml'), {});
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/xml/);
    const xml = await response.text();
    assert.ok(xml.includes(`<loc>${origin}/</loc>`));
    assert.ok(xml.includes(`<loc>${origin}/privacy/</loc>`));
    assert.ok(!xml.includes(origin.endsWith('.app') ? 'https://swoovr.com' : 'https://swoovr.app'));
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
