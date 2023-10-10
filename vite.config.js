// Plugins
import vue from "@vitejs/plugin-vue"
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify"
import { VitePWA } from "vite-plugin-pwa"

// Utilities
import { defineConfig } from "vite"
import { fileURLToPath, URL } from "node:url"

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue({
            template: { transformAssetUrls },
        }),
        // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
        vuetify({
            autoImport: true,
        }),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true
            },
            manifest: {
                "name": "Clippings - by June07",
                "short_name": "Clippings",
                "icons": [
                    {
                        "src": "/android-chrome-192x192.png",
                        "sizes": "192x192",
                        "type": "image/png"
                    },
                    {
                        "src": "/android-chrome-512x512.png",
                        "sizes": "512x512",
                        "type": "image/png"
                    }
                ],
                "theme_color": "#ffffff",
                "background_color": "#ffffff",
                "start_url": import.meta.MODE === 'production' ? "https://clippings.june07.com" : "https://local.clippings.june07.com",
                "display": "standalone",
                "share_target": {
                    "action": "/share",
                    "method": "POST",
                    "enctype": "multipart/form-data",
                    "params": {
                        "title": "title",
                        "text": "text",
                        "url": "url"
                    }
                }
            },
            minify: import.meta.MODE === 'production' ? true : false,
            workbox: {
                importScripts: ['sw.js'],
            }
        }),

    ],
    define: { "process.env": {} },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
        extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
    },
    server: {
        host: "0.0.0.0",
        port: 3001,
        strictPort: true,
    },
    test: {
        setupFiles: ["vuetify.config.js", "test/setup.js"],
        environment: "happy-dom",
        deps: {
            inline: ["vuetify"],
        },
        globals: true,
        reporters: ["verbose", "html"],
    },
})
