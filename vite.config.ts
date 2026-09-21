import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: "/ai-language-learning/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "語言小島 · AI 日文英文學習",
        short_name: "語言小島",
        lang: "zh-Hant",
        description: "每天一點點，世界更靠近。",
        start_url: "/ai-language-learning/",
        scope: "/ai-language-learning/",
        display: "standalone",
        background_color: "#f8faf7",
        theme_color: "#218675",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        navigateFallback: "/ai-language-learning/index.html",
      },
    }),
  ],
});
