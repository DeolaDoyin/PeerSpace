import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '127.0.0.1',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // We are removing the "manualChunks" entirely for now.
    // This allows Vite to use its default settings, which are 
    // much harder to break during deployment.
    rollupOptions: {
      output: {
        manualChunks: undefined 
      }
    }
  }
})
