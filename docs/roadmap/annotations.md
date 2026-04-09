# Annotations (planned)

## Goal

Let users attach **metadata that does not exist in the save file**, such as which vessel was launched for which contract. Persist that data in the browser, export/import it as JSON, and keep the data model compatible with future **ConfigNode** embedding (e.g. via a KSP `ScenarioModule` or a companion mod).

## Scope (when implemented)

- **IndexedDB** – store annotation records keyed by save identity (e.g. game title + seed), not the full `.sfs` text.
- **Pinia store** – reactive annotations with CRUD actions.
- **JSON export/import** – versioned file format for backup and moving between browsers/devices; merge strategy on import (e.g. skip duplicates by composite key).
- **UI** – link vessels to contracts; optional notes/tags.

## Non-goals (for this feature)

- Replacing or auto-editing the user’s `persistent.sfs` on disk from the web app (possible later via `serialize()` in `ksp-confignode`; see that package’s roadmap).

## Related

- [ADR-004](../adr/004-confignode-parser.md) – Parser package and session-only parsed tree.
- [packages/ksp-confignode/docs/roadmap/serializer.md](../../packages/ksp-confignode/docs/roadmap/serializer.md) – Serializer for round-trip and mod interop.
