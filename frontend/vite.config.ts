export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    // 1. Increase the limit so small CSS files don't turn "red"/warn as often
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        // 2. Simpler chunking: keep core React libraries together to prevent the 'forwardRef' error
        manualChunks: {
          'vendor-core': ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          'vendor-utils': ['date-fns', 'axios', 'pusher-js', 'laravel-echo'],
          'vendor-ui': ['lucide-react', 'framer-motion', 'sonner'],
        },
      },
    },
  },
});
