const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, process.argv.includes('--dist') ? '../dist' : '..');
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
const server = http.createServer((req,res)=>{
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname)); }
  catch { res.writeHead(400).end(); return; }
  if (file !== root && !file.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
  if (file === root) file=path.join(root,'index.html');
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;} res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(data);});
});
server.listen(Number(process.env.PORT || 4173),'127.0.0.1',()=>console.log('Home OS preview: http://127.0.0.1:'+server.address().port));
