# Closure Platform (IDE)

You are building on **Closure SaaS** via Platform MCP (`platform_*` tools).

- Product Experiences / pages / components are **DataObjects** on the graph — not hand-edited Experience TypeScript.
- Use `platform_build_start` + `platform_agent_task` / `platform_agent_submit` for governed builds; prefer targeted craft over full rebuilds.
- Secrets: `platform_collect_start` only — never paste API keys or passwords into chat.
- After UI changes, open `/experiences/{slug}` on Closure and verify the graph.
- Brand = Organization `design_system` → `--cp-*` CSS variables (CIP-S-0003). Never hardcode product hex or `is{Product}` chrome branches. See Closure-way brand skill / `ks_closure_brand_system`.
- L1 `closure.*` (closure-kit) is a different MCP server — do not confuse it with `platform_*`.
