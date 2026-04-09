# Markdown Style Guide

Conventions for Markdown in this project. See [AGENTS.md](../AGENTS.md) for rules that reference this guide. Enforced by [markdownlint](https://github.com/DavidAnson/markdownlint) via [.markdownlint.json](../.markdownlint.json).

## Code blocks

Fenced code blocks must specify a language. Use `text` for plain text or prose examples.

````markdown
```text
Plain text example
```
````

## Headings

- Blank lines before and after headings.
- Use proper heading levels (h1–h6). Do not use bold or italic as pseudo-headings.

## Tables

- Leading pipe only, no trailing pipe.
- Delimiter row: space before, **three hyphens only** per column; fill with spaces after the three hyphens so the next `|` lines up with the rows above (markdownlint **aligned**). Do **not** use a long run of hyphens (e.g. DO `| ---       |`, NOT `| --------- |`).
- **No trailing whitespace** at end of line: do not pad after the last cell; each row ends immediately after that cell’s content (same as [design-tokens.md](design-tokens.md)).

```markdown
| Header | Header
| ---    | ---
| Cell   | Cell
```

**Directory indexes** (lists of links such as roadmap or doc indices): use a **bullet list**, not a table — `- [file.md](file.md) — description`. See [.cursor/skills/markdown/SKILL.md](../.cursor/skills/markdown/SKILL.md) for the full checklist (including code blocks and headings). For pipe tables, you can pipe rows through [.cursor/skills/markdown/scripts/align_table.py](../.cursor/skills/markdown/scripts/align_table.py) to align columns (script keeps the last column unpadded).

For AI-assisted edits, the **markdown** Cursor skill encodes these rules for any Markdown file.

## Files

- End with a single newline.
- No multiple consecutive blank lines.
