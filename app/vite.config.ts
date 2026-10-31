import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Samsung TVs 2020–2024 run Tizen 5.5–8.0, i.e. Chromium 69–108. The packaged app is
 * loaded from local files, where module scripts can be refused, so the build is a single
 * classic (IIFE) script compiled down to Chromium 69 and loaded with `defer`.
 */
const TV_TARGET = "chrome69";

function classicScript(): Plugin {
  return {
    name: "tizen-classic-script",
    apply: "build",
    enforce: "post",
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module" crossorigin/g, "<script defer")
        .replace(/<link rel="stylesheet" crossorigin/g, '<link rel="stylesheet"')
        .replace(/<link rel="modulepreload"[^>]*>/g, "");
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), classicScript()],
  build: {
    target: TV_TARGET,
    cssTarget: TV_TARGET,
    modulePreload: false,
    assetsInlineLimit: 0,
    sourcemap: false,
    rollupOptions: {
      output: {
        format: "iife",
        inlineDynamicImports: true,
        // Hashed, so an updated install never runs a cached copy of the previous bundle.
        entryFileNames: "assets/app-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  esbuild: { target: TV_TARGET },
  server: { host: "127.0.0.1", port: 5173 },
});
