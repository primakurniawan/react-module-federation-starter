const { defineConfig } = require('vite');
const reactPkg = require('@vitejs/plugin-react');
const federationPkg = require('@module-federation/vite');
const mfConfig = require('../../mf.config.json');

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
    port: 3000
  },
  plugins: [
    react(),
    federationFactory({
      name: 'host',
      remotes: mfConfig.remotes,
      shared: ['react', 'react-dom']
    })
  ]
});
