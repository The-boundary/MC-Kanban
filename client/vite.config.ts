import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { execSync } from 'node:child_process';
import process from 'node:process';

let gitCommitHash = process.env.GIT_COMMIT_HASH || 'dev';
if (gitCommitHash === 'dev') {
  try {
    gitCommitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim() || 'dev';
  } catch {
    // ignore
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __GIT_COMMIT_HASH__: JSON.stringify(gitCommitHash),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3049',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
