import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,  // Avoid warnings for large chunks
  },
  server: {
    port: 5173,  // Default port
    open: true,  // Auto open browser on dev
    watch: {
      usePolling: true,
    },
  },
  esbuild: {
    minify: true,  // Minify to reduce memory usage
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
