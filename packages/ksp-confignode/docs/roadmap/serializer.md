# Serializer (planned)

## Goal

Add **`serialize(tree)`** (name TBD) that turns the same plain-object shape produced by **`parse()`** back into ConfigNode text, so:

- The **ksp-save-tool** app could inject user metadata as a `SCENARIO`-style block (or merge into existing nodes) for **KSP mod** workflows.
- Round-trip tests can assert **parse → serialize → parse** stability for supported inputs.

## Constraints

- Match KSP’s expectations for `.sfs` / `.cfg` as closely as practical: key order may matter for some tools; indentation and duplicate-node handling must be defined.
- **Arrays** in the object model represent repeated ConfigNode siblings; serialization must emit repeated node names, not JSON arrays.

## Non-goals (initially)

- Perfect preservation of comments, insignificant whitespace, or key order from the original file (unless we add a lossless AST later).

## Related

- `parse.js` – current implementation.
