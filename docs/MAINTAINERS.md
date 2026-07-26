# Maintainers

Customers use `npx @closurenetwork/ide` only. This file is for people who publish the package.

## npm strategy

| | |
|--|--|
| **Package** | [`@closurenetwork/ide`](https://www.npmjs.com/package/@closurenetwork/ide) |
| **Registry** | **npmjs.org** (public) — required for zero-auth `npx` |
| **Org / scope** | npm org **`closurenetwork`** (matches GitHub). `@closure/*` is unavailable (unscoped `closure` package already taken). |
| **Not used** | GitHub Packages — forces consumer auth / `.npmrc` and breaks `npx` |
| **Source** | This repo — never tell customers to clone it |

## Publish

You must be a member of the `closurenetwork` npm org (`npm whoami` → your user; `npm org ls closurenetwork`).

```bash
npm run build && npm test
npm publish --access public
```

`prepublishOnly` builds the MCP bundle into `mcp/dist/`. Bump `package.json` version before each publish.

## Dogfood before publish

```bash
# Pack API (local Studio or SaaS after Deploy)
curl -s https://closureapps.com/console/api/public/ide/pack | head
# or: curl -s http://localhost:3021/api/public/ide/pack | head

npx @closurenetwork/ide@latest init --cwd /tmp/closure-ide-smoke
npx @closurenetwork/ide@latest status --cwd /tmp/closure-ide-smoke
```

Local MCP binary (maintainers):

```bash
CLOSURE_IDE_LOCAL=1 STUDIO_URL=http://localhost:3021 \
  node bin/closure-ide.mjs init --cwd /path/to/project --stdio
```

## Knowledge SoT

Edit IDE rails in **platform** (`apps/studio/src/lib/server/ide-pack.ts` → platform org Knowledge `IDE Pack · <path>`). Customers pick up doctrine changes with `npx @closurenetwork/ide sync` — bump this kit only when the CLI / MCP shell changes.
