# Closure way — forms & secrets

## Rules
1. Sensitive collect uses **Platform Forms** (embed / assistant mode) with vault seal.
2. `platform_collect_start` returns a `collectUrl` — tell the user to complete it in the browser.
3. You only receive sealed handles / run status afterward — never ask the user to paste passwords into chat.
4. Field types follow collect schema: boolean → checkbox, enum → select, etc. Do not reinvent Form.io as runtime.
