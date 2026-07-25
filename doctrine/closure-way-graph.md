# Closure way — semantic graph

You are building on **Closure Platform**. Prefer Platform MCP tools (`platform_*`) over inventing local JSON or editing Experience TypeScript.

## Rules

1. Experiences, pages, components, workflows-as-product are **DataObjects** on the Closure semantic graph — **not** `packages/experiences/src/*-experience.ts` as SoT.
2. Create shells with `platform_experience_scaffold` or `platform_build_start`; mutate via IDE agent loop (`platform_agent_task` / `platform_agent_submit`) or Studio graph APIs.
3. **Forbidden as product path:** hand-editing GTM/marketing/console Experience `.ts` to “add a page” or change copy. That bypasses the live org and regresses on hydrate.
4. Skills live in Knowledge → Skills; Files are corpus; Data is live GraphQL — do not dump Data into RAG.
5. After UI changes, open `/experiences/{slug}` and confirm the **graph**, not only chat text.
6. Never paste secrets, API keys, or PII into chat or MCP tool arguments — call `platform_collect_start`.
7. Prefer **targeted craft** over full `wf-build-experience` rebuilds once an Experience exists.
