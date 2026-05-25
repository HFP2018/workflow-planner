const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 5173;

function sign(secret, timestamp) {
  const str = `${timestamp}\n${secret}`;
  return crypto.createHmac('sha256', secret).update(str).digest('base64');
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.url === '/api/send-dingtalk' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { webhookUrl, secret, title, message, msgtype = 'markdown' } = JSON.parse(body);
        if (!webhookUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: '缺少 webhookUrl' }));
        }

        let url = webhookUrl;
        if (secret) {
          const timestamp = Date.now().toString();
          const signature = sign(secret, timestamp);
          const sep = webhookUrl.includes('?') ? '&' : '?';
          url = `${webhookUrl}${sep}timestamp=${timestamp}&sign=${encodeURIComponent(signature)}`;
        }

        const payload = { msgtype };
        if (msgtype === 'markdown') {
          payload.markdown = {
            title: title || '智规划提醒',
            text: `### ${title || '智规划提醒'}\n${message || ''}`,
          };
        } else {
          payload.text = {
            content: `${title || '智规划提醒'}\n${message || ''}`,
          };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok || data.errcode !== 0) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: '钉钉接口调用失败', detail: data }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '服务器内部错误', detail: err.message }));
      }
    });
    return;
  }

  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'dist', filePath);

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, 'dist', 'index.html'), (err2, content2) => {
          if (err2) {
            res.writeHead(404);
            return res.end('Not Found');
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content2);
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`智规划服务已启动: http://localhost:${PORT}`);
});
