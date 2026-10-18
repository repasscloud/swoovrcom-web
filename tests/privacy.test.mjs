import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../src/components/PrivacyChoices.astro', import.meta.url), 'utf8').match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
function fixture(stored = null, gpc = false, hostname = 'swoovr.com') {
  const callbacks = {}; const scripts = []; const cookies = []; let reloads = 0; let choice = stored;
  const elements = Object.fromEntries(['privacy-panel','privacy-allow','privacy-deny','open'].map(id => [id, { hidden: true, focus() {}, addEventListener: (event, fn) => { callbacks[id] = fn; } }]));
  const document = { getElementById: id => elements[id], querySelector: () => elements.open, createElement: () => ({}), head: { appendChild: script => scripts.push(script.src) } };
  Object.defineProperty(document, 'cookie', { get: () => '_ga=old; _ga_TEST=old', set: value => cookies.push(value) });
  const context = { gaIds: { 'swoovr.com': 'G-COM123' }, document, navigator: { globalPrivacyControl: gpc }, location: { origin: 'https://' + hostname, pathname: '/', hostname, reload: () => reloads++ }, localStorage: { getItem: () => choice, setItem: (_, value) => { choice = value; } }, Date, encodeURIComponent };
  context.window = { addEventListener() {} };
  vm.runInNewContext(source, context);
  return { scripts, callbacks, cookies, elements, context, get reloads() { return reloads; }, get choice() { return choice; } };
}
test('analytics makes no tag request before affirmative consent or on refusal', () => {
  const f = fixture(); assert.deepEqual(f.scripts, []); assert.equal(f.elements['privacy-panel'].hidden, false);
  f.callbacks['privacy-deny'](); assert.deepEqual(f.scripts, []); assert.equal(f.choice, 'denied');
});
test('grant loads once, uses clean URLs; withdrawal disables and unloads tags', () => {
  const f = fixture(); f.callbacks['privacy-allow'](); f.callbacks['privacy-allow']();
  assert.equal(f.scripts.length, 1);
  const events = f.context.window.dataLayer.map(args => Array.from(args));
  const page = events.find(args => args[0] === 'event')[2];
  assert.equal(page.page_location, 'https://swoovr.com/'); assert.equal(page.page_referrer, '');
  f.callbacks['privacy-deny']();
  assert.equal(f.context.window['ga-disable-G-COM123'], true); assert.equal(f.reloads, 1); assert.equal(f.choice, 'denied');
  assert.ok(f.cookies.some(cookie => cookie.startsWith('_ga=;')));
});
test('stored grant loads analytics; GPC overrides a stored grant', () => {
  assert.equal(fixture('granted').scripts.length, 1);
  const f = fixture('granted', true); assert.deepEqual(f.scripts, []); assert.equal(f.choice, 'denied');
});
test('privacy control reopens choices and blocked storage keeps analytics off', () => {
  const f = fixture('denied'); f.callbacks.open(); assert.equal(f.elements['privacy-panel'].hidden, false);
  const sourceWithStorageFailure = source.replace('localStorage.getItem(key)', '(()=>{throw new Error("blocked")})()');
  const g = fixture('denied'); vm.runInNewContext(sourceWithStorageFailure, g.context); assert.deepEqual(g.scripts, []);
});
test('a visitor can allow analytics after initially refusing on the same page', () => {
  const f = fixture(); f.callbacks['privacy-deny'](); f.callbacks.open(); f.callbacks['privacy-allow']();
  assert.equal(f.context.window['ga-disable-G-COM123'], false);
  assert.equal(f.scripts.length, 1);
});

test('analytics selects the serving hostname and never falls back to another stream', () => {
  assert.equal(fixture('granted').scripts[0], 'https://www.googletagmanager.com/gtag/js?id=G-COM123');
  assert.equal(fixture('granted', false, 'swoovr.com').scripts[0], 'https://www.googletagmanager.com/gtag/js?id=G-COM123');
  assert.equal(fixture('granted', false, 'localhost').scripts.length, 0);
});
