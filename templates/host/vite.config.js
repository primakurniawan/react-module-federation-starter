import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

const mfConfigPath = path.resolve(process.cwd(), '..', '..', 'mf.config.json');
const mfConfig = JSON.parse(fs.readFileSync(mfConfigPath, 'utf-8'));

export default defineConfig({
  server: {
    port: 3000
  },
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: mfConfig.remotes,
      shared: ['react', 'react-dom'],
      dts: false
    })
  ]
});
