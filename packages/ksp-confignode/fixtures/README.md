# Parser fixtures

## Committed save (`*.sfs.gz`)

The repo includes **one full career save** (gzip-compressed) so integration tests run in CI without a multi‑megabyte plain-text blob:

- **`20260407-4-move-the-rover.sfs.gz`** — KSP 1.12.5 career save; ~24 MiB uncompressed, ~1.6 MiB gzip level 9.

`parse.fixture.test.js` **gunzips** this file and runs `parse()` on the result.

Uncompressed `*.sfs` in this directory are **gitignored** so large exports are not committed by mistake.
