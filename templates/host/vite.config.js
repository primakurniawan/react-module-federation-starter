import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

const mfConfigPath = path.resolve(process.cwd(), '..', '..', 'mf.config.json');
const mfConfig = JSON.parse(fs.readFileSync(mfConfigPath, 'utf-8'));

function remoteStylesPlugin(config) {
  return {
    name: 'remote-styles-loader',
    apply: 'serve',
    transform(code, id) {
      const remoteStyles = config?.remoteStyles || {};
      let modified = code;
      let hasRemoteImport = false;

      for (const [remoteName, styleUrl] of Object.entries(remoteStyles)) {
        const importRegex = new RegExp(`from\\s+['"]${remoteName}/`, 'g');
        if (importRegex.test(code)) {
          hasRemoteImport = true;
          const cssLoaderCode = `
(function() {
  if (typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '${styleUrl}';
    if (!document.querySelector(\`link[href="\${link.href}"]\`)) {
      document.head.appendChild(link);
    }
  }
})();
`;
          modified = cssLoaderCode + modified;
        }
      }
      return hasRemoteImport ? modified : code;
    }
  };
}

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true
  },
  plugins: [
    react(),
    remoteStylesPlugin(mfConfig),
    federation({
      name: 'host',
      remotes: mfConfig.remotes,
      shared: ['react', 'react-dom'],
      dts: false
    })
  ]
});
