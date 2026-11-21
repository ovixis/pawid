import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    rollupOptions: { input: { main: "index.html", venues: "venues.html", install: "install.html", vet: "vet.html", support: "support.html", ai: "ai.html", manifesto: "manifesto.html", rules: "rules.html" } },
  },
});
