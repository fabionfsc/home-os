// Weather from Open-Meteo (no API key). Values are fetched in °C and km/h and converted for display.
(function () {
  'use strict';

  var CACHE_KEY = 'tvhome.weather.v1';

  // WMO weather interpretation codes.
  var CODES = {
    0: ['Clear', 'clear', 0], 1: ['Mainly clear', 'clear', 0], 2: ['Partly cloudy', 'partly', 0],
    3: ['Overcast', 'cloudy', 0], 45: ['Fog', 'fog', 0], 48: ['Freezing fog', 'fog', 0],
    51: ['Light drizzle', 'drizzle', 1], 53: ['Drizzle', 'drizzle', 1], 55: ['Heavy drizzle', 'drizzle', 2],
    56: ['Freezing drizzle', 'drizzle', 1], 57: ['Freezing drizzle', 'drizzle', 2],
    61: ['Light rain', 'rain', 1], 63: ['Rain', 'rain', 2], 65: ['Heavy rain', 'rain', 3],
    66: ['Freezing rain', 'rain', 1], 67: ['Freezing rain', 'rain', 3],
    71: ['Light snow', 'snow', 1], 73: ['Snow', 'snow', 2], 75: ['Heavy snow', 'snow', 3], 77: ['Snow grains', 'snow', 1],
    80: ['Showers', 'rain', 1], 81: ['Showers', 'rain', 2], 82: ['Heavy showers', 'rain', 3],
    85: ['Snow showers', 'snow', 1], 86: ['Snow showers', 'snow', 3],
    95: ['Thunderstorm', 'storm', 2], 96: ['Thunderstorm, hail', 'storm', 3], 99: ['Thunderstorm, hail', 'storm', 3]
  };

  function describe(code) {
    var c = CODES[code];
    var label = c ? c[0] : 'Unknown';
    return { label: window.TVI18n ? window.TVI18n.text(label) : label, kind: c ? c[1] : 'cloudy', intensity: c ? c[2] : 0 };
  }

  function url(loc) {
    return 'https://api.open-meteo.com/v1/forecast?latitude=' + loc.latitude + '&longitude=' + loc.longitude +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m,cloud_cover' +
      '&hourly=temperature_2m,weather_code,precipitation_probability,is_day' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max' +
      '&timezone=auto&forecast_days=7';
  }

  // Open-Meteo returns local times without an offset ("2026-10-19T07:51"); the TV runs in the same timezone.
  function localDate(s) {
    var p = s.split(/[-T:]/).map(Number);
    return new Date(p[0], p[1] - 1, p[2], p[3] || 0, p[4] || 0);
  }

  function normalize(raw, fetchedAt) {
    var cur = raw.current, h = raw.hourly, d = raw.daily;
    var now = Date.now(), hourly = [], daily = [];
    for (var i = 0; i < h.time.length; i++) {
      var t = localDate(h.time[i]);
      if (t.getTime() + 3600e3 <= now) continue;
      hourly.push({ time: t, temp: h.temperature_2m[i], code: h.weather_code[i],
        pop: h.precipitation_probability[i], isDay: h.is_day[i] === 1 });
      if (hourly.length >= 24) break;
    }
    for (var j = 0; j < d.time.length; j++) {
      daily.push({ date: localDate(d.time[j]), code: d.weather_code[j], max: d.temperature_2m_max[j],
        min: d.temperature_2m_min[j], sunrise: localDate(d.sunrise[j]), sunset: localDate(d.sunset[j]),
        pop: d.precipitation_probability_max[j] });
    }
    return {
      fetchedAt: fetchedAt,
      current: { temp: cur.temperature_2m, feels: cur.apparent_temperature, humidity: cur.relative_humidity_2m,
        wind: cur.wind_speed_10m, code: cur.weather_code, isDay: cur.is_day === 1, cloud: cur.cloud_cover / 100 },
      hourly: hourly,
      daily: daily
    };
  }

  function readCache(loc) {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY));
      var samePlace = c && c.location && c.location.latitude === loc.latitude && c.location.longitude === loc.longitude;
      return samePlace && c.raw ? normalize(c.raw, c.fetchedAt) : null;
    } catch (e) { return null; }
  }

  function fetchWeather(loc) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 15000);
    return fetch(url(loc), ctrl ? { signal: ctrl.signal } : {}).then(function (r) {
      if (!r.ok) throw new Error('Weather service returned ' + r.status);
      return r.json();
    }).then(function (raw) {
      var at = Date.now();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ location:loc, raw:raw, fetchedAt:at })); } catch (e) { /* storage full */ }
      return normalize(raw, at);
    }).finally(function () { if (timer) clearTimeout(timer); });
  }

  window.TVWeather = { describe: describe, fetch: fetchWeather, cached: readCache };
})();
