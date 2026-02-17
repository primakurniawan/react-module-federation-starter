#!/usr/bin/env node

'use strict';

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// ─── ASCII Banner ──────────────────────────────────────────────────────────────
function printBanner() {
  console.log(chalk.cyan(`
  ╔══════════════════════════════════════════════╗
  ║   React Module Federation Starter  🚀        ║
  ║   Scaffold micro-frontend apps with ease     ║
  ╚══════════════════════════════════════════════╝
  `));
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function validateProjectName(name) {
  if (!name || name.trim().length === 0) return 'Project name cannot be empty';
  if (!/^[a-z0-9-_]+$/.test(name)) return 'Use only lowercase letters, numbers, hyphens or underscores';
  return true;
}

function validateRemoteName(name) {
  if (!name || name.trim().length === 0) return 'Remote name cannot be empty';
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) return 'Must start with a letter and contain only letters, numbers or underscores';
  return true;
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return 'Please enter a valid URL (e.g. http://localhost:3001)';
  }
}

function validatePort(port) {
  const n = parseInt(port, 10);
  if (isNaN(n) || n < 1024 || n > 65535) return 'Port must be a number between 1024 and 65535';
  return true;
}

// ─── Remote management prompts ─────────────────────────────────────────────────
async function promptRemotes(existingRemotes = []) {
  const remotes = [...existingRemotes];

  console.log(chalk.yellow('\n  Configure Remote Apps'));
  console.log(chalk.gray('  Remotes are micro-frontend apps exposed to the host.\n'));

  let addMore = true;
  while (addMore) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: remotes.length === 0
          ? 'Would you like to add a remote app?'
          : `You have ${remotes.length} remote(s). What would you like to do?`,
        choices: [
          { name: '➕  Add a remote', value: 'add' },
          ...(remotes.length > 0 ? [
            { name: '✏️   Edit a remote', value: 'edit' },
            { name: '🗑️   Remove a remote', value: 'remove' },
            { name: '📋  View current remotes', value: 'view' },
          ] : []),
          { name: '✅  Done configuring remotes', value: 'done' },
        ],
      },
    ]);

    if (action === 'done') {
      addMore = false;
    } else if (action === 'view') {
      if (remotes.length === 0) {
        console.log(chalk.gray('    No remotes configured yet.\n'));
      } else {
        console.log(chalk.cyan('\n  Current remotes:'));
        remotes.forEach((r, i) => {
          console.log(chalk.white(`    [${i + 1}] ${r.name} → ${r.url}/remoteEntry.js (port ${r.port})`));
        });
        console.log('');
      }
    } else if (action === 'add') {
      const remote = await promptSingleRemote(remotes);
      remotes.push(remote);
      console.log(chalk.green(`  ✔ Remote "${remote.name}" added.\n`));
    } else if (action === 'edit') {
      const { index } = await inquirer.prompt([
        {
          type: 'list',
          name: 'index',
          message: 'Which remote do you want to edit?',
          choices: remotes.map((r, i) => ({ name: `${r.name} (${r.url})`, value: i })),
        },
      ]);
      const updated = await promptSingleRemote(remotes, remotes[index]);
      remotes[index] = updated;
      console.log(chalk.green(`  ✔ Remote "${updated.name}" updated.\n`));
    } else if (action === 'remove') {
      const { index } = await inquirer.prompt([
        {
          type: 'list',
          name: 'index',
          message: 'Which remote do you want to remove?',
          choices: remotes.map((r, i) => ({ name: `${r.name} (${r.url})`, value: i })),
        },
      ]);
      const removed = remotes.splice(index, 1)[0];
      console.log(chalk.yellow(`  ✔ Remote "${removed.name}" removed.\n`));
    }
  }

  return remotes;
}

async function promptSingleRemote(existingRemotes = [], defaults = {}) {
  const usedNames = existingRemotes
    .filter(r => r !== defaults)
    .map(r => r.name.toLowerCase());

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Remote app name (used as MF scope):',
      default: defaults.name || '',
      validate: (val) => {
        const check = validateRemoteName(val);
        if (check !== true) return check;
        if (usedNames.includes(val.toLowerCase())) return `A remote named "${val}" already exists`;
        return true;
      },
    },
    {
      type: 'input',
      name: 'port',
      message: 'Dev server port for this remote:',
      default: defaults.port || '3001',
      validate: validatePort,
    },
    {
      type: 'input',
      name: 'url',
      message: 'Production/remote URL (used in host webpack config):',
      default: (ans) => defaults.url || `http://localhost:${ans.port}`,
      validate: validateUrl,
    },
    {
      type: 'input',
      name: 'exposes',
      message: 'Component to expose (e.g. App):',
      default: defaults.exposes || 'App',
      validate: (val) => val.trim().length > 0 || 'Exposed component name is required',
    },
  ]);

  return {
    name: answers.name,
    port: answers.port,
    url: answers.url,
    exposes: answers.exposes,
  };
}

// ─── File generation ───────────────────────────────────────────────────────────
function generateHostWebpackConfig({ projectName, hostPort, remotes }) {
  const remotesConfig = remotes.map(r =>
    `      ${r.name}: '${r.name}@${r.url}/remoteEntry.js',`
  ).join('\n');

  return `const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  devtool: 'source-map',
  output: {
    publicPath: 'auto',
  },
  resolve: {
    extensions: ['.jsx', '.js', '.json'],
  },
  devServer: {
    port: ${hostPort},
    historyApiFallback: true,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  module: {
    rules: [
      {
        test: /\\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['@babel/preset-react'],
        },
      },
      {
        test: /\\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
${remotesConfig}
      },
      shared: {
        react: { singleton: true, requiredVersion: deps.react },
        'react-dom': { singleton: true, requiredVersion: deps['react-dom'] },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
`;
}

function generateRemoteWebpackConfig({ remoteName, remotePort, remoteUrl, exposes }) {
  return `const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  devtool: 'source-map',
  output: {
    publicPath: '${remoteUrl}/',
  },
  resolve: {
    extensions: ['.jsx', '.js', '.json'],
  },
  devServer: {
    port: ${remotePort},
    historyApiFallback: true,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  module: {
    rules: [
      {
        test: /\\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['@babel/preset-react'],
        },
      },
      {
        test: /\\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: '${remoteName}',
      filename: 'remoteEntry.js',
      exposes: {
        './${exposes}': './src/${exposes}.jsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: deps.react },
        'react-dom': { singleton: true, requiredVersion: deps['react-dom'] },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
`;
}

function generateHostApp({ remotes }) {
  const imports = remotes.map(r =>
    `const Remote${r.exposes} = React.lazy(() => import('${r.name}/${r.exposes}'));`
  ).join('\n');

  const components = remotes.map(r => `
      <section>
        <h2>${r.name}</h2>
        <React.Suspense fallback={<div className="loading">Loading ${r.name}…</div>}>
          <ErrorBoundary remoteName="${r.name}">
            <Remote${r.exposes} />
          </ErrorBoundary>
        </React.Suspense>
      </section>`).join('\n');

  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

${imports || '// No remotes configured. Add them in webpack.config.js'}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <p>⚠️ Failed to load <strong>{this.props.remoteName}</strong></p>
          <small>{this.state.error?.message}</small>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <div className="host-app">
      <header>
        <h1>🏠 Host Application</h1>
        <p>Module Federation Micro-Frontend Shell</p>
      </header>
      <main>
${components || '        <p>No remote apps configured. Run the CLI again to add remotes.</p>'}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
`;
}

function generateRemoteApp({ remoteName, exposes }) {
  return `import React from 'react';

export default function ${exposes}() {
  return (
    <div className="remote-app">
      <div className="remote-badge">${remoteName}</div>
      <h2>Hello from <em>${remoteName}</em>!</h2>
      <p>This component is exposed via Module Federation.</p>
      <p>Edit <code>src/${exposes}.jsx</code> to customize this remote.</p>
    </div>
  );
}
`;
}

function generateRemoteIndex() {
  return `// ⚠️ Dynamic import is required here to allow webpack to initialize
// the Module Federation shared scope before any imports resolve.
import('./bootstrap');
`;
}

function generateHostIndex() {
  return `// ⚠️ Dynamic import is required here to allow webpack to initialize
// the Module Federation shared scope before any imports resolve.
import('./App');
`;
}

function generateCss(isHost) {
  if (isHost) {
    return `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; background: #f0f2f5; color: #1a1a2e; }
.host-app { min-height: 100vh; }
.host-app header { background: #1a1a2e; color: #fff; padding: 2rem; text-align: center; }
.host-app header h1 { font-size: 2rem; }
.host-app header p { opacity: 0.7; margin-top: 0.5rem; }
.host-app main { max-width: 960px; margin: 2rem auto; padding: 0 1rem; display: grid; gap: 1.5rem; }
section { background: #fff; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
section h2 { font-size: 1rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; }
.loading { color: #aaa; font-style: italic; padding: 1rem 0; }
.error-boundary { background: #fff0f0; border: 1px solid #ffcccc; border-radius: 8px; padding: 1rem; color: #cc0000; }
`;
  }
  return `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; }
.remote-app { padding: 1.5rem; }
.remote-badge { display: inline-block; background: #e0f0ff; color: #0066cc; font-size: 0.75rem;
  font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 999px; margin-bottom: 1rem; }
.remote-app h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
.remote-app p { color: #555; line-height: 1.6; }
.remote-app code { background: #f4f4f4; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
`;
}

function generateHtml(title) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;
}

function generateAppPackageJson(name, port) {
  return JSON.stringify({
    name,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'webpack serve --mode development',
      build: 'webpack --mode production',
      start: 'webpack serve --mode production',
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@babel/core': '^7.23.0',
      '@babel/preset-react': '^7.23.0',
      'babel-loader': '^9.1.3',
      'css-loader': '^6.8.1',
      'html-webpack-plugin': '^5.5.3',
      'style-loader': '^3.3.3',
      webpack: '^5.89.0',
      'webpack-cli': '^5.1.4',
      'webpack-dev-server': '^4.15.1',
    },
  }, null, 2);
}

function generateRootPackageJson(projectName, remotes) {
  const workspaces = ['apps/host', ...remotes.map(r => `apps/${r.name}`)];
  const devScripts = {
    'dev:host': 'npm run dev --workspace=apps/host',
    ...Object.fromEntries(remotes.map(r => [`dev:${r.name}`, `npm run dev --workspace=apps/${r.name}`])),
    dev: `concurrently ${['apps/host', ...remotes.map(r => `apps/${r.name}`)].map(w => `"npm run dev --workspace=${w}"`).join(' ')}`,
    build: `npm run build --workspaces`,
  };
  return JSON.stringify({
    name: projectName,
    version: '1.0.0',
    private: true,
    workspaces,
    scripts: devScripts,
    devDependencies: {
      concurrently: '^8.2.2',
    },
  }, null, 2);
}

function generateMonorepoReadme(projectName, hostPort, remotes) {
  const remoteRows = remotes.map(r =>
    `| \`apps/${r.name}\` | Remote | http://localhost:${r.port} | Exposes \`${r.exposes}\` |`
  ).join('\n');

  return `# ${projectName}

> React Micro-Frontend App built with [Module Federation](https://webpack.js.org/concepts/module-federation/) + Webpack 5

## Structure

\`\`\`
${projectName}/
├── apps/
│   ├── host/         # Shell / host application
${remotes.map(r => `│   ├── ${r.name}/      # Remote micro-frontend`).join('\n')}
│
└── package.json      # Monorepo root (npm workspaces)
\`\`\`

## Apps

| App | Role | Dev URL | Notes |
|-----|------|---------|-------|
| \`apps/host\` | Host | http://localhost:${hostPort} | Loads all remotes |
${remoteRows}

## Getting Started

\`\`\`bash
# Install all dependencies
npm install

# Run everything in parallel
npm run dev

# Or run individually
npm run dev:host
${remotes.map(r => `npm run dev:${r.name}`).join('\n')}
\`\`\`

## Adding / Modifying Remotes

Edit \`apps/host/webpack.config.js\` and update the \`remotes\` block inside \`ModuleFederationPlugin\`:

\`\`\`js
new ModuleFederationPlugin({
  name: 'host',
  remotes: {
    myRemote: 'myRemote@http://localhost:3002/remoteEntry.js',
  },
  // ...
})
\`\`\`

## How Module Federation Works

- Each **remote** app builds a \`remoteEntry.js\` and exposes components via \`ModuleFederationPlugin\`.
- The **host** declares which remotes to consume and loads their entry files at runtime.
- \`react\` and \`react-dom\` are set as **singletons** so only one instance runs.

## Built With

- ⚛️ React 18
- 📦 Webpack 5 Module Federation
- 🏎️ webpack-dev-server
- 🔧 Babel
`;
}

// ─── Project scaffold ──────────────────────────────────────────────────────────
async function scaffoldProject(projectName, { hostPort, remotes }) {
  const projectDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(projectDir)) {
    console.log(chalk.red(`\n  ✖ Directory "${projectName}" already exists. Please choose a different name.\n`));
    process.exit(1);
  }

  const spinner = ora('Scaffolding project…').start();

  try {
    // Root
    fs.mkdirpSync(projectDir);
    fs.writeFileSync(
      path.join(projectDir, 'package.json'),
      generateRootPackageJson(projectName, remotes)
    );
    fs.writeFileSync(
      path.join(projectDir, '.gitignore'),
      'node_modules\ndist\n.DS_Store\n'
    );
    fs.writeFileSync(
      path.join(projectDir, 'README.md'),
      generateMonorepoReadme(projectName, hostPort, remotes)
    );

    // Host app
    const hostDir = path.join(projectDir, 'apps', 'host');
    fs.mkdirpSync(path.join(hostDir, 'src'));
    fs.mkdirpSync(path.join(hostDir, 'public'));

    fs.writeFileSync(path.join(hostDir, 'package.json'), generateAppPackageJson('host', hostPort));
    fs.writeFileSync(path.join(hostDir, 'webpack.config.js'), generateHostWebpackConfig({ projectName, hostPort, remotes }));
    fs.writeFileSync(path.join(hostDir, 'src', 'index.js'), generateHostIndex());
    fs.writeFileSync(path.join(hostDir, 'src', 'App.jsx'), generateHostApp({ remotes }));
    fs.writeFileSync(path.join(hostDir, 'src', 'index.css'), generateCss(true));
    fs.writeFileSync(path.join(hostDir, 'public', 'index.html'), generateHtml('Host App'));

    // Remote apps
    for (const remote of remotes) {
      const remoteDir = path.join(projectDir, 'apps', remote.name);
      fs.mkdirpSync(path.join(remoteDir, 'src'));
      fs.mkdirpSync(path.join(remoteDir, 'public'));

      fs.writeFileSync(path.join(remoteDir, 'package.json'), generateAppPackageJson(remote.name, remote.port));
      fs.writeFileSync(
        path.join(remoteDir, 'webpack.config.js'),
        generateRemoteWebpackConfig({
          remoteName: remote.name,
          remotePort: remote.port,
          remoteUrl: remote.url,
          exposes: remote.exposes,
        })
      );
      fs.writeFileSync(path.join(remoteDir, 'src', 'index.js'), generateRemoteIndex());
      fs.writeFileSync(path.join(remoteDir, 'src', `${remote.exposes}.jsx`), generateRemoteApp({ remoteName: remote.name, exposes: remote.exposes }));
      fs.writeFileSync(path.join(remoteDir, 'src', 'index.css'), generateCss(false));
      fs.writeFileSync(path.join(remoteDir, 'public', 'index.html'), generateHtml(`${remote.name} Remote`));
    }

    spinner.succeed(chalk.green('Project scaffolded!'));
  } catch (err) {
    spinner.fail('Failed to scaffold project');
    console.error(err);
    process.exit(1);
  }
}

// ─── CLI entry ─────────────────────────────────────────────────────────────────
async function main() {
  printBanner();

  program
    .name('create-react-mf-starter')
    .version('1.0.0')
    .argument('[project-name]', 'Name of the project to create')
    .option('--host-port <port>', 'Port for the host app', '3000')
    .parse(process.argv);

  const options = program.opts();
  let projectName = program.args[0];

  // Prompt for project name if not provided
  if (!projectName) {
    const ans = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What is your project name?',
        default: 'my-mf-app',
        validate: validateProjectName,
      },
    ]);
    projectName = ans.projectName;
  } else {
    const valid = validateProjectName(projectName);
    if (valid !== true) {
      console.log(chalk.red(`\n  ✖ ${valid}\n`));
      process.exit(1);
    }
  }

  // Host config
  const { hostPort } = await inquirer.prompt([
    {
      type: 'input',
      name: 'hostPort',
      message: 'Port for the host app:',
      default: options.hostPort || '3000',
      validate: validatePort,
    },
  ]);

  // Remote management
  const remotes = await promptRemotes();

  // Confirm
  console.log(chalk.cyan('\n  ─── Summary ───────────────────────────────'));
  console.log(`  Project  : ${chalk.white(projectName)}`);
  console.log(`  Host     : http://localhost:${hostPort}`);
  if (remotes.length > 0) {
    console.log(`  Remotes  :`);
    remotes.forEach(r => console.log(`    • ${chalk.white(r.name)} → ${r.url}/remoteEntry.js (port ${r.port}, exposes ${r.exposes})`));
  } else {
    console.log(`  Remotes  : ${chalk.gray('none (you can add them later)')}`);
  }
  console.log(chalk.cyan('  ───────────────────────────────────────────\n'));

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Create project with these settings?',
      default: true,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('\n  Cancelled.\n'));
    process.exit(0);
  }

  await scaffoldProject(projectName, { hostPort, remotes });

  // Success output
  console.log(chalk.green(`
  ✅  Project ready! Here's how to get started:

  ${chalk.white(`cd ${projectName}`)}
  ${chalk.white('npm install')}
  ${chalk.white('npm run dev')}

  Then open:
    Host  → ${chalk.cyan(`http://localhost:${hostPort}`)}
${remotes.map(r => `    ${r.name}  → ${chalk.cyan(`http://localhost:${r.port}`)}`).join('\n')}

  ${chalk.gray('Happy micro-fronting! 🎉')}
  `));
}

main().catch(err => {
  console.error(chalk.red('\n  Unexpected error:'), err.message);
  process.exit(1);
});
