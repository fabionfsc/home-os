const {chromium} = require('playwright');
const {pathToFileURL} = require('node:url');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'test-results');
fs.mkdirSync(output,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {})});
  try {
    const context=await browser.newContext({viewport:{width:1920,height:1080},timezoneId:'America/Sao_Paulo'});
    const errors=[];
    context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
    const now=new Date();
    const day=n=>{const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
    const dates=Array.from({length:7},(_,i)=>day(i));
    const weather={
      current:{temperature_2m:24,apparent_temperature:25,relative_humidity_2m:72,weather_code:63,is_day:1,wind_speed_10m:12,cloud_cover:80},
      hourly:{time:Array.from({length:24},(_,i)=>day(0)+'T'+String(i).padStart(2,'0')+':00'),temperature_2m:Array(24).fill(24),weather_code:Array(24).fill(63),precipitation_probability:Array(24).fill(70),is_day:Array(24).fill(1)},
      daily:{time:dates,weather_code:[63,51,80,95,2,0,3],temperature_2m_max:Array(7).fill(28),temperature_2m_min:Array(7).fill(19),sunrise:dates.map(d=>d+'T05:40'),sunset:dates.map(d=>d+'T18:20'),precipitation_probability_max:Array(7).fill(70)}
    };
    await context.route('https://api.open-meteo.com/**',route=>route.fulfill({json:weather}));
    await context.route('https://*.googleusercontent.com/**',route=>route.abort());
    await context.addInitScript(()=>{
      // Explicit test fixtures are never shipped as an installed-app inventory.
      window.HOME_OS_PREVIEW_APPS=Array.from({length:13},(_,i)=>({id:'test.app.'+i,name:'Test app '+i,icon:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="304" height="304"><rect width="304" height="304" rx="40" fill="#334e68"/><text x="152" y="185" font-size="80" text-anchor="middle" fill="white">'+(i+1)+'</text></svg>')}));
    });
    const page=await context.newPage();
    const url=pathToFileURL(path.join(root,process.argv.includes('--dist')?'dist/index.html':'index.html')).href;
    await page.goto(url);
    await page.evaluate(()=>{
      localStorage.removeItem('tvhome.settings.v2');
      localStorage.setItem('tvhome.settings.v1',JSON.stringify({language:'pt-PT',unit:'C',clock:'24',effects:false,wallpaper:'local',hidden:['test.app.12']}));
    });
    await page.reload();
    await page.waitForFunction(()=>document.documentElement.lang==='pt-BR' && document.querySelectorAll('#grid .tile').length===12);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tvhome.settings.v2')));
    assert.equal(saved.effects,false);assert.deepEqual(saved.hidden,['test.app.12']);
    assert.equal(await page.title(),'Home OS');
    const locales=await page.evaluate(()=>window.TVI18n.languages.map(l=>l[0]));
    for(const locale of locales){
      await page.evaluate(locale=>{const s=JSON.parse(localStorage.getItem('tvhome.settings.v2'));s.language=locale;localStorage.setItem('tvhome.settings.v2',JSON.stringify(s));},locale);
      await page.goto(url);
      await page.waitForFunction(locale=>document.documentElement.lang===locale && document.querySelectorAll('#grid .tile').length===12,locale);
      assert.equal(await page.locator('#grid .tile-name').count(),0);
      assert.equal(await page.locator('.home-footer').count(),0);
      const geometry=await page.evaluate(()=>{
        const r=selector=>{const a=document.querySelector(selector).getBoundingClientRect();return {left:a.left,right:a.right,top:a.top,bottom:a.bottom};};
        return {brand:r('.brand'),nav:r('.actions'),system:r('.system-actions'),tile:r('.tile')};
      });
      assert.ok(geometry.brand.right<geometry.nav.left,locale+': brand overlap');
      assert.ok(geometry.nav.right<geometry.system.left,locale+': navigation overlap');
      assert.ok(geometry.tile.bottom<=1080,locale+': tile outside screen');
      for(const mode of ['forecast','settings','ambient','library']){
        await page.goto(url+'?open='+mode);
        await page.waitForFunction(id=>!document.getElementById(id).hidden,mode);
        await page.waitForTimeout(100);
        if(mode==='library'){
          assert.equal(await page.locator('.library-card').count(),13);
          assert.ok(await page.locator('.library-card').first().getAttribute('aria-label'));
          await page.evaluate(()=>window.__firstTile=document.querySelector('#grid .tile'));
          await page.locator('#library [data-action="refreshApps"]').click();
          await page.waitForTimeout(100);
          assert.ok(await page.evaluate(()=>window.__firstTile===document.querySelector('#grid .tile')),'unchanged app lists should preserve existing nodes');
          await page.keyboard.press('ArrowDown');
          assert.ok(await page.locator('#library .focused').count());
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#library').isVisible(),false);
        }
        if(mode==='settings'){
          const overflow=await page.locator('#prefs .row').evaluateAll(rows=>rows.filter(r=>r.scrollWidth>r.clientWidth+1).map(r=>r.innerText));
          assert.deepEqual(overflow,[],locale+': settings overflow');
          await page.locator('[data-pref="language"]').click();
          const next=await page.locator('html').getAttribute('lang');
          await page.reload();
          assert.equal(await page.locator('html').getAttribute('lang'),next);
          await page.evaluate(locale=>{const s=JSON.parse(localStorage.getItem('tvhome.settings.v2'));s.language=locale;localStorage.setItem('tvhome.settings.v2',JSON.stringify(s));},locale);
        }
      }
    }
    await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('tvhome.settings.v2'));s.language='pt-BR';localStorage.setItem('tvhome.settings.v2',JSON.stringify(s));});
    await page.goto(url);
    await page.waitForFunction(()=>document.getElementById('landscape').dataset.scene);
    await page.waitForTimeout(400);
    await page.screenshot({path:path.join(output,'home-pt-BR.png')});
    assert.deepEqual(errors,[]);
    console.log('PASS: all 7 locales × 5 screens, preserved preferences, remote navigation, icon-only cards, layout boundaries and unchanged app-list nodes.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
