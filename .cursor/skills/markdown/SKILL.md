---
name: markdown
description: >-
  Writes repository Markdown that follows common markdownlint rules: fenced code
  blocks with languages, real headings, aligned pipe tables (MD055/MD060), lists
  instead of tables for link indexes, and file hygiene. Use when editing docs,
  READMEs, ADRs, skills, or when the user mentions Markdown, markdownlint, or
  docs/style-guide--markdown.md.
---

To use this skill in **Cursor** outside this repo, copy the `markdown` folder to `~/.cursor/skills/markdown/` (personal) or another project’s `.cursor/skills/markdown/`.

Conventions below match typical **markdownlint** configs and work in any editor. Repositories may add a **style guide** (e.g. `docs/style-guide--markdown.md`); follow that when it exists.

## Code blocks

- Fenced blocks **must** declare a language; use `text` for plain prose.

## Headings

- Blank lines before and after headings.
- Use real heading levels (`#` … `######`). Do not fake headings with bold or italic.
- In `SKILL.md`, the frontmatter `name` is the document title—start the body at `##` (no duplicate `#` title).

## Tables (MD055, MD060)

- **Leading `|` only** on each row; **no trailing `|`** at end of line.
- **Delimiter row:** exactly **three hyphens** per column (`---`), then spaces so the next `|` lines up with the rows above—not a long run of hyphens.
- **Align pipes** vertically; **trailing spaces** at end of line are OK when padding rows to the same width as the longest line.

Wrong:

```markdown
| A | B |
| --- | --- |
```

Right:

```markdown
| A | B
| --- | ---
```

### Script: column widths and alignment

From the skill directory, pipe table rows (no delimiter needed; existing delimiter lines are ignored) into **`scripts/align_table.py`**:

```bash
python .cursor/skills/markdown/scripts/align_table.py < snippet.md
```

The script recomputes column widths from the data, inserts a correct delimiter after the first row, and prints **leading-pipe-only** aligned rows. Use it when hand-editing wide tables.

Validate with **markdownlint-cli2** when the project has it:

```bash
npx markdownlint-cli2@latest path/to/file.md
```

## Directory indexes

For “what’s in this folder” pages, use a **bullet list**, not a table:

```markdown
- [doc.md](doc.md) — Short description
```

Use **em dash** (`—`) between the link and the description.

## Files

- End with a single newline.
- Avoid multiple consecutive blank lines.

## Checklist

1. Code fences have a language.
2. Headings are real headings, not bold-as-title.
3. Tables: no trailing `|`; delimiter is `---` + spaces; pipes align.
4. Link indexes use lists, not tables.
