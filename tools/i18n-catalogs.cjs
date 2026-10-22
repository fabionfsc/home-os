const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function load() {
  const context = vm.createContext({window:{}});
  const js = path.join(__dirname,'../js');
  for(const file of fs.readdirSync(path.join(js,'locales'))) vm.runInContext(fs.readFileSync(path.join(js,'locales',file),'utf8'),context);
  for(const file of ['i18n.js','weather.js']) vm.runInContext(fs.readFileSync(path.join(js,file),'utf8'),context);
  return context.window;
}
module.exports={load};
