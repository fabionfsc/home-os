// Interface and weather icons as inline SVG strings.
(function () {
  'use strict';

  function ui(body) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  var UI = {
    spark: ui('<path d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3 5.3 18.7"/>'),
    home: ui('<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6.5H9V21H4.5a1 1 0 0 1-1-1z"/>'),
    sliders: ui('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/>' +
      '<circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
    check: ui('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    drop: ui('<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/>'),
    sunrise: ui('<path d="M12 3v5M8.5 6.5 12 3l3.5 3.5M4 18h16M6.3 14.5a6 6 0 0 1 11.4 0M2 21h20"/>'),
    sunset: ui('<path d="M12 8V3M8.5 4.5 12 8l3.5-3.5M4 18h16M6.3 14.5a6 6 0 0 1 11.4 0M2 21h20"/>'),
    wind: ui('<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7"/>')
  };

  var SUN = '#FFD45C', MOON = '#E9EDF7', CLOUD = '#FFFFFF', CLOUD_DIM = '#C9D2E3', RAIN = '#7CC4FF';
  var CLOUD_PATH = 'M20 48h26a10 10 0 0 0 0-20 14 14 0 0 0-27-3A11 11 0 0 0 20 48z';

  function sun(x, y, s) {
    var rays = '';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, c = Math.cos(a), d = Math.sin(a);
      rays += '<line x1="' + (32 + c * 18) + '" y1="' + (32 + d * 18) + '" x2="' + (32 + c * 25) +
        '" y2="' + (32 + d * 25) + '"/>';
    }
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<circle cx="32" cy="32" r="12" fill="' + SUN + '"/>' +
      '<g stroke="' + SUN + '" stroke-width="4" stroke-linecap="round">' + rays + '</g></g>';
  }
  function moon(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M40 8A24 24 0 1 0 56 44 20 20 0 0 1 40 8z" fill="' + MOON + '"/></g>';
  }
  function cloud(dy, color) {
    return '<path transform="translate(0 ' + dy + ')" d="' + CLOUD_PATH + '" fill="' + (color || CLOUD) + '"/>';
  }
  function lines(kind) {
    var out = '';
    if (kind === 'rain') {
      [[22, 0], [32, 0], [42, 0]].forEach(function (p) {
        out += '<line x1="' + p[0] + '" y1="46" x2="' + (p[0] - 4) + '" y2="58" stroke="' + RAIN +
          '" stroke-width="3.5" stroke-linecap="round"/>';
      });
    } else if (kind === 'drizzle') {
      [22, 32, 42].forEach(function (x) {
        out += '<line x1="' + x + '" y1="48" x2="' + (x - 2) + '" y2="53" stroke="' + RAIN +
          '" stroke-width="3.5" stroke-linecap="round"/>';
      });
    } else if (kind === 'snow') {
      [[22, 50], [32, 56], [42, 50]].forEach(function (p) {
        out += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.2" fill="#fff"/>';
      });
    } else if (kind === 'storm') {
      out += '<path d="M35 38 26 52h7l-3 10 11-15h-7l4-9z" fill="' + SUN + '"/>';
    } else if (kind === 'fog') {
      out += '<g stroke="' + CLOUD_DIM + '" stroke-width="3.5" stroke-linecap="round">' +
        '<line x1="12" y1="48" x2="52" y2="48"/><line x1="18" y1="56" x2="46" y2="56"/></g>';
    }
    return out;
  }

  function weather(kind, isDay) {
    var body;
    switch (kind) {
      case 'clear': body = isDay ? sun(0, 0, 1) : moon(4, 4, 0.9); break;
      case 'partly': body = (isDay ? sun(-4, -6, 0.75) : moon(0, -2, 0.6)) + cloud(4); break;
      case 'cloudy': body = '<path transform="translate(8 -8) scale(.75)" d="' + CLOUD_PATH + '" fill="' +
        CLOUD_DIM + '"/>' + cloud(4); break;
      case 'fog': body = cloud(-8, CLOUD_DIM) + lines('fog'); break;
      default: body = cloud(-10) + lines(kind);
    }
    return '<svg viewBox="0 0 64 64" aria-hidden="true">' + body + '</svg>';
  }

  window.TVIcons = { ui: UI, weather: weather };
})();
