import { defineConfig } from 'astro/config';
const workerURL = process.env.SWOOVR_LOCAL_WORKER_URL || 'http://127.0.0.1:8787';
export default defineConfig({
 site: 'https://swoovr.com', output: 'static',
 vite: {server: {proxy: {
  '/api/': {target:workerURL,changeOrigin:true,configure(proxy) {
   proxy.on('proxyReq',(outgoing,incoming) => {
    // Only the local Astro origins are translated to the local Worker origin.
    if(['http://localhost:4321','http://127.0.0.1:4321','http://localhost:4325','http://127.0.0.1:4325'].includes(incoming.headers.origin)) outgoing.setHeader('origin',workerURL);
   });
  }},
  '/sitemap.xml': {target:workerURL,changeOrigin:true},
  '/sitemap-index.xml': {target:workerURL,changeOrigin:true},
  '/robots.txt': {target:workerURL,changeOrigin:true},
 }}},
});
