# ADR-001: Service Worker for Offline Support

## Status

Accepted

## See also

Optional: when we add client-side persistence (e.g. IndexedDB or localStorage) for app data or preferences, document it in a new ADR; the service worker will still complement that by precaching the app shell.

## Context

This app is a static SPA with no required backend. Without a service worker, offline visits fail: the initial HTML request errors, lazy-loaded route chunks are missing, and refreshing a deep link shows a connection error. Users who already opened the site once should still get the app shell when offline.

## Decision

Add a service worker that precaches build artifacts. Use `vite-plugin-pwa` with Workbox’s `generateSW` strategy. The service worker:

- Precaches the app shell (HTML, JS, CSS, manifest, icons) at install time
- Serves cached content when the network is unavailable
- Uses a navigation fallback so SPA routes work offline (e.g. refresh on `/settings` serves the app shell)

We keep the PWA manifest in `public/`; the plugin registers the service worker and generates the precache list.

## Consequences

**Pros:**

- Full offline capability for the UI after one online visit
- No server required for hosting
- Updates apply on the next visit (`registerType: 'autoUpdate'` in Vite config)
- Works with GitHub Pages and subpath deployment via `VITE_BASE_PATH`

**Cons:**

- Extra build complexity
- Users must visit once online before offline works
- Heavier cache customization needs the `injectManifest` strategy instead of `generateSW`

## Implementation Notes

Configured in [`vite.config.js`](../../vite.config.js): `VitePWA` with `manifest: false` (static manifest file), Workbox `navigateFallback` derived from `VITE_BASE_PATH`, and `registerType: 'autoUpdate'`.
