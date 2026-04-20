# `src/` module layout

This project organizes `src/` by **purpose** (domain or feature), not by file type. The Vue `create-vue` default of `lib/`, `stores/`, and `views/` is replaced with modules such as `app/`, `save-file/`, and `settings/`.

See [ADR-005](adr/005-module-style-src-layout.md) for rationale and trade-offs.

## Principle

- **Directory name** = what the code is for (domain or feature).
- **File suffix** = what kind of code it is (constants, pure logic, store, composable, test, view).
- **Inventory** — The repository lists actual paths; this doc explains naming and domains, not a tree.

## File suffixes

| Suffix           | Meaning
| ---              | ---
| `.component.vue` | Non-route Vue component (PascalCase), e.g. shared UI building blocks.
| `.compose.js`    | Vue composables: `ref`/`computed`/lifecycle; exports use `use*` names.
| `.const.js`      | Frozen data: maps, string constants, `APP_*` exports.
| `.store.js`      | Pinia stores (global reactive state).
| `.test.js`       | Vitest tests.
| `.util.js`       | Pure functions: no Vue, no side effects.
| `View.vue`       | Route-level view (PascalCase, like Vue’s component convention).

**Future (not adopted):** a `{domain}.view.vue` pattern (aligned with other dot-suffix files) may replace `View.vue` for route components—deferred until a project-wide rename.

**Composable files:** Filenames are `{domain}.compose.js`, not `use-feature.js`, so one file can export several `use*` functions and stay aligned with the suffix pattern. Call sites still use `useSomething()` per Vue convention.

## Module categories

- **`app/`** – Shell: root `App.vue`, env store, 404 view, `app.const.js` (PWA + copy).
- **`save-file/`** – Parse upload, Pinia tree, helpers that read `.sfs`/`GAME` trees, and `SaveFileExplorerView.vue` (nested `/save-explorer` routes).
- **`shared/`** – Cross-feature UI and utilities (e.g. generic `FileUpload.component.vue`, `TableFilter.component.vue`, `table-filter.*`).
- **`settings/`** – Settings route and future UI.
- **`ksp/`** – pure KSP helpers: body names from `ORBIT.REF` (`body.util.js`), stock body ordering for reports (`body-rank.const.js`), kerbal roster parsing (`kerbal.util.js`), and related utilities.
- **`crew-manifest/`** – crew table and markdown export from a loaded save.
- **`science-report/`** – science subject report (R&D vs onboard data), grouped tables, and filters from a loaded save.
- **Root** – `main.js`, `router.js`, `style.css` only wiring and global styles.

## When to add a module

- New feature with its own route and UI → new folder (e.g. `crew-manifest/`).
- Shared domain used by multiple features → new top-level module (e.g. `ksp/`).
- Small one-off helper → colocate in the module that owns it; avoid a global `utils/` folder.
