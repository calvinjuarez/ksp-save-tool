# cj-vite-vue-pwa-template

Personal starter for Vue 3 SPAs: **Vite**, **Pinia**, **Vue Router**, **Bootstrap Reboot** + shared **house** CSS tokens, **PWA** (offline shell), **Vitest**, and optional **GitHub Pages** deploy via Actions.

## Use this template

1. On GitHub: enable **Settings → General → Template repository** on the upstream repo (once), then **Use this template** to create your own repo.
2. Clone your new repo and run the commands below.
3. Complete **[After you create a repo](#after-you-create-a-repo-from-this-template)** so names and URLs match your project.

## Requirements

- Node.js matching [`.nvmrc`](.nvmrc) (e.g. `nvm use` / `fnm use`).

## Commands

```bash
npm ci
npm run dev
npm run test:run
npm run build
npm run preview   # optional: serve dist locally
```

## Environment / `VITE_BASE_PATH`

This template only uses **public** `VITE_*` variables (embedded in the client). **Do not put secrets** in any committed env file.

**Checked-in split:** [`.env.development`](.env.development) is loaded for `npm run dev`; [`.env.production`](.env.production) for `npm run build` (local production-style builds). They differ only in how `VITE_BASE_PATH` is set for each mode—open those files to see the values.

| File | Role |
|------|------|
| [`.env.development`](.env.development) | Dev server / `vite` in development mode. **Checked in.** |
| [`.env.production`](.env.production) | `vite build` when you run it locally. **Checked in.** |
| `.env.local` | Optional gitignored overrides for either mode (same keys); use for machine-specific paths without editing committed files (see [.gitignore](.gitignore)). |

The [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) build sets `VITE_BASE_PATH` to `/${{ github.event.repository.name }}/`, so **deploys stay correct** even if `.env.production` in git is stale after a rename—update `.env.production` anyway so local `npm run build` matches production.

## GitHub Pages

1. **Settings → Pages → Build and deployment → Source:** **GitHub Actions**.
2. Push to `main`; the **Deploy to GitHub Pages** workflow publishes `dist/`.

Project sites are served at `https://<user>.github.io/<repo>/`; the app and service worker expect a **trailing-slash** subpath in `VITE_BASE_PATH` for that layout.

## After you create a repo from this template

- [ ] Set [`package.json`](package.json) `repository.url` to your repo’s full Git URL (or remove the field)—don’t assume a one-segment find/replace; the host, user/org, and repo name may all differ.
- [ ] Set `VITE_BASE_PATH` in [`.env.production`](.env.production) to `/your-new-repo-name/` (trailing slash).
- [ ] Search/replace user-facing strings: [`index.html`](index.html), [`public/manifest.webmanifest`](public/manifest.webmanifest), [`src/router.js`](src/router.js), [`src/views/HomeView.vue`](src/views/HomeView.vue).
- [ ] Optional: replace [`LICENSE`](LICENSE) copyright line with your legal name if you fork publicly.
- [ ] Finally, rewrite [`README.md`](README.md) for your project.

## Docs

Rules and conventions for AI coding agent: [AGENTS.md](AGENTS.md). Design guides, ADR process, and related documentation for all contributors—ai or human: [docs/README.md](docs/README.md).

## License

[MIT](LICENSE)
