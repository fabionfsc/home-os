// Bundled photographic-style scenery, selected from the current weather.
// The procedural canvas stays underneath as an offline image-load fallback.
(function () {
  'use strict';
  var generation = 0, current = -1, requested = '';

  function select(state) {
    var rainy = ['drizzle', 'rain', 'storm'].indexOf(state.kind) >= 0;
    var cloudy = state.kind === 'cloudy' || state.kind === 'fog' || state.cloud > 0.72;
    var asset = state.kind === 'snow' ? 'snow' : rainy ? 'rainy-day' : cloudy ? 'overcast' : 'clear';
    var filter = 'none';
    if (state.phase === 'night') {
      if (asset === 'snow') filter = 'brightness(0.3) saturate(0.65)';
      else asset = rainy ? 'rainy-night' : cloudy ? 'cloudy-night' : 'night';
    } else if (state.phase === 'dawn' || state.phase === 'dusk') {
      filter = 'brightness(0.7) sepia(0.22) saturate(0.8)';
    }
    return { asset: asset, filter: filter };
  }

  function render(element, state) {
    var photo = state.wallpaper === 'chromecast' && window.TVGallery ? window.TVGallery.current() : null;
    var scene = photo ? { asset: 'chromecast', filter: state.phase === 'night' ? 'brightness(0.65)' : 'none' } : select(state);
    var url = photo ? photo.url : 'css/landscapes/' + scene.asset + '.png';
    var key = url + '|' + scene.filter + '|' + state.kind;
    if (key === requested) return;
    requested = key;
    var ticket = ++generation, image = new Image();
    image.onload = function () {
      if (ticket !== generation) return;
      var layers = element.querySelectorAll('.landscape-layer'), next = current === 0 ? 1 : 0;
      layers[next].style.backgroundImage = 'url("' + url + '")';
      layers[next].style.filter = scene.filter;
      layers[next].style.opacity = '1';
      if (current >= 0) layers[current].style.opacity = '0';
      current = next;
      element.dataset.weather = state.kind;
      element.dataset.scene = scene.asset;
      var credit = typeof document !== 'undefined' ? document.getElementById('photoCredit') : null;
      if (credit) credit.textContent = photo ? '© ' + photo.author : '';
    };
    image.onerror = function () {
      if (ticket !== generation) return;
      Array.prototype.forEach.call(element.querySelectorAll('.landscape-layer'), function (layer) {
        layer.style.opacity = '0';
      });
      current = -1;
      requested = '';
      if (photo && window.TVGallery) window.TVGallery.failed(photo.url);
      var credit = typeof document !== 'undefined' ? document.getElementById('photoCredit') : null;
      if (credit) credit.textContent = '';
      delete element.dataset.weather;
      delete element.dataset.scene;
    };
    image.src = url;
  }

  window.TVLandscape = { render: render, select: select };
})();
