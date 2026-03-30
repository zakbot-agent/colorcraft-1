/**
 * Web server for ColorCraft.
 * Pure Node.js HTTP server + JSON API + static file serving.
 */

import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { generatePalette, generateAllPalettes, generateRandom, PALETTE_TYPES, PaletteType } from './palette';
import { checkContrast } from './contrast';
import { hexToRgb, rgbToHsl, formatRgb, formatHsl, isValidHex } from './color';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function jsonResponse(res: http.ServerResponse, data: unknown, status: number = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function errorResponse(res: http.ServerResponse, message: string, status: number = 400): void {
  jsonResponse(res, { error: message }, status);
}

function colorInfo(hex: string) {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  return { hex, rgb: formatRgb(rgb), hsl: formatHsl(hsl), r: rgb.r, g: rgb.g, b: rgb.b, h: hsl.h, s: hsl.s, l: hsl.l };
}

function handleApi(req: http.IncomingMessage, res: http.ServerResponse, url: URL): boolean {
  const pathname = url.pathname;

  // GET /api/palette?color=#ff6b35&type=triadic
  if (pathname === '/api/palette') {
    const color = url.searchParams.get('color');
    const type = url.searchParams.get('type') as PaletteType | null;

    if (!color || !isValidHex(color)) {
      errorResponse(res, 'Invalid color. Provide a valid hex color (e.g., #ff6b35).');
      return true;
    }

    if (type && !PALETTE_TYPES.includes(type)) {
      errorResponse(res, `Invalid palette type. Valid: ${PALETTE_TYPES.join(', ')}`);
      return true;
    }

    const palettes = type ? [generatePalette(color, type)] : generateAllPalettes(color);
    const result = palettes.map((p) => ({
      type: p.type,
      base: p.base,
      colors: p.colors.map(colorInfo),
    }));

    jsonResponse(res, result);
    return true;
  }

  // GET /api/convert?color=#ff6b35
  if (pathname === '/api/convert') {
    const color = url.searchParams.get('color');
    if (!color || !isValidHex(color)) {
      errorResponse(res, 'Invalid color.');
      return true;
    }
    jsonResponse(res, colorInfo(color));
    return true;
  }

  // GET /api/contrast?color1=#000000&color2=#ffffff
  if (pathname === '/api/contrast') {
    const c1 = url.searchParams.get('color1');
    const c2 = url.searchParams.get('color2');
    if (!c1 || !c2 || !isValidHex(c1) || !isValidHex(c2)) {
      errorResponse(res, 'Provide two valid hex colors (color1, color2).');
      return true;
    }
    jsonResponse(res, checkContrast(c1, c2));
    return true;
  }

  // GET /api/random?count=5
  if (pathname === '/api/random') {
    const count = Math.min(Math.max(parseInt(url.searchParams.get('count') || '5', 10) || 5, 1), 20);
    const colors = generateRandom(count);
    jsonResponse(res, colors.map(colorInfo));
    return true;
  }

  return false;
}

export function startServer(port: number = 3458): void {
  // Resolve public dir relative to the compiled dist/ folder
  const publicDir = path.resolve(__dirname, '..', 'public');

  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`);

    // API routes
    if (url.pathname.startsWith('/api/')) {
      if (handleApi(req, res, url)) return;
      errorResponse(res, 'Not found', 404);
      return;
    }

    // Static files
    let filePath = path.join(publicDir, url.pathname === '/' ? 'index.html' : url.pathname);
    filePath = path.normalize(filePath);

    // Security: prevent directory traversal
    if (!filePath.startsWith(publicDir)) {
      errorResponse(res, 'Forbidden', 403);
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        // Fallback to index.html for SPA
        fs.readFile(path.join(publicDir, 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data2);
        });
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });

  server.listen(port, () => {
    console.log(`\n  \x1b[1mColorCraft\x1b[0m web UI running at \x1b[36mhttp://localhost:${port}\x1b[0m\n`);
    console.log('  Press Ctrl+C to stop.\n');
  });
}
