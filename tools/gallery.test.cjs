const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function setup() {
  let now = 0;
  const context = vm.createContext({window:{}, Date:{now:()=>now}, Math:Object.assign(Object.create(Math), {random:()=>0})});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/gallery.js'), 'utf8'), context);
  return {gallery:context.window.TVGallery, advance:()=>now+=600001};
}
test('gallery rotates, skips broken links and retries after the next interval', () => {
  const {gallery, advance} = setup();
  const first = gallery.current();
  assert.match(first.url, /^https:\/\/lh[0-9]+\.googleusercontent\.com\//);
  assert.ok(first.author);
  gallery.failed(first.url);
  const next = gallery.current();
  assert.notEqual(next.url, first.url);
  let count = 1;
  while (gallery.current()) {gallery.failed(gallery.current().url);count++;}
  assert.equal(count, 8);
  assert.equal(gallery.current(), null);
  advance();
  assert.ok(gallery.current());
});
test('gallery advances an unchanged image after ten minutes', () => {
  const {gallery, advance} = setup();
  const first = gallery.current();
  advance();
  assert.notEqual(gallery.current().url, first.url);
});
