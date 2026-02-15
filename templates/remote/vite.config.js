import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  server: {
    port: 3001,
    cors: true,
    origin: `http://localhost:${process.env.PORT || 3001}`
  },
  plugins: [
    react(),
    federation({
      name: 'remote',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/Button.jsx',
        './Modal': './src/Modal.jsx'
      },
      shared: ['react', 'react-dom'],
      dts: false,
      bundleAllCSS: true
    })
  ]
});
