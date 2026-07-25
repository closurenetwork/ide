# IDE kit packaging

## Product unit

`@closure-platform/ide` = MCP + doctrine + host exporters.

## Release checklist

1. Doctrine SoT updated under `doctrine/`
2. `npm run build` (MCP bundle)
3. `node bin/closure-ide.mjs init --cwd /tmp/ide-smoke && node bin/closure-ide.mjs doctor --cwd /tmp/ide-smoke`
4. Publish to npm (`npm publish --access public` when ready)
5. Marketing docs point at `npx @closure-platform/ide init` (no clone)

## Sync from platform monorepo (optional)

```bash
# from platform/
cp packages/mcp-server/src/*.ts ../closure-ide/mcp/src/
cp packages/mcp-server/skills/*.md ../closure-ide/mcp/skills/
cp packages/mcp-server/skills/*.md ../closure-ide/doctrine/
```

Prefer making **this** repo the publish home and treating monorepo `mcp-server` as a thin re-export later.
