import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port: 3000,
      // Dev-only proxy: forwards /api/* to the local backend
      // In production, VITE_API_URL is used as absolute base URL
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path,
        }
      }
    },
    build: {
      // Increase warning threshold — app uses many charts
      chunkSizeWarningLimit: 2000,
    }
  }
})
