import { defineConfig } from "vite";

// Builds the one script venues paste: https://pawid.hospet.eu/embed/v1.js
// (a normal build, not lib mode, so the ES output is minified).
// The QR decoder for browsers without BarcodeDetector is a separate chunk, loaded only when needed.
export default defineConfig({
  publicDir: false,
  build: {
    target: "es2022",
    outDir: "../../apps/web/dist/embed",
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      input: "src/index.ts",
      preserveEntrySignatures: "exports-only",
      output: { format: "es", entryFileNames: "v1.js", chunkFileNames: "chunks/[name]-[hash].js" },
    },
  },
});
