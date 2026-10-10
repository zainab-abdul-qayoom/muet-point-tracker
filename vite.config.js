import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest } from './server/apiHandler.js';

// Custom Vite plugin to serve native SQLite REST API endpoints with server-side auth
function sqliteApiPlugin() {
  return {
    name: 'sqlite-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/api/')) {
          return next();
        }
        handleApiRequest(req, res);
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), sqliteApiPlugin()],
  server: {
    port: 3001,
    host: true
  }
});
