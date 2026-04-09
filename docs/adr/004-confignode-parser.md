# ADR-004: ConfigNode parser as `ksp-confignode` workspace package

## Status

Accepted

## See also

- [ADR-001](001-service-worker-offline.md) – Offline shell; parsing runs entirely in the browser.
- [packages/ksp-confignode/docs/roadmap/serializer.md](../../packages/ksp-confignode/docs/roadmap/serializer.md) – Future `serialize()` for round-trip and mod interop.

## Context

Kerbal Space Program save and config files use Squad’s **ConfigNode** text format (e.g. `.sfs`, `.cfg`). The app needs to turn uploaded save text into a plain JavaScript tree for reports and exploration.

Public npm options are thin or unmaintained (e.g. `ksp-sfs-to-json` depends on deprecated tooling and lacks a healthy upstream). The format is line-oriented and small enough to implement directly.

## Decision

1. Implement a **hand-rolled parser** (no PEG/Peggy dependency) that maps ConfigNode text to nested objects, with duplicate keys at the same level represented as arrays and values kept as strings.
2. Ship it as a **workspace package** named **`ksp-confignode`** under `packages/ksp-confignode/`, with `export function parse(text)` as the primary API, so it can be published or moved to its own repo later.
3. **Do not** persist full save text in IndexedDB in this phase: the user keeps the `.sfs` on disk and re-uploads when needed; the parsed tree lives only in Pinia for the session.

## Consequences

**Pros:**

- Zero runtime dependencies for parsing; full control over behavior and tests.
- Clear boundary between “format codec” (`ksp-confignode`) and “app UI/state” (`src/`).
- Workspace linking avoids publishing during development.

**Cons:**

- Parser edge cases must be discovered through tests and real saves (no grammar-generated parser).
- Serializer / round-trip is explicitly deferred (see package roadmap).

## Implementation Notes

- Split each line on the **first `=` only** so values may contain `=` characters.
- Maintain a **stack of parent objects** when entering/exiting `{` / `}` blocks; avoid re-walking the tree on every close.
- Only treat a line as a **block name** when it is a bare identifier (not `key = value`), so `prevLine` for `{` is never a full assignment line.
