# `src/` module layout

This project organizes `src/` by **purpose** (domain or feature), not by file type. The Vue `create-vue` default of `lib/`, `stores/`, and `views/` is replaced with modules such as `app/`, `save-file/`, and `settings/`.

See [ADR-005](adr/005-module-style-src-layout.md) for rationale and trade-offs.

## Principle

- **Directory name** = what the code is for (domain or feature).
- **File suffix** = what kind of code it is (constants, pure logic, store, composable, test, view).
- **Inventory** — The repository lists actual paths; this doc explains naming and domains, not a tree.

## File suffixes

| Suffix        | Meaning
| ---           | ---
| `.const.js`   | Frozen data: maps, string constants, `APP_*` exports.
| `.util.js`    | Pure functions: no Vue, no side effects.
| `.store.js`   | Pinia stores (global reactive state).
| `.compose.js` | Vue composables: `ref`/`computed`/lifecycle; exports use `use*` names.
| `.test.js`    | Vitest tests.
| `View.vue`    | Route-level view (PascalCase, like Vue’s component convention).

**Composable files:** Filenames are `{domain}.compose.js`, not `use-feature.js`, so one file can export several `use*` functions and stay aligned with the suffix pattern. Call sites still use `useSomething()` per Vue convention.

## Module categories

- **`app/`** – Shell: root `App.vue`, env store, home and 404 views, `app.const.js` (PWA + copy).
- **`save-file/`** – Parse upload, Pinia tree, helpers that read `.sfs`/`GAME` trees.
- **`settings/`** – Settings route and future UI.
- **`ksp/`** – pure KSP helpers: body names from `ORBIT.REF` (`body.util.js`), kerbal roster parsing (`kerbal.util.js`), and related utilities.
- **`crew-manifest/`** – crew table and markdown export from a loaded save.
- **Root** – `main.js`, `router.js`, `style.css` only wiring and global styles.

## When to add a module

- New feature with its own route and UI → new folder (e.g. `crew-manifest/`).
- Shared domain used by multiple features → new top-level module (e.g. `ksp/`).
- Small one-off helper → colocate in the module that owns it; avoid a global `utils/` folder.
