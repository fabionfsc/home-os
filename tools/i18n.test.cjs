const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {load}=require('./i18n-catalogs.cjs');
const variables=text=>[...text.matchAll(/\{([a-z]+)\}/g)].map(m=>m[1]).sort();
test('all seven locales contain every message and preserve interpolation variables',()=>{
  const {HOME_OS_LOCALES:catalogs,TVI18n:lang}=load();
  assert.equal(lang.languages.length,7);
  const keys=Object.keys(catalogs['en-GB']).sort();
  for(const [locale] of lang.languages){
    assert.deepEqual(Object.keys(catalogs[locale]).sort(),keys,locale);
    lang.setLanguage(locale);
    for(const key of keys){
      assert.ok(catalogs[locale][key].trim(),locale+': '+key);
      assert.deepEqual(variables(catalogs[locale][key]),variables(key),locale+': '+key);
    }
    assert.equal(lang.text('YouTube'),'YouTube');
    assert.ok(lang.text('Could not open {app}.',{app:'YouTube'}).includes('YouTube'));
  }
});
test('language aliases and invalid values fall back safely',()=>{
  const {TVI18n:lang}=load();
  assert.equal(lang.setLanguage('es-MX'),'es-ES');
  assert.equal(lang.setLanguage('en-US'),'en-GB');
  assert.equal(lang.setLanguage('pt-PT'),'pt-PT');
  assert.equal(lang.text('Humidity'),'Humidade');
  assert.equal(lang.setLanguage('unknown'),'pt-BR');
  assert.equal(lang.text('Settings'),'Configurações');
  assert.equal(lang.text('Sunset at {time}',{time:'18:30'}),'O sol se põe às 18:30');
});
test('every locale translates all weather codes without changing their meaning or intensity',()=>{
  const {TVI18n:lang,TVWeather:weather,HOME_OS_LOCALES:catalogs}=load();
  for(const code of [0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99,999]){
    lang.setLanguage('en-GB');const en=weather.describe(code);
    for(const [locale] of lang.languages){
      lang.setLanguage(locale);const translated=weather.describe(code);
      assert.equal(translated.kind,en.kind);
      assert.equal(translated.intensity,en.intensity);
      assert.equal(translated.label,catalogs[locale][en.label]);
    }
  }
});
test('every static HTML message is in the source catalog',()=>{
  const {HOME_OS_LOCALES:catalogs}=load();
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  for(const match of html.matchAll(/data-i18n(?:-label)?="([^"]+)"/g)) assert.ok(Object.hasOwn(catalogs['en-GB'],match[1]),match[1]);
});
