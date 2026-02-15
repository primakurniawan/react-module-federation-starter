#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

// This wrapper runs the local bin/mf.js with provided args, and optionally
// starts `npm run dev` in the project if `--dev` or `-d` is passed.

const args = process.argv.slice(2);
const runDevIndex = args.findIndex(a => a === '--dev' || a === '-d');
const shouldRunDev = runDevIndex !== -1;
if (shouldRunDev) args.splice(runDevIndex, 1);

const mfPath = path.join(__dirname, 'mf.js');
const res = spawnSync(process.execPath, [mfPath, ...args], { stdio: 'inherit' });
if (res.status !== 0) process.exit(res.status);

if (shouldRunDev) {
  console.log('\nStarting dev servers... (ctrl+c to stop)');
  const dev = spawnSync('npm', ['run', 'dev'], { stdio: 'inherit' });
  process.exit(dev.status);
}
