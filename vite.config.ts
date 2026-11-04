import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger';

export default defineConfig(({ command }) => ({
  // Using relative base path to ensure compatibility with GitHub Pages subfolders and HashRouter
  base: "./",
  plugins: [
    // Only include the editor component tagger during local development
    command === 'serve' ? dyadComponentTagger() : null,
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));