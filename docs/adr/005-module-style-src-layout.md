# ADR-005: Module-style `src/` layout

## Status

Accepted

## Context

The project started with content-type directories (`lib/`, `stores/`, `views/`) typical of `create-vue` scaffolding. As features grow (crew manifest, contracts, vessel browser), that layout groups unrelated code by file type and scatters a single feature across folders. Cross-cutting helpers need a home without a generic `utils/` junk drawer.

## Decision

1. **Purpose-based modules** – Each directory under `src/` (except `main.js`, `router.js`, `style.css` at the root) represents a domain or feature: `app/` (shell, infra, non-feature pages), `save-file/` (upload + reading `.sfs` trees), `settings/`, etc. Shared game reference data will live in `ksp/` when added.
2. **File suffixes encode type** – `.const.js` (frozen data), `.util.js` (pure functions, no Vue), `.store.js` (Pinia), `.compose.js` (Vue composables), `.test.js`, and `View.vue` for route-level components. Directory name = domain; suffix = kind of code.
3. **Composable filenames** – Vue’s community pattern of naming composable files `use-*.js` is **not** used for filenames. Composable files use `{domain}.compose.js` so multiple `use*` exports can live in one file and filenames stay consistent with the suffix system. Individual functions still use `use*` names at the export/call site.
4. **App constants** – Centralized app identity (`APP_*`) lives at [`src/app/app.const.js`](../../src/app/app.const.js) (renamed from `src/app.meta.js`).

## Consequences

**Pros:**

- Removing a feature removes one folder; imports show domain dependencies.
- No ambiguous `lib/` or `utils/` catch-alls.
- Suffixes make file type obvious in search and file trees.

**Cons:**

- Deviates from common Vue scaffolding (`views/`, `stores/`, `composables/` at top level).
- Composable filenames differ from widespread `use-*` file naming; contributors must read [docs/src-modules.md](../src-modules.md).

## Implementation Notes

- Full layout and rules: [docs/src-modules.md](../src-modules.md).
