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
- Delimiter row: Space before, three hyphens only; fill with spaces after the 3 hyphens to align the pipes, per markdownlint's "aligned" rule

```markdown
| Header | Header
| ---    | ---
| Cell   | Cell
```

## Files

- End with a single newline.
- No multiple consecutive blank lines.
