## Closure Platform IDE

Use **Closure Platform MCP** tools (`platform_*`). Your job is reasoning; Closure owns persistence, audit, and vault.

Hard rails:
1. Do not treat pack `*-experience.ts` as product SoT — mutate DataObjects via MCP / graph.
2. Never collect secrets in chat — `platform_collect_start`.
3. On `waiting_ide`, loop task → work → submit until the run completes.
4. Confirm changes in the Closure Experience URL, not only in chat.
5. Brand = Organization `design_system` → `--cp-*` (CIP-S-0003). No product hex / `is{Product}` chrome. See Closure-way brand skill.
