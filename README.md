# @closurenetwork/ide

Closure Agent Pack for your IDE. Published on **[npmjs.org](https://www.npmjs.com/package/@closurenetwork/ide)** under the `closurenetwork` org — **never clone this repo.**

This package is a **thin installer**. AGENTS.md, Cursor rules, and Closure-way skills are fetched from Closure Platform Knowledge (`GET /api/public/ide/pack`) — not hardcoded here.

## The authoring contract

Your IDE agent doesn't just get tools — it gets a runtime that holds up its half of the loop:

1. **The runtime teaches.** `platform_docs_search` grounds paradigm answers in the docs, the book *The Last Application*, and the whitepaper. `platform_taxonomy` serves the live vocabulary — every schema, component kind, workflow node type, and composition rule, straight from the registries that will execute them.
2. **The runtime checks before you write.** `platform_validate` dry-runs any DataObject, Experience graph, or workflow graph and returns the exact violations.
3. **The runtime gates what ships.** Creativity is welcome; the ship bar is not negotiable. `platform_experience_verify` runs the same server-side craft gates a governed build enforces (design system, taxonomy-pure components, i18n, discoverability, accessibility). Gate keys are server-owned — clients can't mark their own work as passing.
4. **The runtime delegates.** Governed builds (`platform_build_start`) hand creative planning nodes to *your* agent's context on `waiting_ide` — original IA, copy, and brand voice, inside the gates.
5. **The runtime ships.** Dev is the live graph; Test and Prod serve pinned versions. `platform_experiences_health` shows pin state, `platform_experiences_promote` snapshots Dev and pins Test/Prod, and `platform_release_snapshot` / `platform_release_promote` cut org-wide releases — with the same role, policy, and quality-gate checks the console enforces.
6. **The runtime learns.** Anonymous friction telemetry (failed calls, unanswered docs searches, gate failures — never prompts, code, or identity) auto-opens platform Issues with recommended fixes. Opt out with `CLOSURE_TELEMETRY=0`.

Full docs: [closureapps.com/docs/ide](https://closureapps.com/docs/ide).

## Install

```bash
npx @closurenetwork/ide init
```

Then reload MCP → **Connect** → call `platform_status` → `platform_knowledge_skills_pull`.

### On-prem / local Studio

```bash
STUDIO_URL=http://localhost:3021 npx @closurenetwork/ide init
# or
CLOSURE_IDE_PACK_URL=http://localhost:3021/api/public/ide/pack npx @closurenetwork/ide init
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
    "closure": {
      "url": "https://mcp.closureapps.com",
      "type": "http"
    }
  }
}
```

### Fallback — stdio + API key

The stdio shim exposes the core authoring subset (status, scaffold, craft, collect, build, workflows, agent task/submit). The full authoring contract above — grounding, taxonomy, validation, verification, promotion, feedback — is served by the hosted HTTP MCP; prefer Connect.

```bash
npx @closurenetwork/ide init --stdio
```

```json
{
  "mcpServers": {
    "closure": {
      "command": "npx",
      "args": ["-y", "@closurenetwork/ide", "mcp-stdio"],
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
