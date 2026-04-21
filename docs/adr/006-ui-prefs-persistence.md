# ADR-006: UI preferences persistence (`localStorage` + Pinia plugin)

## Status

Accepted

## See also

- [annotations-persistence.md](../roadmap/annotations-persistence.md) – Broader persistence roadmap (IndexedDB, save identity, annotations).

## Context

Table-heavy features need to remember grouping, sort, and filter state across reloads. The roadmap sketches a small Pinia persistence plugin for this tier, with IndexedDB reserved for heavier data later.

## Decision

1. **Homegrown Pinia plugin** — [`src/app/persist-ui-prefs.plugin.js`](../../src/app/persist-ui-prefs.plugin.js) reads a `persist` option on `defineStore` (setup stores, third argument). It synchronously hydrates from `localStorage`, writes on `$subscribe`, supports optional `validate` / `migrate`, and listens for cross-tab `storage` events. No third-party persistence package.
2. **Per-feature prefs stores** — Naming pattern `{feature}-prefs.store.js` (e.g. [`crew-manifest-prefs.store.js`](../../src/crew-manifest/crew-manifest-prefs.store.js)). State is normal Pinia `ref`s; the plugin persists a declared `paths` slice under one versioned blob per store.
3. **Key namespace** — `ksp-explorer:save:<feature-slug>` (e.g. `ksp-explorer:save:crew-manifest`). The `save` segment scopes the save-file explorer so future tools can use sibling prefixes without collision.

## Consequences

**Pros:**

- Aligns with the roadmap’s `localStorage` tier for small UI prefs.
- Validates and repairs persisted payloads (e.g. drop filters for removed column keys) without corrupting the store.
- Cross-tab sync is centralized in one listener.

**Cons:**

- **Plugin registration quirk:** Pinia queues `pinia.use()` calls until `app.use(pinia)` runs. Tests (and any code path) that create a Pinia instance without installing it on an app will not run plugins until install — see the JSDoc on the plugin module.
- Slightly more boilerplate than a single composable per view, offset by reuse across many tables.

## Implementation Notes

- Hydration assigns `ref.value` on the raw Pinia state object (`toRaw(pinia.state.value[id])`). Pinia’s `$patch` object merge replaces `ref` nodes; the function callback sees a proxy that unwraps refs, so neither mode is used for rehydration.
- IndexedDB, save fingerprinting, and annotations remain out of scope for this ADR.
