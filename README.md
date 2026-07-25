# @closure/ide

Closure Agent Pack for your IDE. Install from npm — **never clone this repo.**

This package is a **thin installer**. AGENTS.md, Cursor rules, and Closure-way skills are fetched from Closure Platform Knowledge (`GET /api/public/ide/pack`) — not hardcoded here.

## Install

```bash
npx @closure/ide init
```

Then reload MCP → **Connect** → call `platform_status` → `platform_knowledge_skills_pull`.

### On-prem / local Studio

```bash
STUDIO_URL=http://localhost:3021 npx @closure/ide init
# or
CLOSURE_IDE_PACK_URL=http://localhost:3021/api/public/ide/pack npx @closure/ide init
```

## Commands

| Command | Purpose |
|---------|---------|
| `init` | Fetch pack, write rails, register MCP |
| `sync` | Re-fetch pack (Knowledge updates) |
| `status` | Local + remote pack health |
| `doctor` / `update` | Aliases of `status` / `sync` |

## Auth — prefer Connect

```json
{
  "mcpServers": {
    "closure-platform": {
      "url": "https://closureapps.com/console/api/mcp",
      "type": "http"
    }
  }
}
```

### Fallback — stdio + API key

```bash
npx @closure/ide init --stdio
```

```json
{
  "mcpServers": {
    "closure-platform": {
      "command": "npx",
      "args": ["-y", "@closure/ide", "mcp-stdio"],
      "env": {
        "STUDIO_URL": "https://closureapps.com/console",
        "STUDIO_API_KEY": "csk_…"
      }
    }
  }
}
```

## What gets written

| Path | Role |
|------|------|
| `.closure/pack.json` | Pack version for `sync` |
| `AGENTS.md` / `CLAUDE.md` | Always-on Closure constitution |
| `.cursor/rules/` · `.cursor/skills/` | Cursor rails |
| `.claude/skills/` | Claude Code rails |
| `.github/copilot-instructions.md` | Short Copilot extract |
| `.cursor/mcp.json` | Platform MCP registration |

Product Experiences stay on the **graph**. Local files are adapters only.

## Related

| Repo | Role |
|------|------|
| [platform](https://github.com/closurenetwork/platform) | Studio, Knowledge, MCP, `/api/public/ide/pack` |
| [deploy](https://github.com/closurenetwork/deploy) | Self-host |

## License

Apache-2.0
