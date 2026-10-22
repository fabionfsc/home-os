// Live installed user apps; Samsung firmware components are not launchable user apps.
(function () {
  'use strict';

  var isTizen = typeof window.tizen !== 'undefined' && window.tizen.application;
  var homeApps = window.TV_HOME_CONFIG.homeApps;
  var INTERNAL_METADATA = ['http://samsung.com/tv/metadata/built-in-app', 'http://samsung.com/tv/metadata/display.hidden'];
  // Older Samsung compatibility wrappers duplicate the installed Apple TV/globoplay apps.
  var LEGACY_ALIASES = ['com.samsung.tv.aria-dummy', 'org.tizen.globoplayaria'];
  var metadataCache = {};
  var panelIcons = window.TV_NATIVE_ICONS || {};

  function userApp(a, ownId) {
    if (!a.id || a.id === ownId || a.show !== true || LEGACY_ALIASES.indexOf(a.id) >= 0) return false;
    if (!a.iconPath || a.iconPath.indexOf('/opt/usr/apps/') !== 0) return false;
    var cacheKey = a.id + '|' + (a.version || '');
    if (Object.prototype.hasOwnProperty.call(metadataCache, cacheKey)) return metadataCache[cacheKey];
    try {
      var metadata = tizen.application.getAppMetaData(a.id);
      var visible = !metadata.some(function (m) { return INTERNAL_METADATA.indexOf(m.key) >= 0 && m.value === 'true'; });
      metadataCache[cacheKey] = visible;
      return visible;
    } catch (e) {
      // Fail closed: unreadable system entries must never become suggested applications.
      return false;
    }
  }

  function tr(key, values) {
    if (window.TVI18n) return window.TVI18n.text(key, values);
    return key.replace('{name}', values ? values.name : '{name}');
  }

  function selfId() {
    try { return tizen.application.getCurrentApplication().appInfo.id; } catch (e) { return ''; }
  }

  function iconUrl(p) {
    if (!p) return '';
    return p.charAt(0) === '/' ? 'file://' + p : p;
  }

  function list() {
    if (!isTizen) {
      // Desktop preview uses only an explicitly synchronized inventory, never invented apps.
      return Promise.resolve((window.HOME_OS_PREVIEW_APPS || []).map(function (a) {
        return { id: a.id, name: a.name, icon: a.icon || null };
      }));
    }
    return new Promise(function (resolve, reject) {
      tizen.application.getAppsInfo(function (infos) {
        var ownId = selfId();
        var apps = infos.filter(function (a) {
          return userApp(a, ownId);
        }).map(function (a) {
          var home = homeApps.filter(function (h) { return h.id === a.id; })[0];
          var cached = panelIcons[a.id] && '/opt/share/webappservice/apps_icon/all/' + panelIcons[a.id] + '/304x304.png';
          var candidates = [cached, a.iconPath].filter(Boolean).map(iconUrl);
          return { id: a.id, name: home && home.name ? home.name : a.name, icon: candidates[0], icons: candidates };
        });
        resolve(apps.concat(homeApps.filter(function (a) { return a.source; })));
      }, function (err) { reject(new Error(err && err.message || 'Could not read installed apps')); });
    });
  }

  function launch(id) {
    if (!isTizen) return Promise.reject(new Error(tr('Preview mode: apps only open on the TV')));
    return new Promise(function (resolve, reject) {
      var input = homeApps.filter(function (a) { return a.id === id && a.source; })[0];
      if (input) {
        tizen.systeminfo.getPropertyValue('VIDEOSOURCE', function (video) {
          var source = video.connected.filter(function (s) {
            return s.type === input.source.type && s.number === input.source.number;
          })[0];
          if (!source) { reject(new Error(tr('{name} is not connected', { name: input.name }))); return; }
          try {
            tizen.tvwindow.setSource(source, function () {
              try { tizen.application.getCurrentApplication().hide(); resolve(); } catch (e) { reject(e); }
            }, reject, 'MAIN');
          } catch (e) { reject(e); }
        }, reject);
        return;
      }
      tizen.application.launch(id, resolve, function (err) { reject(new Error(err && err.message || 'launch failed')); });
    });
  }

  function exit() {
    if (isTizen) { try { tizen.application.getCurrentApplication().exit(); } catch (e) { /* already exiting */ } }
  }

  function systemHome() {
    if (!isTizen) return Promise.reject(new Error(tr('Preview mode: apps only open on the TV')));
    return new Promise(function (resolve, reject) {
      tizen.application.launch('com.samsung.tv.csfs', resolve, reject);
    });
  }

  function watch(onChange) {
    if (!isTizen || !tizen.package) return false;
    try {
      var changed = function () { metadataCache = {}; onChange(); };
      tizen.package.setPackageInfoEventListener({ oninstalled: changed, onupdated: changed, onuninstalled: changed });
      return true;
    } catch (e) { return false; }
  }

  window.TVApps = { list: list, launch: launch, exit: exit, systemHome: systemHome, watch: watch, isTizen: !!isTizen };
})();
