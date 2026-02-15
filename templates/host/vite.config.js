import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@module-federation/vite";
import mfConfig from "../../mf.config.json";

export default defineConfig({
  server: {
    port: 3000
  },
  plugins: [
    react(),
    federation({
      name: "host",
      remotes: mfConfig.remotes,
      shared: ["react", "react-dom"]
    })
  ]
});
