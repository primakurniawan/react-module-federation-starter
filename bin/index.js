#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appName = process.argv[2];

if (!appName) {
  console.log("Please provide project name");
  process.exit(1);
}

const root = path.resolve(appName);

fs.mkdirSync(root);
fs.mkdirSync(path.join(root, "apps"), { recursive: true });

// copy templates
copyTemplate("host");
copyTemplate("remote");

// create mf.config.json: prefer template if it exists, otherwise write a sensible default
const templateMfConfig = path.resolve(__dirname, "..", "templates", "mf.config.json");
let mfConfig;
if (fs.existsSync(templateMfConfig)) {
  fs.copyFileSync(templateMfConfig, path.join(root, "mf.config.json"));
  mfConfig = JSON.parse(fs.readFileSync(templateMfConfig, 'utf-8'));
} else {
  mfConfig = {
    remotes: {
      remote: "http://localhost:3001/remoteEntry.js"
    },
    remoteStyles: {
      remote: "http://localhost:3001/src/styles.css"
    }
  };
  fs.writeFileSync(
    path.join(root, "mf.config.json"),
    JSON.stringify(mfConfig, null, 2)
  );
}

// Inject remoteStyles into host index.html and main.jsx
const hostIndexPath = path.join(root, "apps", "host", "index.html");
const hostMainPath = path.join(root, "apps", "host", "src", "main.jsx");

if (fs.existsSync(hostIndexPath)) {
  const remoteStylesJson = JSON.stringify(mfConfig.remoteStyles || {});
  let hostHtml = fs.readFileSync(hostIndexPath, 'utf-8');
  hostHtml = hostHtml.replace('%REMOTE_STYLES_JSON%', remoteStylesJson);
  fs.writeFileSync(hostIndexPath, hostHtml);
}

// Update main.jsx to use the correct remote styles URL
if (fs.existsSync(hostMainPath)) {
  const remoteStyleUrl = mfConfig.remoteStyles?.remote || 'http://localhost:3001/src/styles.css';
  let mainJs = fs.readFileSync(hostMainPath, 'utf-8');
  // Replace the hardcoded fetch URL with the one from mf.config.json
  mainJs = mainJs.replace(
    /fetch\('(http:\/\/localhost:[0-9]+\/src\/styles\.css)'\)/,
    `fetch('${remoteStyleUrl}')`
  );
  fs.writeFileSync(hostMainPath, mainJs);
}

// copy local CLI into generated project so users can run `npm run mf` there
const localCli = path.resolve(__dirname, 'mf.js');
const targetCliDir = path.join(root, 'bin');
fs.mkdirSync(targetCliDir, { recursive: true });
fs.copyFileSync(localCli, path.join(targetCliDir, 'mf.js'));

// write a package.json in the generated project with useful scripts
const generatedPkg = {
  name: appName,
  version: '0.0.0',
  private: true,
  scripts: {
    mf: 'node ./bin/mf.js',
    'dev:host': 'npm --prefix ./apps/host run dev',
    'dev:remote': 'npm --prefix ./apps/remote run dev',
    'dev': 'concurrently "npm:dev:host" "npm:dev:remote"'
  },
  devDependencies: {
    concurrently: '^7.6.0'
  }
};
fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(generatedPkg, null, 2) + '\n');

console.log('Installing dependencies in generated project (this will install dev tools like concurrently)');
execSync('npm install', { cwd: root, stdio: 'inherit' });

console.log("✅ React Module Federation starter created!");
console.log("\n📝 To start development:");
console.log("   cd " + appName);
console.log("   npm run dev          # starts both host (3000) and remote (3001) in parallel");
console.log("\n⚠️  Port conflicts? Kill existing processes:");
console.log("   # On Linux/Mac:");
console.log("   lsof -ti:3000,3001 | xargs kill -9");
console.log("   # Or specify different ports:");
console.log("   PORT=3001 npm --prefix ./apps/remote run dev  &");
console.log("   npm --prefix ./apps/host run dev");

function copyTemplate(name) {
  const templatePath = path.resolve("templates", name);
  const targetPath = path.join(root, "apps", name);

  fs.cpSync(templatePath, targetPath, { recursive: true });
}
