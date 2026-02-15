/**
 * Vite plugin to inject remote styles.
 * Wraps remote module imports with CSS loading logic.
 */
export function remoteStylesPlugin(mfConfig) {
  return {
    name: 'remote-styles-loader',
    apply: 'serve', // Only for dev server
    transform(code, id) {
      // Check if this file imports from remote
      const remoteStyles = mfConfig?.remoteStyles || {};
      
      let modified = code;
      let hasRemoteImport = false;

      // For each configured remote, inject CSS loading if the file imports from it
      for (const [remoteName, styleUrl] of Object.entries(remoteStyles)) {
        // Match imports like: from 'remote/...' or from "remote/..."
        const importRegex = new RegExp(
          `from\\s+['"]${remoteName}/`,
          'g'
        );

        if (importRegex.test(code)) {
          hasRemoteImport = true;
          // Inject CSS load logic at the top of the module
          const cssLoaderCode = `
(function() {
  if (typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '${styleUrl}';
    // Avoid duplicates
    if (!document.querySelector(\`link[href="\${link.href}"]\`)) {
      document.head.appendChild(link);
    }
  }
})();
`;
          // Prepend the CSS loader
          modified = cssLoaderCode + modified;
        }
      }

      return hasRemoteImport ? modified : code;
    }
  };
}
