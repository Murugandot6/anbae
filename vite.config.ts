import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  base: "/your-repo-name/", // IMPORTANT: Replace 'your-repo-name' with your actual GitHub repository name (e.g., '/anbae/')
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
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html') // Explicitly define index.html as the main input
      }
    }
  }
}));