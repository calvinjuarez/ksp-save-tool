# ADR-002: Centralized App Metadata

## Status

Accepted

## See also

- [ADR-001](001-service-worker-offline.md) – Service worker precaches the generated manifest and app shell.
- [ADR-003](003-icon-pipeline.md) – Icon paths and manifest icon entries are wired from the same module.

## Context

App identity (name, colors, description, icon paths) was duplicated across `index.html`, `public/manifest.webmanifest`, and `src/router.js`. Changes required editing multiple files in sync.

## Decision

1. **`src/app.meta.js`** – flat `APP_*` constant exports as the single source for app identity.
2. **Generated manifest** – `vite-plugin-pwa` `manifest: { ... }` built from those exports; static `public/manifest.webmanifest` removed.
3. **`index.html`** uses `%APP_*%` placeholders resolved by a custom Vite `transformIndexHtml` plugin (`app-html-meta`) that runs before the PWA plugin.
4. **Router** imports `APP_NAME` for the document title suffix.

## Consequences

**Pros:**

- Single source of truth for identity fields; one file to edit when adjusting app identity.

**Cons:**

- Values are not visible as literals in `index.html` at a glance (placeholders instead).

## Implementation Notes

Key files: [`src/app.meta.js`](../../src/app.meta.js), [`vite.config.js`](../../vite.config.js) (imports + `appHtmlMetaPlugin` + `VitePWA` manifest object), [`index.html`](../../index.html) (tokens), [`src/router.js`](../../src/router.js).
