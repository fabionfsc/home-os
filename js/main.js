(function () {
  'use strict';

  var CFG = window.TV_HOME_CONFIG, I = window.TVIcons, W = window.TVWeather;
  var homeIds = CFG.homeApps.map(function (a) { return a.id; });
  var nodes = {};
  var $ = function (id) { return nodes[id] || (nodes[id] = document.getElementById(id)); };
  function setText(id, value) { var el = $(id); if (el.textContent !== value) el.textContent = value; }
  var SETTINGS_KEY = 'tvhome.settings.v2';

  var L = window.TVI18n, tr = L.text;
  var settings = loadSettings();
  settings.language = L.setLanguage(settings.language);
  saveSettings();
  var weather = W.cached(CFG.location);
  var weatherError = null, lastAttempt = 0, weatherRequest = null;
  var allApps = [], shownApps = [];
  var appRefresh = null, appChangeTimer = 0, appsSignature = '';
  var precip = window.TVSky.Precip($('precip'), $('flash'));
  var scope = $('home'), focused = null, homeFocus = null, rowOffset = 0, skyKey = '';

  // ---------- settings ----------
  function loadSettings() {
    var s = {};
    try {
      var stored = localStorage.getItem(SETTINGS_KEY);
      s = JSON.parse(stored || localStorage.getItem('tvhome.settings.v1')) || {};
      // Move this TV's earlier Portuguese install to pt-BR once; keep other preferences.
      if (!stored && s.language === 'pt-PT') s.language = 'pt-BR';
    } catch (e) { /* use defaults */ }
    var out = {};
    Object.keys(CFG.defaults).forEach(function (k) { out[k] = k in s ? s[k] : CFG.defaults[k]; });
    return out;
  }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* not persisted */ }
  }

  // ---------- formatting ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtTime(d) {
    if (settings.clock === '24') return pad(d.getHours()) + ':' + pad(d.getMinutes());
    var h = d.getHours() % 12 || 12;
    return h + ':' + pad(d.getMinutes()) + ' ' + (d.getHours() < 12 ? 'AM' : 'PM');
  }
  function fmtHour(d) {
    if (settings.clock === '24') return pad(d.getHours()) + ':00';
    var h = d.getHours() % 12 || 12;
    return h + (d.getHours() < 12 ? ' AM' : ' PM');
  }
  function temp(c) { return Math.round(settings.unit === 'F' ? c * 9 / 5 + 32 : c) + '°'; }
  function wind(k) { return settings.unit === 'F' ? Math.round(k * 0.621) + ' mph' : Math.round(k) + ' km/h'; }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  var dateFmt = new Intl.DateTimeFormat(settings.language, { weekday: 'long', day: 'numeric', month: 'long' });
  var dayFmt = new Intl.DateTimeFormat(settings.language, { weekday: 'short' });
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- time of day ----------
  function today(now) { return weather && weather.daily.filter(function (d) { return sameDay(d.date, now); })[0]; }
  function sunTimes(now) {
    var t = today(now);
    if (t) return { rise: t.sunrise, set: t.sunset };
    var r = new Date(now), s = new Date(now);
    r.setHours(7, 30, 0, 0); s.setHours(19, 0, 0, 0);
    return { rise: r, set: s };
  }
  function phase(now) {
    if (settings.scenery !== 'auto') return settings.scenery;
    var st = sunTimes(now), t = now.getTime(), m = 40 * 60e3;
    if (Math.abs(t - st.rise) < m) return 'dawn';
    if (Math.abs(t - st.set) < m) return 'dusk';
    return t > st.rise && t < st.set ? 'day' : 'night';
  }
  function period(h) { return h < 5 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : h < 22 ? 'evening' : 'night'; }

  var MOOD = {
    clear: ['Clear skies and sunshine over {p}.', 'Clear skies tonight. The evening is yours.'],
    partly: ['A mix of sun and cloud today.', 'A few clouds drifting by. Settle in.'],
    cloudy: ['Grey skies. A good day for a series.', 'Cloudy and calm. Settle in.'],
    fog: ['Foggy out there. Stay cosy.', 'Fog rolling in tonight. Stay cosy.'],
    drizzle: ['A little drizzle outside.', 'Light drizzle tonight. Settle in.'],
    rain: ['Rain today. Perfect for staying in.', 'Rain outside. The evening is yours.'],
    snow: ['Snow outside. Stay warm.', 'Snow falling tonight. Stay warm.'],
    storm: ['Thunderstorms around. Stay in and stay dry.', 'Storms tonight. Stay in and stay dry.']
  };
  var FALLBACK = { morning: 'A fresh start. Take it easy.', afternoon: 'Take a break. You have earned it.',
    evening: 'Settle in. The evening is yours.', night: 'Late one? Keep it cosy.' };

  // ---------- rendering ----------
  function renderClock(now) {
    setText('clock', fmtTime(now));
    setText('date', dateFmt.format(now));
    var p = period(now.getHours());
    setText('greet', tr('Good ' + p + '.'));

    var sub = tr(FALLBACK[p]);
    if (weather) {
      var d = W.describe(weather.current.code), dayish = p === 'morning' || p === 'afternoon';
      sub = tr(MOOD[d.kind][dayish ? 0 : 1], { p: CFG.location.name });
    }
    $('sub').textContent = sub;

    var st = sunTimes(now), line = '';
    if (weather) {
      if (now < st.rise) line = I.ui.sunrise + tr('Sunrise at {time}', { time: fmtTime(st.rise) });
      else if (now < st.set) line = I.ui.sunset + tr('Sunset at {time}', { time: fmtTime(st.set) });
      else {
        var tm = weather.daily[1];
        line = tm ? I.ui.sunrise + tr('Sunrise tomorrow at {time}', { time: fmtTime(tm.sunrise) }) : '';
      }
    }
    $('sunline').innerHTML = line;

    if (!$('ambient').hidden) renderAmbient(now);
  }

  function renderWeather() {
    $('wxStatus').textContent = weather && weatherError ? tr('Offline · showing last forecast') : '';
    var now = new Date();
    if (!weather) {
      $('wxCond').textContent = weatherError ? tr('Weather unavailable') : tr('Loading weather…');
      $('wxDetails').textContent = weatherError ? tr('Retrying shortly') : '';
      return;
    }
    var c = weather.current, d = W.describe(c.code), t = today(now) || weather.daily[0];
    $('wxIcon').innerHTML = I.weather(d.kind, c.isDay);
    $('wxTemp').textContent = temp(c.temp);
    $('wxCond').textContent = d.label;
    $('wxHilo').textContent = t ? tr('H {high}   L {low}', { high: temp(t.max), low: temp(t.min) }) : '';
    var stale = Date.now() - weather.fetchedAt > 60 * 60e3;
    $('wxDetails').innerHTML = tr('Feels') + ' ' + temp(c.feels) + '<i></i>' + tr('Wind') + ' ' + wind(c.wind) + '<i></i>' + tr('Humidity') + ' ' +
      Math.round(c.humidity) + '%' + (stale ? '<i></i>' + tr('Updated') + ' ' + fmtTime(new Date(weather.fetchedAt)) : '');
    var hours = weather.hourly.filter(function (h) { return h.time > now; }).slice(0, 6);
    $('wxHours').innerHTML = hours.map(function (h) {
      var hd = W.describe(h.code);
      return '<div class="hr"><span>' + fmtHour(h.time) + '</span>' + I.weather(hd.kind, h.isDay) +
        '<b>' + temp(h.temp) + '</b></div>';
    }).join('');
  }

  function renderSky(now) {
    document.body.dataset.performance = settings.performance;
    precip.quality(settings.performance);
    var ph = phase(now), cur = weather ? weather.current : null;
    var d = cur ? W.describe(cur.code) : { kind: 'clear', intensity: 0 };
    var cloud = cur ? cur.cloud : 0.1;
    var key = [ph, Math.round(cloud * 10), d.kind, now.getDate(), settings.wallpaper, Math.floor(Date.now() / 600000)].join('|');
    if (key !== skyKey) {
      skyKey = key;
      window.TVSky.render($('sky'), { phase: ph, cloud: cloud, kind: d.kind, date: now });
      document.body.dataset.phase = ph;
    }
    window.TVLandscape.render($('landscape'), { phase: ph, cloud: cloud, kind: d.kind, wallpaper: settings.wallpaper });
    precip.set(settings.effects ? d.kind : null, d.intensity);
  }

  function renderAll() {
    var now = new Date();
    renderClock(now);
    renderWeather();
    renderSky(now);
  }

  // ---------- apps ----------
  function rank(a) {
    var homeIndex = homeIds.indexOf(a.id);
    if (homeIndex >= 0) return homeIndex;
    var hay = (a.id + ' ' + a.name).toLowerCase();
    for (var i = 0; i < CFG.favoriteOrder.length; i++) if (hay.indexOf(CFG.favoriteOrder[i]) >= 0) return homeIds.length + i;
    return 999;
  }
  function sortApps(list) {
    return list.slice().sort(function (a, b) { return rank(a) - rank(b) || a.name.localeCompare(b.name, settings.language); });
  }

  function renderGrid() {
    var hidden = settings.hidden;
    shownApps = sortApps(allApps).filter(function (a) { return hidden.indexOf(a.id) < 0; });
    var grid = $('grid');
    grid.innerHTML = '';
    shownApps.forEach(function (a, i) {
      var tile = document.createElement('button');
      tile.className = 'tile focusable plain';
      tile.dataset.app = a.id;
      tile.dataset.idx = i;
      tile.setAttribute('aria-label', a.name);
      if (a.icon) {
        var img = appImage(a, tile);
        tile.insertBefore(img, tile.firstChild);
      } else tile.classList.add('no-icon');
      grid.appendChild(tile);
    });
    if (!shownApps.length) grid.innerHTML = '<div class="empty"><div>' + tr(allApps.length ? 'No apps selected' : 'No installed apps found') + '</div><button class="pill-btn focusable" data-action="' + (allApps.length ? 'showAll' : 'refreshApps') + '">' + tr(allApps.length ? 'Show all on Home' : 'Refresh apps') + '</button></div>';
    $('appStatus').textContent = tr('{count} on TV · automatic updates', { count: allApps.length });
    scrollGrid(null);
  }

  function scrollGrid(idx) {
    var grid = $('grid'), tiles = grid.querySelectorAll('.tile');
    var width = grid.clientWidth, last = tiles[tiles.length - 1];
    var max = last ? Math.max(0, last.offsetLeft + last.offsetWidth - width) : 0;
    rowOffset = Math.min(rowOffset, max);
    var tile = idx !== null && tiles[idx];
    if (tile) {
      if (tile.offsetLeft < rowOffset) rowOffset = tile.offsetLeft;
      else if (tile.offsetLeft + tile.offsetWidth > rowOffset + width) rowOffset = tile.offsetLeft + tile.offsetWidth - width;
    }
    grid.style.transform = 'translateX(' + (-rowOffset) + 'px)';
  }

  function loadApps() {
    if (appRefresh) return appRefresh;
    $('appStatus').textContent = tr('Refreshing apps…');
    appRefresh = window.TVApps.list().then(function (list) {
      var signature = JSON.stringify(list);
      if (signature === appsSignature) {
        $('appStatus').textContent = tr('{count} on TV · automatic updates', { count: allApps.length });
        return;
      }
      appsSignature = signature;
      var prevId = focused && focused.dataset.app;
      allApps = list;
      if (!Array.isArray(settings.hidden)) {
        settings.hidden = list.filter(function (a) { return homeIds.indexOf(a.id) < 0; }).map(function (a) { return a.id; });
      }
      settings.hidden = settings.hidden.filter(function (id) { return list.some(function (a) { return a.id === id; }); });
      saveSettings();
      renderGrid();
      if (scope === $('settings')) renderSettings();
      if (scope === $('library')) renderLibrary();
      if (scope === $('home')) {
        var again = prevId && document.querySelector('.tile[data-app="' + CSS.escape(prevId) + '"]');
        if (again || !focused || !document.contains(focused)) focusEl(again || firstTile() || document.querySelector('#home .focusable'));
      }
    }).catch(function () {
      $('appStatus').textContent = tr('Apps unavailable. Try again.');
      toast(tr('Could not read installed apps'));
    }).finally(function () { appRefresh = null; });
    return appRefresh;
  }
  function firstTile() { return document.querySelector('#grid .tile'); }

  // ---------- weather loading ----------
  function refreshWeather(force) {
    if (weatherRequest) return weatherRequest;
    var age = weather ? Date.now() - weather.fetchedAt : Infinity;
    var due = force || age > CFG.weatherRefreshMinutes * 60e3;
    var backoff = weatherError ? 2 * 60e3 : 0;
    if (!due || Date.now() - lastAttempt < backoff) return;
    lastAttempt = Date.now();
    weatherRequest = W.fetch(CFG.location).then(function (w) {
      weather = w; weatherError = null; renderAll();
    }).catch(function (e) {
      weatherError = e; renderWeather();
    }).finally(function () { weatherRequest = null; });
    return weatherRequest;
  }

  // ---------- overlays ----------
  // One native-icon fallback path for both the home row and the library.
  function appImage(app, button) {
    var img = new Image(), candidates = app.icons || [app.icon], index = 0;
    img.alt = '';
    img.onerror = function () {
      index++;
      if (index < candidates.length) { img.src = candidates[index]; return; }
      img.remove(); button.classList.add('no-icon');
    };
    img.src = candidates[0];
    return img;
  }
  function renderLibrary() {
    var grid = $('libraryGrid');
    grid.innerHTML = '';
    sortApps(allApps).forEach(function (app) {
      var button = document.createElement('button');
      button.className = 'library-card focusable';
      button.dataset.app = app.id;
      button.setAttribute('aria-label', app.name);
      if (app.icon) button.appendChild(appImage(app, button));
      else button.classList.add('no-icon');
      grid.appendChild(button);
    });
    if (!allApps.length) grid.innerHTML = '<div class="empty">' + tr('No installed apps found') + '</div>';
  }
  function renderForecast() {
    var now = new Date();
    $('fcPlace').textContent = CFG.location.name + (weather ? ' · ' + tr('Updated') + ' ' + fmtTime(new Date(weather.fetchedAt)) : '');
    if (!weather) { $('fcDays').innerHTML = '<div class="empty">' + tr('Weather is not available yet.') + '</div>'; $('fcFacts').innerHTML = ''; return; }
    var days = weather.daily, lo = Infinity, hi = -Infinity;
    days.forEach(function (d) { lo = Math.min(lo, d.min); hi = Math.max(hi, d.max); });
    var span = Math.max(1, hi - lo);
    $('fcDays').innerHTML = days.map(function (d, i) {
      var wd = W.describe(d.code);
      var left = (d.min - lo) / span * 100, width = Math.max(6, (d.max - d.min) / span * 100);
      return '<div class="fc-day' + (sameDay(d.date, now) ? ' today' : '') + '">' +
        '<div class="fc-name">' + (i === 0 && sameDay(d.date, now) ? tr('Today') : dayFmt.format(d.date)) + '</div>' +
        I.weather(wd.kind, true) + '<div class="fc-label">' + wd.label + '</div>' +
        '<div class="fc-temps"><b>' + temp(d.max) + '</b><span>' + temp(d.min) + '</span></div>' +
        '<div class="fc-bar"><i style="left:' + left + '%;width:' + width + '%"></i></div>' +
        '<div class="fc-pop">' + I.ui.drop + (d.pop == null ? '–' : d.pop + '%') + '</div></div>';
    }).join('');
    var c = weather.current, t = today(now) || days[0];
    $('fcFacts').innerHTML = [
      [I.ui.sunrise, 'Sunrise', fmtTime(t.sunrise)], [I.ui.sunset, 'Sunset', fmtTime(t.sunset)],
      [I.ui.wind, 'Wind', wind(c.wind)], [I.ui.drop, 'Humidity', Math.round(c.humidity) + '%'],
      [I.weather(W.describe(c.code).kind, c.isDay), 'Now', temp(c.temp) + ' · ' + tr('feels') + ' ' + temp(c.feels)]
    ].map(function (f) { return '<div class="fact">' + f[0] + '<span>' + tr(f[1]) + '</span><b>' + f[2] + '</b></div>'; }).join('');
  }

  var PREFS = [
    { key: 'language', label: 'Language', values: L.languages },
    { key: 'unit', label: 'Temperature', values: [['C', 'Celsius'], ['F', 'Fahrenheit']] },
    { key: 'clock', label: 'Clock', values: [['24', '24-hour'], ['12', '12-hour']] },
    { key: 'scenery', label: 'Scenery', values: [['auto', 'Time & weather'], ['night', 'Night'], ['dawn', 'Dawn'], ['day', 'Day'], ['dusk', 'Dusk']] },
    { key: 'wallpaper', label: 'Wallpapers', values: [['chromecast', 'Chromecast landscapes'], ['local', 'Local weather landscapes']] },
    { key: 'effects', label: 'Rain & snow effects', values: [[true, 'On'], [false, 'Off']] },
    { key: 'performance', label: 'Performance', values: [['balanced', 'Smooth'], ['quality', 'Detailed effects']] }
  ];
  function prefValue(p) {
    var v = p.values.filter(function (x) { return x[0] === settings[p.key]; })[0];
    return tr(v ? v[1] : p.values[0][1]);
  }
  function renderSettings() {
    $('prefs').innerHTML = '<div class="col-title">' + tr('Preferences') + '<span>' + tr('Press OK to change') + '</span></div>' +
      PREFS.map(function (p) {
        return '<button class="row focusable" data-pref="' + p.key + '"><span>' + tr(p.label) + '</span><b>' + prefValue(p) + '</b></button>';
      }).join('') +
      '<div class="note">' + esc(tr('Weather for {place} from Open-Meteo. Landscapes change with the weather and time of day.', { place: CFG.location.name })) + '</div>';
    $('appList').innerHTML = sortApps(allApps).map(function (a) {
      var off = (settings.hidden || []).indexOf(a.id) >= 0;
      return '<button class="row app-row focusable' + (off ? ' off' : '') + '" data-toggle="' + esc(a.id) + '">' +
        '<span>' + esc(a.name) + '</span><b>' + (off ? tr('Hidden') : I.ui.check) + '</b></button>';
    }).join('');
  }

  function renderAmbient(now) {
    $('ambTime').textContent = fmtTime(now);
    $('ambDate').textContent = dateFmt.format(now);
    if (weather) {
      var c = weather.current, d = W.describe(c.code);
      $('ambWx').innerHTML = I.weather(d.kind, c.isDay) + '<span>' + temp(c.temp) + '</span><em>' + esc(tr('{condition} in {place}', { condition: d.label, place: CFG.location.name })) + '</em>';
    }
  }

  function openOverlay(id) {
    homeFocus = focused;
    var el = $(id);
    if (id === 'forecast') renderForecast();
    if (id === 'settings') renderSettings();
    if (id === 'library') renderLibrary();
    if (id === 'ambient') { renderAmbient(new Date()); document.body.classList.add('ambient-on'); }
    else document.body.classList.add('overlay-on');
    el.hidden = false;
    precip.pause(id !== 'ambient');
    scope = el;
    focusEl(el.querySelector('.focusable'));
  }
  function closeOverlay() {
    if (scope === $('home')) return;
    scope.hidden = true;
    document.body.classList.remove('ambient-on');
    document.body.classList.remove('overlay-on');
    scope = $('home');
    precip.pause(document.hidden);
    focusEl(homeFocus && document.contains(homeFocus) ? homeFocus : firstTile());
  }

  // ---------- focus & navigation ----------
  function focusables() {
    return Array.prototype.filter.call(scope.querySelectorAll('.focusable'), function (el) { return el.offsetParent !== null || el === scope; });
  }
  function focusEl(el) {
    if (!el) return;
    if (focused) focused.classList.remove('focused');
    focused = el;
    el.classList.add('focused');
    if (el.classList.contains('tile')) scrollGrid(+el.dataset.idx);
    if (el.parentNode && (el.parentNode.id === 'appList' || el.parentNode.id === 'libraryGrid' || el.parentNode.id === 'prefs')) {
      var list = el.parentNode, top = el.offsetTop, inset = 8;
      if (top - inset < list.scrollTop) list.scrollTop = Math.max(0, top - inset);
      else if (top + el.offsetHeight + inset > list.scrollTop + list.clientHeight) list.scrollTop = top + el.offsetHeight + inset - list.clientHeight;
    }
  }
  function move(dir) {
    if (!focused || !scope.contains(focused)) { focusEl(focusables()[0]); return; }
    if (focused.classList.contains('tile') && (dir === 'left' || dir === 'right')) {
      var tiles = $('grid').querySelectorAll('.tile'), count = tiles.length;
      if (count) focusEl(tiles[(+focused.dataset.idx + (dir === 'right' ? 1 : -1) + count) % count]);
      return;
    }
    var a = focused.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    var best = null, bestScore = Infinity;
    focusables().forEach(function (el) {
      if (el === focused) return;
      var b = el.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2, primary, cross;
      if (el.classList.contains('tile')) {
        var viewport = $('grid').parentNode.getBoundingClientRect();
        if (b.left < viewport.left || b.right > viewport.right) return;
      }
      if (dir === 'left') { if (bx >= ax - 5) return; primary = Math.max(0, a.left - b.right); cross = Math.abs(by - ay) * 2; }
      if (dir === 'right') { if (bx <= ax + 5) return; primary = Math.max(0, b.left - a.right); cross = Math.abs(by - ay) * 2; }
      if (dir === 'up') { if (by >= ay - 5) return; primary = Math.max(0, a.top - b.bottom); cross = Math.abs(bx - ax); }
      if (dir === 'down') { if (by <= ay + 5) return; primary = Math.max(0, b.top - a.bottom); cross = Math.abs(bx - ax); }
      var score = primary + cross;
      if (score < bestScore) { bestScore = score; best = el; }
    });
    if (best) focusEl(best);
  }

  function activate(el) {
    if (!el) return;
    var d = el.dataset;
    if (d.app) {
      var app = allApps.filter(function (a) { return a.id === d.app; })[0];
      window.TVApps.launch(d.app).catch(function (e) {
        toast(tr('Could not open {app}.', { app: app ? app.name : tr('app') }));
        if (window.console) console.warn('App launch failed', e);
      });
    } else if (d.pref) {
      var p = PREFS.filter(function (x) { return x.key === d.pref; })[0];
      var i = p.values.map(function (v) { return v[0]; }).indexOf(settings[p.key]);
      settings[p.key] = p.values[(i + 1) % p.values.length][0];
      saveSettings();
      if (p.key === 'language') {
        applyLanguage();
        renderSettings();
        focusEl($('prefs').querySelector('[data-pref="language"]'));
      } else {
        el.querySelector('b').textContent = prefValue(p);
      }
      renderAll();
    } else if (d.toggle) {
      var h = settings.hidden, k = h.indexOf(d.toggle);
      if (k >= 0) h.splice(k, 1); else h.push(d.toggle);
      saveSettings();
      el.classList.toggle('off', k < 0);
      el.querySelector('b').innerHTML = k < 0 ? tr('Hidden') : I.ui.check;
      renderGrid();
    } else if (d.action === 'system') {
      window.TVApps.systemHome().catch(function () { toast(tr('Could not open the TV menu.')); });
    } else if (d.action === 'refreshApps') {
      loadApps();
    } else if (d.action === 'showAll') {
      settings.hidden = []; saveSettings(); renderGrid();
      if (scope === $('settings')) renderSettings();
      if (scope === $('home')) focusEl(firstTile());
    } else if (d.action === 'home') {
      rowOffset = 0; scrollGrid(null); focusEl(firstTile());
    } else if (d.action === 'close') {
      closeOverlay();
    } else if (d.action) {
      openOverlay(d.action);
    }
  }

  function back() {
    if (scope !== $('home')) { closeOverlay(); return; }
    var first = firstTile();
    if (first && focused !== first) { rowOffset = 0; focusEl(first); return; }
    window.TVApps.exit();
  }

  document.addEventListener('keydown', function (e) {
    var k = e.keyCode;
    if (scope === $('ambient')) { e.preventDefault(); closeOverlay(); return; }
    if (k === 37) move('left');
    else if (k === 38) move('up');
    else if (k === 39) move('right');
    else if (k === 40) move('down');
    else if (k === 13) activate(focused);
    else if (k === 10009 || k === 27 || k === 8) back();
    else return;
    e.preventDefault();
  });
  // Samsung remote pointer and desktop mouse.
  document.addEventListener('mouseover', function (e) {
    var el = e.target.closest && e.target.closest('.focusable');
    if (el && scope.contains(el) && el !== focused) focusEl(el);
  });
  document.addEventListener('click', function (e) {
    if (scope === $('ambient')) { closeOverlay(); return; }
    var el = e.target.closest && e.target.closest('.focusable');
    if (el && scope.contains(el)) { focusEl(el); activate(el); }
  });

  // ---------- toast ----------
  var toastTimer = 0;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('on'); }, 3500);
  }

  // ---------- layout & lifecycle ----------
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    var st = $('stage');
    st.style.transform = 'scale(' + s + ')';
    st.style.left = Math.max(0, (window.innerWidth - 1920 * s) / 2) + 'px';
    st.style.top = Math.max(0, (window.innerHeight - 1080 * s) / 2) + 'px';
  }

  function applyLanguage() {
    L.setLanguage(settings.language);
    L.apply(document);
    dateFmt = new Intl.DateTimeFormat(settings.language, { weekday: 'long', day: 'numeric', month: 'long' });
    dayFmt = new Intl.DateTimeFormat(settings.language, { weekday: 'short' });
    scrollGrid(null);
    var empty = $('grid').querySelector('.empty');
    if (empty) renderGrid();
    if (!$('forecast').hidden) renderForecast();
    if (!$('library').hidden) renderLibrary();
  }

  function init() {
    applyLanguage();
    Array.prototype.forEach.call(document.querySelectorAll('[data-icon]'), function (el) { el.innerHTML = I.ui[el.dataset.icon]; });
    $('place').textContent = CFG.location.name;
    if (!window.TVApps.isTizen) document.body.classList.add('preview');
    fit();
    window.addEventListener('resize', fit);
    var q = window.TVApps.isTizen ? null : new URLSearchParams(location.search);
    if (q && q.get('scenery')) settings.scenery = q.get('scenery');
    renderAll();
    loadApps();
    window.TVApps.watch(function () {
      clearTimeout(appChangeTimer);
      appChangeTimer = setTimeout(loadApps, 500);
    });
    refreshWeather(false);
    if (q && q.get('open')) setTimeout(function () { openOverlay(q.get('open')); }, 300);
    setInterval(function () { if (!document.hidden) { var now = new Date(); renderClock(now); renderSky(now); } }, 5000);
    setInterval(function () {
      if (!document.hidden) { refreshWeather(false); renderWeather(); loadApps(); }
    }, 60e3);
    document.addEventListener('visibilitychange', function () {
      precip.pause(document.hidden || (scope !== $('home') && scope !== $('ambient')));
      if (!document.hidden) { renderAll(); refreshWeather(false); loadApps(); }
    });
  }

  init();
})();
