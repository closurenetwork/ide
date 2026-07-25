# Closure way — brand & design system

Experiences do **not** own brand chrome. The Organization owns one `design_system`; shells consume projected CSS variables.

## Graph (CIP-S-0003)

```
design_token_set[]  (color | typography | spacing | radii | shadow)
        ↓
design_theme[]      (light + dark + semantic role overrides)
        ↓
design_system       (brand, voice, kitId, assets, preferred layouts)
        ↓
design_spec         (kit + componentStyles contracts)
        ↓
Experience.theme.designSystemId (+ themeMode, kitId, layoutId)
        ↓
Runtime projection → --cp-* (+ data-theme) → generic console/marketing shells
```

## Rules

1. **One brand per Organization** — Settings → Branding (or `brand.upsert` / org brand API). Experiences inherit `designSystemId`; do not invent per-page palettes.
2. **No product hex in React/CSS** — components and shells read `var(--cp-*)`. Accent is the free colorimetric choice; kits derive surfaces.
3. **No Experience TypeScript as brand SoT** — pack/graph + org design objects only.
4. **Kits** (`signal-heat`, `editorial-serif`, `clinical-clean`, …) set type/density/radius/`componentStyles`. Pick a kit; do not fork shell CSS per product.
5. **Prove control** — changing `accentPrimary` / `fontBody` / spacing tokens must change first paint without editing CSS files.
6. **Never** add `is{Product}Experience` chrome branches or `--exp-{product}-*` namespaces.

## IDE / agent loop

- Scaffold / bind brand via Platform MCP or Studio Branding; confirm `/account/branding` shows token → `--cp-*` projection.
- Marketing + console of the same org share the org design system.
- After brand save, Experiences without `designSystemId` are bound automatically.
- Knowledge skill: `ks_closure_brand_system` (pull via `platform_knowledge_skills_pull`).

## Anti-patterns

| Wrong | Right |
|-------|--------|
| Hardcode `#FF4D1A` in a component | `var(--cp-accent)` |
| `gtmsignal.css` product chrome | `experience-console.css` + org tokens |
| Parallel `*-experience.ts` palette | Org `design_system` + pack UI graph |
| Brand page as accent-only form | Tokens visible + Experiences inherit |
