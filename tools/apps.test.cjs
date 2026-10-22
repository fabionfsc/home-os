const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

// A fixed lineup, so these tests do not depend on what js/config.js pins.
const HOME_APPS = [
  { id: 'example.iptv', name: 'IPTV' },
  { id: 'org.tizen.netflix-app', name: 'Netflix', icon: 'css/app-icons/netflix.png' },
  { id: 'input.hdmi1', name: 'Game console', icon: 'css/app-icons/hdmi.svg', source: { type: 'HDMI', number: 1 } },
  { id: 'input.hdmi2', name: 'HDMI 2', icon: 'css/app-icons/hdmi.svg', source: { type: 'HDMI', number: 2 } }
];

function app(tizen, homeApps = HOME_APPS, inventory = []) {
  const context = vm.createContext({ tizen, window: { tizen, TV_HOME_CONFIG: { homeApps }, HOME_OS_PREVIEW_APPS: inventory } });
  vm.runInContext(fs.readFileSync(path.join(root, 'js', 'native-icons.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js', 'apps.js'), 'utf8'), context);
  return context.window;
}

function tv(options = {}) {
  const calls = [];
  let listener;
  const device = {
    application: {
      getCurrentApplication: () => ({ appInfo: { id: 'TvHomeLnch.Home' }, hide: () => calls.push('hide') }),
      getAppsInfo: (ok, fail) => options.listError ? fail(options.listError) : ok(options.apps || []),
      getAppMetaData: id => options.metadata && options.metadata[id] || [],
      launch: (id, ok) => { calls.push(id); ok(); }
    },
    package: { setPackageInfoEventListener: value => { listener = value; } },
    systeminfo: {
      getPropertyValue: (key, ok, fail) => {
        assert.equal(key, 'VIDEOSOURCE');
        if (options.sourceError) return fail(options.sourceError);
        ok({ connected: options.sources || [{ type: 'HDMI', number: 1 }, { type: 'HDMI', number: 2 }] });
      }
    },
    tvwindow: {
      setSource: (source, ok, fail, window) => {
        assert.equal(window, 'MAIN');
        calls.push({ ...source });
        if (options.switchError) return fail(options.switchError);
        ok();
      }
    }
  };
  return { api: app(device).TVApps, calls, event: kind => listener[kind]() };
}

test('shipped config loads and every icon it names is bundled', () => {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(root, 'js', 'config.js'), 'utf8'), context);
  const config = context.window.TV_HOME_CONFIG;
  assert.ok(config.location.name && Number.isFinite(config.location.latitude) && Number.isFinite(config.location.longitude));
  for (const pinned of config.homeApps) if (pinned.icon) assert.ok(fs.statSync(path.join(root, pinned.icon)).size > 0, pinned.icon);
});

test('preview uses only an explicit real inventory', async () => {
  const window = app(undefined, HOME_APPS, [{id:'installed.one',name:'Installed One'}]);
  const tiles = await window.TVApps.list();
  assert.deepEqual(Array.from(tiles, tile => tile.name), ['Installed One']);
  await assert.rejects(window.TVApps.launch(tiles[0].id), /Preview mode/);
});

test('preview never invents an app when inventory is unavailable', async () => {
  const tiles = await app(undefined, []).TVApps.list();
  assert.equal(tiles.length, 0);
});

test('only visible user-installed apps survive system filtering; pins cannot expose hidden services', async () => {
  const { api } = tv({ apps: [
    { id: 'TvHomeLnch.Home', show: true },
    { id: 'system.hidden', show: false },
    { id: 'org.tizen.netflix-app', name: 'Old name', iconPath: '/opt/usr/apps/netflix/icon.png', show: true },
    { id: 'other.visible', name: 'Other', iconPath: '/opt/usr/apps/other/icon.png', show: true },
    { id: 'internal.visible', name: 'Billing', iconPath: '/opt/usr/apps/billing/icon.png', show: true },
    { id: 'native.visible', name: 'Native service', iconPath: '/usr/apps/native/icon.png', show: true },
    { id: 'com.samsung.tv.aria-dummy', name: 'Apple TV', iconPath: '/opt/usr/apps/dummy/icon.png', show: true }
  ], metadata: { 'internal.visible': [{key:'http://samsung.com/tv/metadata/built-in-app',value:'true'}] } });
  const tiles = await api.list();
  assert.deepEqual(Array.from(tiles, tile => tile.id), [
    'org.tizen.netflix-app', 'other.visible', 'input.hdmi1', 'input.hdmi2'
  ]);
  assert.equal(tiles[0].name, 'Netflix');
  assert.equal(tiles[0].icon, 'file:///opt/share/webappservice/apps_icon/all/3201907018807/304x304.png');
  assert.equal(tiles[0].icons[tiles[0].icons.length - 1], 'file:///opt/usr/apps/netflix/icon.png');
  assert.equal(tiles[1].icons[tiles[1].icons.length - 1], 'file:///opt/usr/apps/other/icon.png');
});

test('Samsung panel cache takes precedence over generic application icons', async () => {
  const tizen = {
    application: {
      getCurrentApplication: () => ({appInfo:{id:'Sala'}}),
      getAppMetaData: () => [],
      getAppsInfo: ok => ok([{id:'9Ur5IzDKqV.TizenYouTube',name:'YouTube',show:true,iconPath:'/opt/usr/apps/youtube/generic.png'}])
    }
  };
  const api = app(tizen, []).TVApps;
  const tiles = await api.list();
  assert.equal(tiles[0].icon, 'file:///opt/share/webappservice/apps_icon/all/111299001912/304x304.png');
  assert.equal(tiles[0].icons[tiles[0].icons.length - 1], 'file:///opt/usr/apps/youtube/generic.png');
});

test('every refresh reads the live API; install/remove events trigger refresh without any SDK inventory', async () => {
  const options = {apps:[{id:'first.app',name:'First',show:true,iconPath:'/opt/usr/apps/first/icon.png'}]};
  const {api,event} = tv(options);
  assert.equal((await api.list()).filter(a=>!a.source).length, 1);
  let updates = 0;
  assert.equal(api.watch(()=>updates++), true);
  options.apps.push({id:'new.app',name:'New',show:true,iconPath:'/opt/usr/apps/new/icon.png'});
  event('oninstalled');
  assert.ok((await api.list()).some(a=>a.id==='new.app'));
  options.apps.splice(0,1);
  event('onuninstalled');
  assert.ok(!(await api.list()).some(a=>a.id==='first.app'));
  assert.equal(updates, 2);
});

test('regular apps launch by exact installed ID', async () => {
  const { api, calls } = tv();
  await api.launch('example.iptv');
  assert.deepEqual(calls, ['example.iptv']);
});

test('HDMI selection uses the matching connected source and then hides Home', async () => {
  const { api, calls } = tv();
  await api.launch('input.hdmi2');
  assert.deepEqual(calls, [{ type: 'HDMI', number: 2 }, 'hide']);
});

test('disconnected HDMI leaves Home visible', async () => {
  const { api, calls } = tv({ sources: [{ type: 'HDMI', number: 2 }] });
  await assert.rejects(api.launch('input.hdmi1'), /Game console is not connected/);
  assert.deepEqual(calls, []);
});

test('source lookup and switch errors leave Home visible', async () => {
  for (const options of [{ sourceError: new Error('lookup failed') }, { switchError: new Error('switch failed') }]) {
    const { api, calls } = tv(options);
    await assert.rejects(api.launch('input.hdmi1'), /failed/);
    assert.ok(!calls.includes('hide'));
  }
});

test('app inventory errors propagate', async () => {
  await assert.rejects(tv({ listError: { message: 'access denied' } }).api.list(), /access denied/);
});
