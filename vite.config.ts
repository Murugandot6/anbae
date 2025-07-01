import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  base: "/", // Changed base path to root for custom domain deployment
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), dyadComponentTagger()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist', // Output build files to the 'dist' directory (default)
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html') // Explicitly define index.html as the main input
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
}));