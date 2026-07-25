# Maintainers

Customers use `npx @closure-platform/ide` only. This file is for people who publish the package.

```bash
npm run build && npm test
npm publish --access public
```

`prepublishOnly` builds the MCP bundle into `mcp/dist/`.

Local dogfood of `init` (writes local paths instead of `npx`):

```bash
CLOSURE_IDE_LOCAL=1 node bin/closure-ide.mjs init --cwd /path/to/project
```
