import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const host = '127.0.0.1';
const port = Number.parseInt(process.env.PORT ?? '8080', 10);
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const websiteRoot = join(projectRoot, 'website');

const routeMap = new Map([
  ['/', 'index.html'],
  ['/urun', 'product.html'],
  ['/urun/', 'product.html'],
  ['/fiyatlar', 'pricing.html'],
  ['/fiyatlar/', 'pricing.html'],
  ['/iletisim', 'contact.html'],
  ['/iletisim/', 'contact.html'],
  ['/gizlilik', 'privacy.html'],
  ['/gizlilik/', 'privacy.html'],
  ['/indir', 'download.html'],
  ['/indir/', 'download.html']
]);

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8']
]);

function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://${host}`).pathname);
  const mappedPath = routeMap.get(pathname) ?? pathname.replace(/^\/+/, '');
  const normalizedPath = normalize(mappedPath);
  const absolutePath = join(websiteRoot, normalizedPath);

  if (!absolutePath.startsWith(`${websiteRoot}${sep}`)) {
    return null;
  }

  return absolutePath;
}

const server = createServer((request, response) => {
  const filePath = resolveRequestPath(request.url ?? '/');

  if (
    !filePath ||
    !existsSync(filePath) ||
    !statSync(filePath).isFile()
  ) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const contentType =
    contentTypes.get(extname(filePath).toLowerCase()) ??
    'application/octet-stream';

  response.writeHead(200, { 'Content-Type': contentType });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`VeliGeldi development server: http://${host}:${port}`);
});
