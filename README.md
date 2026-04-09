# KSP Save Tool

**KSP Save File Explorer** is a web app for reading **Kerbal Space Program** save data locally in the browser. The first goal is to turn an uploaded save (for example `persistent.sfs`) into a **crew manifest** report: each Kerbal’s role, vessel, flight situation, body, suit, and quick status markers (rescues, tourists, and similar). A concise **active contracts** table for passenger runs and related missions is a natural follow-up.

The stack is **Vue 3**, **Vite**, **Pinia**, **Vue Router**, **Bootstrap Reboot** with shared **house** CSS tokens, **PWA** (offline shell), **Vitest**, and optional **GitHub Pages** deploy via Actions. Uploading an `.sfs` file parses it in the browser and shows a short summary on Home; open **Crew manifest** for a full table and markdown export (tourist markers; rescue markers are not implemented yet).

How `src/` is organized (modules and file suffixes): [docs/src-modules.md](docs/src-modules.md). Rationale: [ADR-005](docs/adr/005-module-style-src-layout.md).

## Requirements

- **Node.js** LTS **Krypton** (see [`.nvmrc`](.nvmrc): `lts/krypton`; for example `nvm use` / `fnm use`). Minimum version is under `engines` in [package.json](package.json).

## Commands

Use **`npm ci`** when [`package-lock.json`](package-lock.json) is committed (same as [CI](.github/workflows/ci.yml)).

```bash
npm ci
npm run dev
npm run test:run
npm run build
npm run preview   # optional: serve dist locally
```

## Environment / `VITE_BASE_PATH`

This project only uses **public** `VITE_*` variables (embedded in the client). **Do not put secrets** in any committed env file.

**Checked-in split:** [`.env.development`](.env.development) is loaded for `npm run dev`; [`.env.production`](.env.production) for `npm run build` (local production-style builds). They differ only in how `VITE_BASE_PATH` is set for each mode.

| File                                   | Role                                                                                                                                                      
| ---                                    | ---                                                                                                                                                       
| [`.env.development`](.env.development) | Dev server / `vite` in development mode. **Checked in.**                                                                                                  
| [`.env.production`](.env.production)   | `vite build` when you run it locally. **Checked in.**                                                                                                     
| `.env.local`                           | Optional gitignored overrides for either mode (same keys); use for machine-specific paths without editing committed files (see [.gitignore](.gitignore)). 

The [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) build sets `VITE_BASE_PATH` to `/${{ github.event.repository.name }}/`, so **deploys stay correct** even if `.env.production` in git is stale after a rename—update `.env.production` anyway so local `npm run build` matches production.

## GitHub Pages

1. **Settings → Pages → Build and deployment → Source:** **GitHub Actions**.
2. Push to `main`; the **Deploy to GitHub Pages** workflow publishes `dist/`.

Project sites are served at `https://<user>.github.io/<repo>/`; the app and service worker expect a **trailing-slash** subpath in `VITE_BASE_PATH` for that layout.

## Local setup (contributors)

- **Identity and lockfile.** In [`package.json`](package.json), keep **`name`**, **`description`**, and **`repository.url`** aligned with this repo. After changing dependencies, refresh the lockfile if needed:

	```bash
	rm -rf node_modules package-lock.json
	npm install
	```

	Commit **`package.json`** and **`package-lock.json`**, then use **`npm ci`** for day-to-day installs.

- Set **`VITE_BASE_PATH`** in [`.env.production`](.env.production) to `/<repo-name>/` (with a trailing slash) when the GitHub repo name does not match the checked-in default.
- User-facing labels and PWA fields are centralized in [`src/app/app.const.js`](src/app/app.const.js) (used for the generated manifest, [`index.html`](index.html) placeholders, [`src/router.js`](src/router.js), and [`src/app/HomeView.vue`](src/app/HomeView.vue)). The canonical vector icon is [`icon.svg`](icon.svg) at the repo root; after editing it, run [`npm run icons`](package.json) and commit `public/app/` (copied SVG, PNGs, and `icon.svg.sha256`). [`npm run test:run`](package.json) runs [`verify:icons`](package.json) so CI fails if the SVG drifted from the last generated assets.

## Docs

Rules and conventions for AI coding agents: [AGENTS.md](AGENTS.md). Design guides, ADR process, and documentation index: [docs/README.md](docs/README.md).

## License

`UNLICENSED` — no license is granted for use, modification, or distribution.
