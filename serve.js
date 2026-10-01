const http = require('http');
const fs = require('fs');
const path = require('path');
const BASE = __dirname;
const PORT = 3002;
const MIME = {'.html':'text/html; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const server = http.createServer((req,res)=>{
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url.endsWith('/')) url += 'index.html';
  const filePath = path.normalize(path.join(BASE, url));
  if (!filePath.startsWith(BASE + path.sep)) { res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8'}); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, content)=>{
    if (err) { res.writeHead(err.code === 'ENOENT' ? 404 : 500, {'Content-Type':'text/plain; charset=utf-8'}); res.end(err.code === 'ENOENT' ? 'Not Found' : 'Server Error'); return; }
    res.writeHead(200, {'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control':'no-cache'}); res.end(content);
  });
});
server.listen(PORT, '0.0.0.0', ()=>console.log('SnapDog static website serving ' + BASE + ' on port ' + PORT));
