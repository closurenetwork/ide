# @closure-platform/ide

Closure for your IDE. Install from npm — **never clone this repo.**

## Install

```bash
npx @closure-platform/ide init
```

Then:

1. Put your Closure credentials in `.cursor/mcp.json` (the command writes the stub)
2. Reload MCP in Cursor / Claude Code
3. Call `platform_status`

That’s it.

## Credentials

In the `closure-platform` MCP entry:

| Env | Value |
|-----|--------|
| `STUDIO_URL` | `https://closureapps.com/console` (or your private console) |
| `STUDIO_EMAIL` | your Closure email |
| `STUDIO_PASSWORD` | your password *(API keys coming)* |

## Later

```bash
npx @closure-platform/ide update   # refresh rails
npx @closure-platform/ide doctor   # sanity check
```

## What you get

- **MCP** — `platform_*` tools against Closure
- **Rails** — Cursor rules/skills, Claude skills, `AGENTS.md`

Product lives on Closure. Your IDE is the agent host.

## License

Apache-2.0
