# ADR-003: Icon Pipeline and Drift Detection

## Status

Accepted

## See also

- [ADR-002](002-centralized-app-meta.md) – `APP_ICON_PATH`, `APP_APPLE_TOUCH_ICON_PATH`, and `APP_MANIFEST_ICONS` reference outputs under `public/app/`.

## Context

The app needs raster PNGs (192, 512, Apple 180) derived from the SVG icon for platforms that require them. Generating on every `vite build` would make sharp a build-time dependency and slow CI. The experimental `vite-plugin-pwa` `pwaAssets` integration was rejected.

## Decision

1. **Source SVG** lives at repo root (`icon.svg`), outside `public/`.
2. **`scripts/rasterize-app-icon.mjs`** (sharp) copies SVG to `public/app/`, rasterizes PNGs, writes a SHA-256 fingerprint (`public/app/icon.svg.sha256`). Run manually via `npm run icons`.
3. **Generated assets are committed** – no `prebuild`; `vite build` does not run sharp.
4. **`scripts/verify-app-icon.mjs`** compares the fingerprint to the current `icon.svg`; wired into `npm run test:run` so CI fails on drift.

## Consequences

**Pros:**

- Builds stay fast (no sharp on every build), CI catches forgotten regeneration, clear source/output separation.

**Cons:**

- Manual `npm run icons` step after SVG edits, committed binary PNGs in the repo.

## Implementation Notes

Key files: [`icon.svg`](../../icon.svg) (repo root), [`scripts/rasterize-app-icon.mjs`](../../scripts/rasterize-app-icon.mjs), [`scripts/verify-app-icon.mjs`](../../scripts/verify-app-icon.mjs), [`public/app/`](../../public/app/) (outputs), [`package.json`](../../package.json) scripts (`icons`, `verify:icons`, `test:run`). Paths are wired through `APP_ICON_PATH`, `APP_APPLE_TOUCH_ICON_PATH`, and `APP_MANIFEST_ICONS` in [`src/app.meta.js`](../../src/app.meta.js).
