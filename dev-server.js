const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json'
};

let createBoletoHandler;
try {
  createBoletoHandler = require('./api/create-boleto.js');
} catch (e) {
  console.warn('Aviso: módulo de boleto não carregado:', e.message);
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  // API Serverless Route Handler
  if (reqPath === '/api/create-boleto' && createBoletoHandler) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch (e) {
        req.body = {};
      }
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };
      try {
        createBoletoHandler(req, res);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });
    return;
  }

  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(__dirname, reqPath);
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Server Error');
      }
    } else {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(content);
    }
  });
});

const PORT = parseInt(process.env.PORT, 10) || 3456;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Porta ${PORT} já está em uso.`);
    console.error(`Para liberar ou rodar em outra porta use: $env:PORT=3000; npm run dev\n`);
  } else {
    console.error('Erro no servidor:', err);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Servidor Farma Fit Ativo!`);
  console.log(`👉 Local:   http://localhost:${PORT}/`);
  console.log(`👉 IPv4:    http://127.0.0.1:${PORT}/`);
  console.log(`======================================================\n`);
});

