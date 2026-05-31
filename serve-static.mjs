import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const ROOT = resolve(new URL('.', import.meta.url).pathname);
const args = new Map(process.argv.slice(2).map((arg, index, all) => {
  if (!arg.startsWith('--')) return [null, null];
  const [key, inlineValue] = arg.split('=');
  return [key, inlineValue ?? all[index + 1]];
}).filter(([key]) => key));
const host = args.get('--host') || '127.0.0.1';
const port = Number(args.get('--port') || process.env.PORT || 4173);

const TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.ico', 'image/x-icon']
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] || '/');
  const clean = normalize(decoded).replace(/^([/\\])+/, '');
  const target = resolve(join(ROOT, clean || 'index.html'));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return null;
  return target;
}

const server = createServer((req, res) => {
  const target = safePath(new URL(req.url || '/', `http://${req.headers.host}`).pathname);
  if (!target) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  let filePath = target;
  if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html');

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'content-type': TYPES.get(extname(filePath).toLowerCase()) || 'application/octet-stream',
    'cache-control': 'no-store'
  });
  createReadStream(filePath).pipe(res);
});

server.listen(port, host, () => {
  console.log(`Static test server listening at http://${host}:${port}`);
});
