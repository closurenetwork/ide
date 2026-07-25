# @closure-platform/ide

**Closure doesn’t replace your IDE. It gives your IDE a product model.**

One package for:

1. **MCP control plane** — `platform_*` tools against Closure SaaS (or private `STUDIO_URL`)
2. **Doctrine rails** — Closure-way skills + product-graph rules (Cursor / Claude / `AGENTS.md`)
3. **CLI** — `init` · `update` · `export` · `doctor`

Customers should **not** need to clone the Closure Platform monorepo.

## Quick start

```bash
# from this repo (pre-npm) or after publish:
npm install
npm run build
npx closure-ide init
```

Then reload MCP in Cursor / Claude Code and call `platform_status`.

### Published (target)

```bash
npx @closure-platform/ide init
```

## Commands

| Command | Purpose |
|---------|---------|
| `init` | Project doctrine + merge `.cursor/mcp.json` |
| `update` | Refresh doctrine from package SoT |
| `export` | Host adapters only (`--hosts cursor,claude,agents`) |
| `doctor` | Binary, doctrine, optional Studio login check |
| `mcp` / `mcp-stdio` | Help / run Platform MCP on stdio |

```bash
npx closure-ide init --global-mcp          # also write ~/.cursor/mcp.json
npx closure-ide init --hosts cursor        # Cursor only
npx closure-ide update
npx closure-ide doctor
```

## Doctrine SoT

Edit files under [`doctrine/`](./doctrine/) only. `export` / `init` / `update` project them to:

| Host | Paths |
|------|--------|
| Cursor | `.cursor/rules/closure-*.mdc`, `.cursor/skills/closure-platform/` |
| Claude Code | `.claude/skills/closure-platform/`, managed section in `CLAUDE.md` |
| Generic agents | managed section in `AGENTS.md` |

## MCP env

| Var | Meaning |
|-----|---------|
| `STUDIO_URL` | Console origin (default `https://closureapps.com/console`) |
| `STUDIO_EMAIL` / `STUDIO_PASSWORD` | Spike session auth |
| `CLOSURE_API_KEY` | Preferred when Platform keys land |

## Layout

```
closure-ide/
  bin/closure-ide.mjs     # CLI
  doctrine/               # SoT for rails
  templates/              # AGENTS / CLAUDE snippets
  mcp/                    # Platform MCP server (stdio)
  src/                    # init / export / doctor
```

## Relationship to Closure Platform

| Repo | Role |
|------|------|
| **closurenetwork/platform** (monorepo) | Closure product + Studio |
| **this repo** | Customer IDE kit (MCP + rails) |

MCP sources may be synced from `platform/packages/mcp-server` until this package is the publish home.

## License

Apache-2.0
