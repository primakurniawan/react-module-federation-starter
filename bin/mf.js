#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const action = args[0];

const cfgPath = path.resolve(process.cwd(), 'mf.config.json');

function loadConfig() {
  if (!fs.existsSync(cfgPath)) {
    console.error('mf.config.json not found in', process.cwd());
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
}

function saveConfig(cfg) {
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
}

function help() {
  console.log('mf CLI - manage remotes in mf.config.json');
  console.log('Usage: mf <command> [args]');
  console.log('Commands:');
  console.log('  add <name> [url]      Add a remote (default url http://localhost:3001/remoteEntry.js)');
  console.log('  remove <name>         Remove a remote');
  console.log('  rename <old> <new>    Rename a remote key');
  console.log('  move <name> <url>     Change the URL for a remote');
  console.log('  list                  List configured remotes');
  console.log('  help                  Show this message');
}

if (!action || action === 'help') {
  help();
  process.exit(0);
}

if (action === 'list') {
  const cfg = loadConfig();
  console.log('Remotes:');
  for (const [k, v] of Object.entries(cfg.remotes || {})) {
    console.log(` - ${k}: ${v}`);
  }
  process.exit(0);
}

if (action === 'add') {
  const name = args[1];
  const url = args[2] || 'http://localhost:3001/remoteEntry.js';
  if (!name) {
    console.error('Please provide a name: mf add <name> [url]');
    process.exit(1);
  }
  const cfg = loadConfig();
  cfg.remotes = cfg.remotes || {};
  if (cfg.remotes[name]) {
    console.error('Remote already exists:', name);
    process.exit(1);
  }
  cfg.remotes[name] = url;
  saveConfig(cfg);
  console.log(`✅ Remote ${name} added -> ${url}`);
  process.exit(0);
}

if (action === 'remove') {
  const name = args[1];
  if (!name) {
    console.error('Please provide a name: mf remove <name>');
    process.exit(1);
  }
  const cfg = loadConfig();
  if (!cfg.remotes || !cfg.remotes[name]) {
    console.error('Remote not found:', name);
    process.exit(1);
  }
  delete cfg.remotes[name];
  saveConfig(cfg);
  console.log(`❌ Remote ${name} removed`);
  process.exit(0);
}

if (action === 'rename') {
  const oldName = args[1];
  const newName = args[2];
  if (!oldName || !newName) {
    console.error('Usage: mf rename <old> <new>');
    process.exit(1);
  }
  const cfg = loadConfig();
  if (!cfg.remotes || !cfg.remotes[oldName]) {
    console.error('Remote not found:', oldName);
    process.exit(1);
  }
  if (cfg.remotes[newName]) {
    console.error('Target name already exists:', newName);
    process.exit(1);
  }
  cfg.remotes[newName] = cfg.remotes[oldName];
  delete cfg.remotes[oldName];
  saveConfig(cfg);
  console.log(`🔁 Renamed ${oldName} -> ${newName}`);
  process.exit(0);
}

if (action === 'move' || action === 'set') {
  const name = args[1];
  const url = args[2];
  if (!name || !url) {
    console.error('Usage: mf move <name> <url>');
    process.exit(1);
  }
  const cfg = loadConfig();
  if (!cfg.remotes || !cfg.remotes[name]) {
    console.error('Remote not found:', name);
    process.exit(1);
  }
  cfg.remotes[name] = url;
  saveConfig(cfg);
  console.log(`📦 Remote ${name} moved -> ${url}`);
  process.exit(0);
}

console.error('Unknown command:', action);
help();
process.exit(1);
