import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appUrl = env.VITE_APP_URL || (command === 'serve' ? 'http://localhost:5173' : '');
  let url: URL;
  try {
    url = new URL(appUrl);
  } catch {
    throw new Error('Set VITE_APP_URL to the public HTTPS origin of the app');
  }
  if (
    url.href.replace(/\/$/, '') !== appUrl ||
    url.search !== '' ||
    url.hash !== '' ||
    (url.protocol !== 'https:' && !(command === 'serve' && url.hostname === 'localhost' && url.protocol === 'http:'))
  ) {
    throw new Error('VITE_APP_URL must be an HTTPS app URL without a trailing slash');
  }
  const base = url.pathname === '/' ? '/' : `${url.pathname.replace(/\/+$/, '')}/`;
  const manifest = JSON.stringify({
    url: appUrl,
    name: 'TON-Coin',
    iconUrl: `${appUrl}/icon.png`,
  });
  return {
    base,
    plugins: [
      react(),
      {
        name: 'tonconnect-manifest',
        configureServer(server) {
          server.middlewares.use('/tonconnect-manifest.json', (_req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(manifest);
          });
        },
        generateBundle() {
          this.emitFile({ type: 'asset', fileName: 'tonconnect-manifest.json', source: manifest });
        },
      },
    ],
  };
});
