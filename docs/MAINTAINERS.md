# Maintainers

Customers use `npx @closurenetwork/ide` only. This file is for people who publish the package.

## Publish (npmjs.org — preferred)

`npx` discovery and zero-auth installs require the **public npm registry**, not GitHub Packages.

1. Create / join the npm org **`closure`** (https://www.npmjs.com/org/create).
2. Ensure you can publish: `npm owner ls @closurenetwork/ide` (after first publish) or org membership.
3. From this repo:

```bash
npm run build && npm test
npm publish --access public
```

`prepublishOnly` builds the MCP bundle into `mcp/dist/`.

### Do not use GitHub Packages for this package

GitHub Packages needs `NODE_AUTH_TOKEN` / `.npmrc` scope config for every consumer. That breaks the `npx @closurenetwork/ide init` story. Keep source on GitHub; publish the tarball to `registry.npmjs.org`.

## Dogfood before publish

```bash
# Platform must serve the pack (local or SaaS after Deploy)
curl -s http://localhost:3021/api/public/ide/pack | head

CLOSURE_IDE_PACK_URL=http://localhost:3021/api/public/ide/pack \
  node bin/closure-ide.mjs init --cwd /tmp/closure-ide-smoke --no-mcp

node bin/closure-ide.mjs status --cwd /tmp/closure-ide-smoke
```

Local MCP binary (maintainers):

```bash
CLOSURE_IDE_LOCAL=1 CLOSURE_IDE_PACK_URL=http://localhost:3021/api/public/ide/pack \
  node bin/closure-ide.mjs init --cwd /path/to/project --stdio
```

## Knowledge SoT

Edit IDE rails in **platform** (`apps/studio/src/lib/server/ide-pack.ts` seed → platform org Knowledge `IDE Pack · <path>`). Customers pick up changes with `npx @closurenetwork/ide sync` — no kit bump required unless the CLI itself changes.
