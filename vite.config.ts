import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  // Custom domain deployment (feedmeai.victorsaly.com) - use root path
  base: '/',
  
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  
  // Build configuration for GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      // the product site is the home page; the app lives at /app/
      input: {
        site: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
        support: resolve(__dirname, 'support/index.html'),
        credits: resolve(__dirname, 'credits/index.html'),
        notfound: resolve(__dirname, '404.html'),
        app: resolve(__dirname, 'app/index.html'),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@phosphor-icons/react']
        }
      }
    }
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true
  }
});
