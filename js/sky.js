// Procedural scenery: sky by time of day and cloud cover, mountains, pines, and precipitation.
(function () {
  'use strict';

  var W = 1920, H = 1080;

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Accepts '#rrggbb' or 'rgb(r,g,b)'.
  function hex(c) {
    if (c.charAt(0) === '#') return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    return c.slice(c.indexOf('(') + 1, -1).split(',').map(Number);
  }
  function mix(a, b, t) {
    var x = hex(a), y = hex(b);
    return 'rgb(' + x.map(function (v, i) { return Math.round(v + (y[i] - v) * t); }).join(',') + ')';
  }
  function rgba(c, a) { var x = hex(c); return 'rgba(' + x[0] + ',' + x[1] + ',' + x[2] + ',' + a + ')'; }

  // [zenith, middle, horizon] and mountain layers far → near.
  var PALETTE = {
    night: { sky: ['#03060f', '#0a1430', '#1c2a4a'], overcast: ['#0c0f15', '#151a23', '#222833'],
      hills: ['#3a4a6c', '#26314d', '#151d31', '#080c15'], rim: '#9fb6e6' },
    dawn: { sky: ['#14224a', '#6b5b8e', '#f2a88a'], overcast: ['#3b3f4c', '#5f6070', '#8f8790'],
      hills: ['#7a6789', '#4d4166', '#2d2843', '#14121d'], rim: '#ffcfa8' },
    day: { sky: ['#1b58a3', '#4b8bcd', '#acd3ef'], overcast: ['#68778a', '#8a96a5', '#b1bac5'],
      hills: ['#8ea5c0', '#5b7491', '#384c64', '#1d2a3b'], rim: '#ffffff' },
    dusk: { sky: ['#11183a', '#5a3d72', '#f28a5c'], overcast: ['#2c2c3a', '#4a4252', '#7c6563'],
      hills: ['#6c5272', '#43365a', '#272238', '#110f1a'], rim: '#ffb184' }
  };

  // Each layer: baseline y, peaks [x, height, width], noise amplitude.
  var LAYERS = [
    { base: 560, peaks: [[1340, 300, 260], [1620, 210, 220], [960, 120, 260], [280, 90, 300]], noise: 34, seed: 11 },
    { base: 640, peaks: [[1150, 170, 230], [1500, 150, 200], [520, 130, 260], [80, 100, 220]], noise: 28, seed: 23 },
    { base: 760, peaks: [[260, 120, 280], [1760, 150, 260], [900, 60, 240]], noise: 20, seed: 37, trees: 0.35 },
    { base: 900, peaks: [[1880, 130, 260], [0, 90, 240], [760, 30, 200]], noise: 14, seed: 41, trees: 1, grove: [640, 940] }
  ];

  function ridge(layer) {
    var n = 256, pts = new Array(n + 1), r = rng(layer.seed), i, step, amp = layer.noise;
    for (i = 0; i <= n; i++) pts[i] = 0;
    // Midpoint displacement for natural, rocky edges.
    for (step = n; step > 1; step >>= 1) {
      for (i = step >> 1; i < n; i += step) {
        pts[i] = (pts[i - (step >> 1)] + pts[i + (step >> 1)]) / 2 + (r() - 0.5) * amp;
      }
      amp *= 0.58;
    }
    return pts.map(function (v, k) {
      var x = k / n * W, y = layer.base + v;
      layer.peaks.forEach(function (p) {
        var d = (x - p[0]) / p[2];
        y -= p[1] * Math.exp(-d * d * 2.2);
      });
      return [x, y];
    });
  }
  var RIDGES = LAYERS.map(ridge);

  function ridgeY(pts, x) {
    var f = Math.max(0, Math.min(1, x / W)) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), t = f - i;
    return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
  }

  function pine(ctx, x, y, h) {
    var w = h * 0.34, tiers = 5;
    ctx.beginPath();
    for (var i = 0; i < tiers; i++) {
      var top = y - h + i * h / (tiers + 1), bottom = top + h / tiers * 1.5, half = w * (0.35 + i * 0.16);
      ctx.moveTo(x, top);
      ctx.lineTo(x + half, bottom);
      ctx.lineTo(x - half, bottom);
      ctx.closePath();
    }
    ctx.rect(x - h * 0.02, y - h * 0.18, h * 0.04, h * 0.2);
    ctx.fill();
  }

  // Approximate moon phase: 0 new, 0.5 full.
  function moonPhase(date) {
    var synodic = 29.530588853, known = Date.UTC(2000, 0, 6, 18, 14);
    var p = ((date.getTime() - known) / 864e5 / synodic) % 1;
    return p < 0 ? p + 1 : p;
  }

  function drawMoon(ctx, x, y, r, phase) {
    var glow = ctx.createRadialGradient(x, y, r, x, y, r * 6);
    glow.addColorStop(0, 'rgba(220,230,255,0.22)');
    glow.addColorStop(1, 'rgba(220,230,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = 'rgba(40,48,70,0.9)';
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    // Lit part: half disc plus an elliptical terminator.
    var waxing = phase < 0.5, k = Math.cos(phase * 2 * Math.PI); // 1 new → -1 full
    ctx.fillStyle = '#eef2fb';
    ctx.beginPath();
    ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, !waxing);
    ctx.ellipse(x, y, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, (k > 0) === waxing);
    ctx.fill();
    ctx.restore();
  }

  function clouds(ctx, r, cover, color, alpha) {
    var clusters = Math.round(4 + cover * 16);
    for (var c = 0; c < clusters; c++) {
      var cx = r() * W * 1.1 - W * 0.05, cy = 40 + r() * 460 * (0.4 + cover * 0.6), blobs = 5 + Math.floor(r() * 7);
      for (var b = 0; b < blobs; b++) {
        var bx = cx + (r() - 0.5) * 420, by = cy + (r() - 0.5) * 70, rad = 70 + r() * 150;
        ctx.save();
        ctx.translate(bx, by); ctx.scale(1, 0.42);
        var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
        g.addColorStop(0, rgba(color, alpha * (0.5 + r() * 0.5)));
        g.addColorStop(1, rgba(color, 0));
        ctx.fillStyle = g;
        ctx.fillRect(-rad, -rad, rad * 2, rad * 2);
        ctx.restore();
      }
    }
  }

  // state: { phase: night|dawn|day|dusk, cloud: 0..1, kind, date }
  function render(canvas, state) {
    var ctx = canvas.getContext('2d'), pal = PALETTE[state.phase] || PALETTE.night;
    var cloud = Math.max(0, Math.min(1, state.cloud || 0));
    var gray = Math.max(0, (cloud - 0.35) / 0.65) * 0.9 + (state.kind === 'fog' ? 0.3 : 0);
    gray = Math.min(1, gray);
    var skyC = pal.sky.map(function (c, i) { return mix(c, pal.overcast[i], gray); });
    var r = rng(1234 + (state.date ? state.date.getDate() : 0));

    var g = ctx.createLinearGradient(0, 0, 0, 700);
    g.addColorStop(0, skyC[0]); g.addColorStop(0.55, skyC[1]); g.addColorStop(1, skyC[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Low sun glow at dawn (left/east) and dusk (right/west).
    if (state.phase === 'dawn' || state.phase === 'dusk') {
      var sx = state.phase === 'dawn' ? 420 : 1500;
      var sg = ctx.createRadialGradient(sx, 600, 0, sx, 600, 900);
      sg.addColorStop(0, 'rgba(255,190,140,' + (0.55 * (1 - gray)) + ')');
      sg.addColorStop(1, 'rgba(255,190,140,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    }

    if (state.phase === 'night' || state.phase === 'dawn' || state.phase === 'dusk') {
      var vis = (1 - cloud) * (state.phase === 'night' ? 1 : 0.35);
      if (vis > 0.05) {
        // Milky way: glow band plus dense faint stars along a diagonal.
        var bx0 = 250, by0 = -40, bx1 = 1750, by1 = 760, len = Math.hypot(bx1 - bx0, by1 - by0);
        var ux = (bx1 - bx0) / len, uy = (by1 - by0) / len;
        if (state.phase === 'night') {
          for (var m = 0; m < 26; m++) {
            var t = m / 25, mx = bx0 + (bx1 - bx0) * t, my = by0 + (by1 - by0) * t, mr = 160 + r() * 120;
            var mg = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
            mg.addColorStop(0, 'rgba(170,180,230,' + (0.05 * vis) + ')');
            mg.addColorStop(1, 'rgba(170,180,230,0)');
            ctx.fillStyle = mg; ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
          }
        }
        var stars = Math.round(1100 * vis);
        for (var s = 0; s < stars; s++) {
          var x, y;
          if (state.phase === 'night' && s % 3 === 0) {
            var along = r() * len, off = (r() + r() + r() - 1.5) * 150;
            x = bx0 + ux * along - uy * off; y = by0 + uy * along + ux * off;
          } else { x = r() * W; y = r() * 760; }
          var size = r() < 0.04 ? 1.5 + r() * 1.1 : 0.4 + r() * 0.9;
          ctx.fillStyle = 'rgba(255,255,255,' + ((0.25 + r() * 0.75) * vis) + ')';
          ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (state.phase === 'night' && cloud < 0.75 && state.date) {
        var ph = moonPhase(state.date);
        if (ph > 0.04 && ph < 0.96) drawMoon(ctx, 1010, 150, 24, ph);
      }
    }

    if (cloud > 0.12) {
      var cc = state.phase === 'day' ? '#ffffff' : state.phase === 'night' ? '#8a96b0' : '#e7c3b8';
      clouds(ctx, r, cloud, cc, state.phase === 'night' ? 0.22 : 0.42);
    }

    // Mountains, hazier with distance.
    RIDGES.forEach(function (pts, li) {
      var layer = LAYERS[li], haze = (LAYERS.length - 1 - li) / (LAYERS.length - 1) * 0.3 + gray * 0.25;
      var base = mix(pal.hills[li], skyC[2], Math.min(0.85, haze));
      var dark = mix(pal.hills[li], '#000000', 0.25);
      var top = Math.min.apply(null, pts.map(function (p) { return p[1]; }));
      var lg = ctx.createLinearGradient(0, top, 0, H);
      lg.addColorStop(0, base); lg.addColorStop(1, dark);
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(0, H);
      pts.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      if (li < 2) {
        // Faint rim light along the ridgeline.
        ctx.strokeStyle = rgba(pal.rim, (state.phase === 'night' ? 0.10 : 0.18) * (1 - gray));
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        pts.forEach(function (p, k) { if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
        ctx.stroke();
      }

      if (layer.trees) {
        var tr = rng(layer.seed * 7);
        ctx.fillStyle = mix(pal.hills[li], '#000000', 0.35);
        for (var tx = -10; tx < W + 10; tx += 9 + tr() * 22) {
          if (tr() > layer.trees) continue;
          var inGrove = layer.grove && tx > layer.grove[0] && tx < layer.grove[1];
          var th = (inGrove ? 90 + tr() * 120 : 26 + tr() * 50) * (li === 3 ? 1 : 0.6);
          pine(ctx, tx, ridgeY(pts, tx) + 6, th);
        }
      }
    });

    if (state.kind === 'fog' || gray > 0.6) {
      var fg = ctx.createLinearGradient(0, 420, 0, H);
      var fa = state.kind === 'fog' ? 0.55 : 0.2;
      fg.addColorStop(0, 'rgba(200,205,215,0)');
      fg.addColorStop(0.5, 'rgba(200,205,215,' + fa * (state.phase === 'night' ? 0.35 : 1) + ')');
      fg.addColorStop(1, 'rgba(200,205,215,' + fa * 0.4 + ')');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
    }
  }

  // Rain / snow animation at ~30 fps; stops when kind has no precipitation.
  function Precip(canvas, flash) {
    var ctx = canvas.getContext('2d'), parts = [], kind = null, raf = 0, last = 0, nextFlash = 0, paused = false;
    var mode = '', frameInterval = 50;

    function quality(value) {
      value = value === 'quality' ? 'quality' : 'balanced';
      if (value === mode) return;
      mode = value;
      var scale = mode === 'balanced' ? 0.5 : 1;
      canvas.width = W * scale; canvas.height = H * scale;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      frameInterval = mode === 'balanced' ? 50 : 33;
      if (mode === 'balanced' && parts.length > 160) parts = parts.slice(0, 160);
    }
    quality('balanced');

    function seed(n) {
      parts = [];
      for (var i = 0; i < n; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, v: Math.random(), s: Math.random() });
    }
    function frame(ts) {
      raf = 0;
      if (paused || !kind) return;
      raf = requestAnimationFrame(frame);
      if (ts - last < frameInterval) return;
      var dt = Math.min(0.1, (ts - last) / 1000 || 0.033);
      last = ts;
      ctx.clearRect(0, 0, W, H);
      if (kind === 'snow') {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        parts.forEach(function (p) {
          p.y += (40 + p.v * 60) * dt; p.x += Math.sin((ts / 1000) + p.s * 6) * 20 * dt;
          if (p.y > H) { p.y = -5; p.x = Math.random() * W; }
          ctx.globalAlpha = 0.35 + p.s * 0.6;
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 + p.s * 2.5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = 'rgba(190,210,240,0.35)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        parts.forEach(function (p) {
          var sp = 900 + p.v * 700, len = 18 + p.v * 22;
          p.y += sp * dt; p.x -= sp * 0.12 * dt;
          if (p.y > H) { p.y = -len; p.x = Math.random() * (W + 200); }
          ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - len * 0.12, p.y + len);
        });
        ctx.stroke();
      }
      if (kind === 'storm' && flash && ts > nextFlash) {
        nextFlash = ts + 7000 + Math.random() * 12000;
        flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
      }
    }

    return {
      set: function (k, intensity) {
        var precip = k === 'rain' || k === 'drizzle' || k === 'snow' || k === 'storm' ? k : null;
        if (precip === kind && parts.length) return;
        kind = precip;
        cancelAnimationFrame(raf); raf = 0;
        ctx.clearRect(0, 0, W, H);
        if (!kind) { parts = []; return; }
        var n = kind === 'snow' ? 140 + intensity * 90 : kind === 'drizzle' ? 120 : 160 + intensity * 170;
        seed(mode === 'balanced' ? Math.min(160, n) : n);
        nextFlash = performance.now() + 3000;
        if (!paused) raf = requestAnimationFrame(frame);
      },
      quality: quality,
      pause: function (p) {
        paused = p;
        if (paused) { cancelAnimationFrame(raf); raf = 0; }
        else if (kind && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      }
    };
  }

  window.TVSky = { render: render, Precip: Precip };
})();
