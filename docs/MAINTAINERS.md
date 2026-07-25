# Maintainers

Customers use `npx @closure-platform/ide` only. This file is for people who publish the package.

## Publish

```bash
npm run build
npm test
npm publish --access public
```

`prepublishOnly` builds the MCP bundle into `mcp/dist/`.

## Local dogfood (optional)

```bash
CLOSURE_IDE_LOCAL=1 node bin/closure-ide.mjs init --cwd /path/to/project
```

Without `CLOSURE_IDE_LOCAL=1`, `init` always writes an `npx` MCP entry (customer path).
