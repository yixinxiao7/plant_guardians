import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy all /api/* requests to the backend.
// This eliminates direct cross-origin (CORS) requests during local dev and
// staging (npm run dev / npm run preview).  In production, VITE_API_BASE_URL
// should be set to the absolute backend URL instead.
const backendTarget = 'http://localhost:3000';

const proxyConfig = {
  '/api': {
    target: backendTarget,
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: proxyConfig,
  },
  preview: {
    proxy: proxyConfig,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
})
