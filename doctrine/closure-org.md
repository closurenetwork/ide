# Closure Organizations (IDE)

Credentials, connectors, Experiences, and runs are scoped to an **Organization** (`orgId`).

1. Call `platform_status` first; note `org` / `orgId`.
2. Before collect/seal/product runs for a customer: pin `orgId` (e.g. `org_gtmsignal`).
3. Echo Organization from `platform_collect_start` — never secrets.
4. Integrations Active is per Organization; Catalog ≠ sealed.
5. Platform connect workflows are shared; seal target is the pinned Organization's vault.
6. User-facing word is **Organization** — not workspace or tenant.
