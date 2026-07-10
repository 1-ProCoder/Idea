import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Chrome and other browsers unconditionally request `/favicon.ico` as a
// fallback even when `<link rel="icon" type="image/svg+xml">` is set.
// Without a handler that returns our SVG bytes for that path, the
// network panel reports a 404 even though the real brand mark loads
// fine. This plugin reads the canonical SVG once at startup and serves
// it on `/favicon.ico` so the fallback request isn't a 404.
const faviconSvg = readFileSync(
  path.resolve(__dirname, 'public/favicon.svg'),
  'utf8',
);

const faviconIcoFallbackPlugin = {
  name: 'flowfix:favicon-ico-fallback',
  configureServer(server: import('vite').ViteDevServer): void {
    server.middlewares.use((req, res, next) => {
      if (req.url !== '/favicon.ico') {
        next();
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.end(faviconSvg);
    });
  },
};

export default defineConfig({
  plugins: [react(), faviconIcoFallbackPlugin],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: false,
      },
    },
  },
});
