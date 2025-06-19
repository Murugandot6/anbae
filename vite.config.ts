import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  base: "/anbae/", // Set base path to your GitHub repository name
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
    outDir: 'docs', // Output build files to the 'docs' directory
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html') // Explicitly define index.html as the main input
      }
    }
  }
}));