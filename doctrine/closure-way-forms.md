# Closure way — forms & secrets

1. Never put password/token fields in the chat stream.
2. Pin the target **Organization** first (`orgId` / `platform_status`). See `closure-org.md`.
3. `platform_collect_start` → show `collectUrl` and Organization (`orgName` + `orgId`).
4. After finish: `platform_collect_wait` / `platform_connector_status` — sealed handles only.
5. User-facing product name is **Closure**. Tenant containers are **Organizations**.
