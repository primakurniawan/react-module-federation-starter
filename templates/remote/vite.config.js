const { defineConfig } = require('vite');
const reactPkg = require('@vitejs/plugin-react');
const federationPkg = require('@module-federation/vite');

const react = reactPkg && reactPkg.default ? reactPkg.default : reactPkg;
const federationFactory = (...args) => {
  const p = require('@module-federation/vite');
  const fn = p && p.default ? p.default : (p && p.federation ? p.federation : p);
  if (typeof fn !== 'function') {
    throw new Error('@module-federation/vite did not export a plugin function');
  }
  return fn(...args);
};

module.exports = defineConfig({
  server: {
    port: 3001
  },
  plugins: [
    react(),
    federationFactory({
      name: 'remote',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/Button.jsx',
        './Modal': './src/Modal.jsx'
      },
      shared: ['react', 'react-dom']
    })
  ]
});
