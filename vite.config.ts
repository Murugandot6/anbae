import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  base: "/anbae/", // Set the base path to your GitHub repository name for GitHub Pages deployment
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), dyadComponentTagger()], // Changed order: react() comes first
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));