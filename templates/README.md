# Module Federation Templates (demo)

This folder contains minimal host and remote Vite templates to demonstrate Module Federation.

What is included
- Remote exposes:
  - `./Button` -> a simple button component
  - `./Modal` -> a modal component
- Host:
  - consumes `remote/Button` and `remote/Modal` via Module Federation
  - includes local `HostButton` and `HostModal` for comparison

How to try the demo
1. Generate projects from the `templates/host` and `templates/remote` folders (or copy them into your apps).
2. Install dependencies in each project (`npm install` or yarn/pnpm).
3. Start the remote on port 3001 and the host on port 3000.

Example (in each generated app):

```bash
# in remote project
npm install
npm run dev # starts on port 3001

# in host project
npm install
npm run dev # starts on port 3000
```

Notes
- The host uses `mf.config.json` (see `test-module-federation/mf.config.json`) to locate remotes.
- Host lazy-loads federated modules with `React.lazy` and `Suspense`.
