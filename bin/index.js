#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

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

// create mf.config.json
fs.writeFileSync(
  path.join(root, "mf.config.json"),
  JSON.stringify(
    {
      remotes: {
        remote: "http://localhost:3001/assets/remoteEntry.js"
      }
    },
    null,
    2
  )
);

console.log("Installing dependencies...");
execSync("npm install", { cwd: root, stdio: "inherit" });

console.log("✅ React Module Federation starter created!");

function copyTemplate(name) {
  const templatePath = path.resolve("templates", name);
  const targetPath = path.join(root, "apps", name);

  fs.cpSync(templatePath, targetPath, { recursive: true });
}
