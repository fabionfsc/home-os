// Catalogs contain messages only; app names and locations are never translated.
(function () {
  'use strict';
  var catalogs = window.HOME_OS_LOCALES;
  var languages = [
    ['pt-BR', 'Português (Brasil)'], ['pt-PT', 'Português (Portugal)'],
    ['en-GB', 'English'], ['es-ES', 'Español'], ['fr-FR', 'Français'],
    ['de-DE', 'Deutsch'], ['it-IT', 'Italiano']
  ];
  var aliases = {pt:'pt-BR', en:'en-GB', es:'es-ES', fr:'fr-FR', de:'de-DE', it:'it-IT'};
  var language = 'pt-BR';
  function normalize(value) {
    if (Object.prototype.hasOwnProperty.call(catalogs, value)) return value;
    return aliases[String(value || '').split('-')[0].toLowerCase()] || 'pt-BR';
  }
  function setLanguage(value) { language = normalize(value); return language; }
  function text(key, values) {
    var catalog = catalogs[language];
    var result = Object.prototype.hasOwnProperty.call(catalog, key) ? catalog[key] : key;
    return result.replace(/\{([a-z]+)\}/g, function (match, name) {
      return values && Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match;
    });
  }
  function apply(root) {
    root.documentElement.lang = language;
    root.title = 'Home OS';
    Array.prototype.forEach.call(root.querySelectorAll('[data-i18n]'), function (el) {
      el.textContent = text(el.getAttribute('data-i18n'));
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-i18n-label]'), function (el) {
      el.setAttribute('aria-label', text(el.getAttribute('data-i18n-label')));
    });
  }
  window.TVI18n = {text:text, setLanguage:setLanguage, normalize:normalize, apply:apply, languages:languages};
})();
