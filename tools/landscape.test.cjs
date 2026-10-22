const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function setup() {
  const images = [];
  const context = vm.createContext({
    window: {},
    Image: function () { images.push(this); }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/landscape.js'), 'utf8'), context);
  const layers = [{ style: {} }, { style: {} }];
  const element = { dataset: {}, querySelectorAll: () => layers };
  return { ...context.window.TVLandscape, images, layers, element };
}

test('landscape follows clear, cloud, rain, fog, storm and snow conditions', () => {
  const { select } = setup();
  for (const [kind, asset] of [['clear','clear'], ['partly','clear'], ['cloudy','overcast'],
    ['rain','rainy-day'], ['drizzle','rainy-day'], ['fog','overcast'], ['storm','rainy-day'], ['snow','snow']]) {
    assert.equal(select({ phase: 'day', kind, cloud: 0.3 }).asset, asset);
  }
  assert.equal(select({ phase: 'day', kind: 'clear', cloud: 0.9 }).asset, 'overcast');
});

test('night uses dedicated cloud and rain images, retaining the snowy fallback', () => {
  const { select } = setup();
  assert.equal(select({ phase: 'night', kind: 'clear', cloud: 0 }).asset, 'night');
  for (const [kind, asset] of [['cloudy','cloudy-night'], ['fog','cloudy-night'],
    ['rain','rainy-night'], ['drizzle','rainy-night'], ['storm','rainy-night']]) {
    const scene = select({ phase: 'night', kind, cloud: 0.3 });
    assert.equal(scene.asset, asset);
    assert.equal(scene.filter, 'none', 'night photos must not be darkened twice');
  }
  assert.equal(select({ phase: 'night', kind: 'partly', cloud: 0.9 }).asset, 'cloudy-night');
  assert.equal(select({ phase: 'night', kind: 'partly', cloud: 0.3 }).asset, 'night');
  const snow = select({ phase: 'night', kind: 'snow', cloud: 1 });
  assert.equal(snow.asset, 'snow');
  assert.match(snow.filter, /brightness\(0.3\)/);
});

test('dawn and dusk keep rain scenery and every selected image is bundled', () => {
  const { select } = setup();
  for (const phase of ['day', 'night', 'dawn', 'dusk']) {
    for (const kind of ['clear', 'partly', 'cloudy', 'fog', 'drizzle', 'rain', 'storm', 'snow']) {
      const scene = select({ phase, kind, cloud: 0.5 });
      const file = path.join(__dirname, '../css/landscapes', scene.asset + '.png');
      assert.ok(fs.statSync(file).size > 0, file);
      if (phase === 'dawn' || phase === 'dusk') {
        if (kind === 'rain') assert.equal(scene.asset, 'rainy-day');
        assert.match(scene.filter, /brightness\(0.7\)/);
      }
    }
  }
});

test('late image loads cannot replace newer weather', () => {
  const s = setup();
  s.render(s.element, { phase: 'day', kind: 'clear' });
  s.render(s.element, { phase: 'day', kind: 'rain' });
  s.images[1].onload();
  s.images[0].onload();
  assert.equal(s.element.dataset.scene, 'rainy-day');
  assert.ok(s.layers.some(layer => layer.style.opacity === '1'));
});

test('failed images reveal the procedural fallback and allow a retry', () => {
  const s = setup();
  s.render(s.element, { phase: 'day', kind: 'clear' });
  s.images[0].onload();
  s.render(s.element, { phase: 'day', kind: 'snow' });
  s.images[1].onerror();
  assert.ok(s.layers.every(layer => layer.style.opacity === '0'));
  assert.equal(s.element.dataset.scene, undefined);
  s.render(s.element, { phase: 'day', kind: 'snow' });
  assert.equal(s.images.length, 3);
});
