import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { readFileSync } from 'node:fs';

test('Cloudflare runtime rewrites HTML per hostname without redirects or touching binary assets', async () => {
  const mf = new Miniflare(convertV4MiniflareOptions({
    modules: true, scriptPath: 'src/worker.mjs', compatibilityDate: '2026-10-17',
    serviceBindings: {
      ASSETS: async request => {
        const path = new URL(request.url).pathname;
        if (path === '/brand/logo.svg') return new Response('<svg/>', { headers: { 'Content-Type': 'image/svg+xml', ETag: 'asset-tag' } });
        const page = path === '/privacy/' ? '/privacy/' : '/';
        return new Response(`<!doctype html><link rel="canonical" href="${page}"><meta property="og:url" content="${page}"><link rel="sitemap" href="/sitemap-index.xml">`, { headers: { 'Content-Type': 'text/html', ETag: 'shared-build-tag' } });
      },
    },
  }));
  try {
    for (const origin of ['https://swoovr.app', 'https://swoovr.com']) {
      for (const path of ['/', '/privacy/']) {
        const response = await mf.dispatchFetch(origin + path);
        assert.equal(response.status, 200); assert.equal(response.headers.has('location'), false);
        assert.equal(response.headers.has('etag'), false);
        const html = await response.text();
        assert.ok(html.includes(`rel="canonical" href="${origin}${path}"`));
        assert.ok(html.includes(`property="og:url" content="${origin}${path}"`));
        assert.ok(html.includes(`rel="sitemap" href="${origin}/sitemap-index.xml"`));
      }
    }
    const image = await mf.dispatchFetch('https://swoovr.com/brand/logo.svg');
    assert.equal(await image.text(), '<svg/>'); assert.equal(image.headers.get('etag'), 'asset-tag');
  } finally { await mf.dispose(); }
});

test('built public pages have origin-relative metadata rather than a preferred domain', () => {
  for (const [name, path] of [['index', '/'], ['privacy', '/privacy/']]) {
    const source = readFileSync(`src/pages/${name}.astro`, 'utf8');
    assert.ok(source.includes(`rel="canonical" href="${path}"`));
    assert.ok(!source.includes('rel="canonical" href="https://swoovr.app'));
  }
});
