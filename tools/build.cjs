const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
async function build() {
  // Delete only this project's generated dist directory.
  if (path.dirname(dist) !== root || path.basename(dist) !== 'dist') throw new Error('Unsafe build path');
  fs.rmSync(dist, {recursive:true, force:true});
  fs.mkdirSync(path.join(dist, 'js'), {recursive:true});
  let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
  const code = scripts.map(file=>fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  const js = await esbuild.transform(code, {loader:'js', minify:true, target:'chrome76', charset:'utf8', legalComments:'inline'});
  fs.writeFileSync(path.join(dist, 'js/app.js'), js.code);
  html = html.replace(/  <script src="[^"]+"><\/script>\r?\n/g, '').replace('</body>', '  <script src="js/app.js"></script>\n</body>');
  fs.writeFileSync(path.join(dist, 'index.html'), html);
  fs.cpSync(path.join(root, 'css'), path.join(dist, 'css'), {recursive:true});
  const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
  const css = await esbuild.transform(style, {loader:'css', minify:true, target:'chrome76'});
  fs.writeFileSync(path.join(dist, 'css/style.css'), css.code);
  for (const file of ['config.xml','icon.png','LICENSE','THIRD_PARTY_NOTICES.md']) fs.copyFileSync(path.join(root,file),path.join(dist,file));
  const report = {version:require('../package.json').version, target:'chrome76', js:{source:Buffer.byteLength(code),built:Buffer.byteLength(js.code)},css:{source:Buffer.byteLength(style),built:Buffer.byteLength(css.code)}};
  fs.writeFileSync(path.join(dist,'build-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
build().catch(error=>{console.error(error);process.exitCode=1;});
