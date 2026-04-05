import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/cnn-rss": {
        target: "http://rss.cnn.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cnn-rss/, ""),
      },
      "/api/gdelt-doc": {
        target: "https://api.gdeltproject.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gdelt-doc/, "/api/v2/doc/doc"),
      },
      "/api/gdelt": {
        target: "https://api.gdeltproject.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gdelt/, "/api/v2/geo/geo"),
      },
      "/api/google-news": {
        target: "https://news.google.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-news/, ""),
        configure: (proxy, _options) => {
          proxy.on("proxyRes", (proxyRes, req, res) => {
            if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
              proxyRes.headers.location = proxyRes.headers.location.replace("https://news.google.com", "/api/google-news");
            }
          });
        }
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
