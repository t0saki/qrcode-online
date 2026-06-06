import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    cloudflare(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png", "og-image.png"],
      manifest: {
        name: "QR Code Online",
        short_name: "QR",
        description: "Generate & scan QR codes, beautifully.",
        lang: "en",
        theme_color: "#3b6cf6",
        background_color: "#0e1116",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "Generate", url: "/?mode=generate", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "Scan", url: "/?mode=scan", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2,png}"],
        globIgnores: ["**/*.wasm"],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /zxing_reader.*\.wasm$/,
            handler: "CacheFirst",
            options: { cacheName: "zxing-wasm", expiration: { maxEntries: 2 } },
          },
          {
            urlPattern: /\/api\/qr\.(png|svg)/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "qr-images", expiration: { maxEntries: 60 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
