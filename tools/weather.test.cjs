const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
test('cached weather is bound to the requested city, including malformed and older cache handling',()=>{
  const raw={current:{temperature_2m:24,apparent_temperature:25,relative_humidity_2m:60,wind_speed_10m:10,weather_code:0,is_day:1,cloud_cover:0},hourly:{time:[]},daily:{time:[]}};
  const place={latitude:-15.7939,longitude:-47.8828};
  let stored=JSON.stringify({location:place,raw,fetchedAt:1});
  const context=vm.createContext({window:{},localStorage:{getItem:()=>stored}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/weather.js'),'utf8'),context);
  const api=context.window.TVWeather;
  assert.equal(api.cached(place).current.temp,24);
  assert.equal(api.cached({latitude:48.8566,longitude:2.3522}),null);
  stored=JSON.stringify({raw,fetchedAt:1});
  assert.equal(api.cached(place),null);
  stored='bad json';
  assert.equal(api.cached(place),null);
});
