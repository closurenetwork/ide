# @closure-platform/ide

Closure for your IDE. Install from npm — **never clone this repo.**

This package is a **thin shell**. Skills and Closure-way playbooks live on Closure Platform (Knowledge) and refresh via MCP — not by bumping this package every week.

## Install

```bash
npx @closure-platform/ide init
```

## Auth — prefer Connect

Same shape as Figma’s blue **Connect** button: remote MCP + OAuth.

```json
{
  "mcpServers": {
    "closure-platform": {
      "url": "https://closureapps.com/console/api/mcp"
    }
  }
}
```

Local dogfood: `"url": "http://localhost:3021/api/mcp"`.

1. Reload MCP → Cursor shows **Connect**  
2. Browser opens Studio consent → Allow  
3. `platform_status` — pulls skills when stale  

### Fallback — stdio + API key

Studio → **Account → IDE** → Generate key (`csk_…`), then:

```json
{
  "mcpServers": {
    "closure-platform": {
      "command": "npx",
      "args": ["-y", "@closure-platform/ide", "mcp-stdio"],
      "env": {
        "STUDIO_URL": "https://closureapps.com/console",
        "STUDIO_API_KEY": "csk_…"
      }
    }
  }
}
```

## Rails

| Layer | Source of truth |
|-------|-----------------|
| Skills / Closure-way | Platform Knowledge via MCP |
| Kit doctrine files | Bootstrap only — `npx … update` + pull |
| Product graph | Closure APIs |
| Brand | Org `design_system` → `--cp-*` |

```bash
npx @closure-platform/ide update
npx @closure-platform/ide doctor
```

## Related

| Repo | Role |
|------|------|
| [platform](https://github.com/closurenetwork/platform) | Product (Studio, Experiences, MCP) |
| [deploy](https://github.com/closurenetwork/deploy) | Self-host Helm / Terraform |
| [versions](https://github.com/closurenetwork/versions) | Optional promote-mirror template |

## License

Apache-2.0
