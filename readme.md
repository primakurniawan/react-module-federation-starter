# create-react-mf-starter

> ⚡ Scaffold a production-ready **React Module Federation** monorepo in seconds

[![npm version](https://img.shields.io/npm/v/create-react-mf-starter)](https://www.npmjs.com/package/create-react-mf-starter)
[![license](https://img.shields.io/npm/l/create-react-mf-starter)](./LICENSE)
[![node](https://img.shields.io/node/v/create-react-mf-starter)](https://nodejs.org)

---

## What is this?

`create-react-mf-starter` is a zero-config CLI that scaffolds a **React micro-frontend monorepo** using [Webpack 5 Module Federation](https://webpack.js.org/concepts/module-federation/). It creates a **host** shell app and any number of **remote** micro-frontend apps, all wired together automatically.

No manual webpack config. No copy-pasting boilerplate. Just run `npx` and answer a few questions.

---

## Quick Start

```bash
npx create-react-mf-starter
```

Or pass the project name directly:

```bash
npx create-react-mf-starter my-app
```

The CLI will interactively ask you to configure:

- Your **project name**
- The **host app port** (default: 3000)
- Any number of **remote apps** — with add, edit, and remove support

---

## Interactive Prompts

```
  ╔══════════════════════════════════════════════╗
  ║   React Module Federation Starter  🚀        ║
  ║   Scaffold micro-frontend apps with ease     ║
  ╚══════════════════════════════════════════════╝

? What is your project name? my-mf-app
? Port for the host app: 3000

  Configure Remote Apps
? Would you like to add a remote app?
  ➕  Add a remote
  ✅  Done configuring remotes

? Remote app name (used as MF scope): cart
? Dev server port for this remote: 3001
? Production/remote URL: http://localhost:3001
? Component to expose: App
✔ Remote "cart" added.
```

The remote manager supports **add, edit, remove, and view** — so you can configure your entire micro-frontend architecture before generating any files.

---

## Generated Structure

```
my-mf-app/
├── apps/
│   ├── host/                 # Shell / host application
│   │   ├── public/
│   │   │   └── index.html
│   │   ├── src/
│   │   │   ├── index.js      # Dynamic bootstrap entry
│   │   │   ├── App.jsx       # Host shell with Suspense + ErrorBoundary
│   │   │   └── index.css
│   │   ├── package.json
│   │   └── webpack.config.js
│   │
│   └── cart/                 # Remote micro-frontend
│       ├── public/
│       │   └── index.html
│       ├── src/
│       │   ├── index.js
│       │   ├── App.jsx       # Exposed remote component
│       │   └── index.css
│       ├── package.json
│       └── webpack.config.js
│
├── package.json              # Monorepo root (npm workspaces)
├── .gitignore
└── README.md
```

---

## Running the Project

```bash
cd my-mf-app
npm install

# Run all apps in parallel
npm run dev

# Or run individually
npm run dev:host
npm run dev:cart       # replace with your remote name
```

| App | URL |
|-----|-----|
| Host | http://localhost:3000 |
| cart | http://localhost:3001 |

---

## What's Inside Each App

### Host App

- **`src/index.js`** — Dynamic import bootstrap (required for Module Federation eager sharing)
- **`src/App.jsx`** — Shell layout with `React.Suspense` and `ErrorBoundary` for each remote
- **`webpack.config.js`** — Pre-configured `ModuleFederationPlugin` with all remotes wired in

### Remote App

- **`src/index.js`** — Dynamic import bootstrap
- **`src/App.jsx`** — The exposed component (customise this!)
- **`webpack.config.js`** — `ModuleFederationPlugin` configured to expose the component via `remoteEntry.js`

---

## Adding or Modifying Remotes After Scaffolding

### To add a new remote app

1. Create a new app folder under `apps/`:
   ```bash
   mkdir -p apps/my-new-remote/src apps/my-new-remote/public
   ```

2. Copy/adapt `package.json` and `webpack.config.js` from an existing remote, then update:
   - `name` in `package.json`
   - `name`, `filename`, and `exposes` in the `ModuleFederationPlugin` config
   - `output.publicPath` and `devServer.port`

3. Register it in `apps/host/webpack.config.js`:
   ```js
   new ModuleFederationPlugin({
     remotes: {
       // existing remotes...
       myNewRemote: 'myNewRemote@http://localhost:3002/remoteEntry.js',
     },
   })
   ```

4. Import it in `apps/host/src/App.jsx`:
   ```jsx
   const RemoteComponent = React.lazy(() => import('myNewRemote/App'));
   ```

### To change a remote's URL

Edit `apps/host/webpack.config.js` and update the entry in `remotes`:
```js
remotes: {
  cart: 'cart@https://my-cdn.com/cart/remoteEntry.js',
}
```

### To remove a remote

1. Delete its folder: `rm -rf apps/my-remote`
2. Remove it from `remotes` in `apps/host/webpack.config.js`
3. Remove its import in `apps/host/src/App.jsx`
4. Remove it from `workspaces` in the root `package.json`

---

## How Module Federation Works

```
  Browser
    │
    ▼
 ┌──────────┐        ┌─────────────────────┐
 │   Host   │───────▶│  cart@localhost:3001 │
 │ :3000    │        │   remoteEntry.js     │
 └──────────┘        └─────────────────────┘
```

1. The **host** loads its own bundle from `localhost:3000`
2. At runtime, it fetches `remoteEntry.js` from each remote URL
3. React components are loaded lazily via `React.Suspense`
4. `react` and `react-dom` are marked as **singletons** — only one instance runs across all apps
5. If a remote fails to load, the **ErrorBoundary** catches it gracefully

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | ^18.2 | UI framework |
| Webpack | ^5.89 | Bundler + Module Federation |
| webpack-dev-server | ^4.15 | Dev server with HMR |
| Babel | ^7.23 | JSX transpilation |

---

## CLI Options

```bash
npx create-react-mf-starter [project-name] [options]

Arguments:
  project-name          Name of the project (optional, prompted if omitted)

Options:
  --host-port <port>    Default port for the host app (default: 3000)
  -V, --version         Show version
  -h, --help            Show help
```

---

## Requirements

- **Node.js** 16 or higher
- **npm** 7 or higher (for workspace support)

---

## Publishing to npm

If you're forking this to publish under your own name:

1. Update `"name"` in `package.json`
2. Ensure `"bin"` points to `bin/create.js`
3. Make sure `bin/create.js` has the shebang: `#!/usr/bin/env node`
4. Run:
   ```bash
   npm publish --access public
   ```

Your CLI will then be available as:
```bash
npx your-package-name
```

---

## License

MIT © [primakurniawan](https://github.com/primakurniawan)
