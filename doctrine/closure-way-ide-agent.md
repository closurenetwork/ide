# Closure way — IDE as agent host

## Rules

1. Your IDE model does **reasoning**; Closure owns **persistence, validation, audit, vault**.
2. Do not burn Platform LLM keys for authoring when local tools / deterministic platform tools can do the work.
3. Prefer structured upserts / scaffold / craft loops over freeform prose that claims the app was built.
4. L1 `closure.*` MCP (closure-kit) is for gateway JSON-LD apps. Closure Platform MCP uses `platform_*` — do not confuse them.
5. **Product mutations** go through Platform MCP / graph APIs. Editing Experience pack `.ts` is not an IDE product update.
6. When a run is `waiting_ide`, loop `platform_agent_task` → work → `platform_agent_submit` until completed / HITL — do not stop at the pause.
7. Secrets: `platform_collect_start` → user completes Form in browser → you only see sealed handles.
