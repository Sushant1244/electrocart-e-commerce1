const http = require('http');
const { createReadStream, statSync } = require('fs');
const path = require('path');
const url = require('url');

const uploadsDir = path.join(__dirname, 'uploads');
const port = process.env.PORT || 5001;

const mime = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  if (!parsed.pathname.startsWith('/uploads/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found');
  }
  const filename = decodeURIComponent(parsed.pathname.replace('/uploads/', ''));
  const filePath = path.join(uploadsDir, filename);
  try {
    const stats = statSync(filePath);
    if (!stats.isFile()) throw new Error('Not a file');
    const ext = path.extname(filePath).toLowerCase();
    const ct = mime[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': ct });
    createReadStream(filePath).pipe(res);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
  }
});

server.listen(port, () => console.log(`Temp uploads server running on http://localhost:${port}`));
