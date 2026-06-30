import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      // Exclude Node.js-only agent files from the browser bundle
      external: [],
    }
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      // Stub out Node.js-only imports that agent files reference
      // (these are only used in Node.js CLI mode, not in the browser dashboard)
    }
  },
  // Optimize: exclude sphere-sdk from browser bundle (only used in Node CLI mode)
  optimizeDeps: {
    exclude: ['@unicitylabs/sphere-sdk']
  }
});
