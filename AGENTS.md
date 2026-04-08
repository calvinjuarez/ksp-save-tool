# AI Agent Rules & Guidelines

## Code Style

Use tab indentation.

### CSS

- Native CSS nesting is allowed. Target modern browsers only.
- Use `--house--*` design tokens for shared values.

**Full docs:** [docs/style-guide--css.md](docs/style-guide--css.md)

### HTML

- Group classes in `class=""` by family; double-space between groups.

**Full docs:** [docs/style-guide--html.md](docs/style-guide--html.md)

### Markdown

- Fenced code blocks must specify a language (use `text` for plain text).
- No bold/italic as pseudo-headings; use proper heading levels.
- Markdown (tables, headings, indexes): [.cursor/skills/markdown/SKILL.md](.cursor/skills/markdown/SKILL.md); table alignment helper: [.cursor/skills/markdown/scripts/align_table.py](.cursor/skills/markdown/scripts/align_table.py).

**Full docs:** [docs/style-guide--markdown.md](docs/style-guide--markdown.md)

## Commit Guidelines

- **Small, atomic commits** – Each commit does one logical thing and leaves the app in a working state.
- **Conventional commits** – Use `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` etc. in the subject.
- **Imperative mood** – Subject line: "Add X" not "Added X".
- **Focus on aim, not details** – Message should explain the "why" (purpose), not the "what" (technical changes).
- **Functional** – Every commit should build and run; avoid broken intermediate states.

## Testing

- Tests live next to the code they test (`*.test.js` colocated)
- Run `npm run test` (watch) or `npm run test:run` (single run)

## Documentation

- **Cursor rules:** [.cursor/rules/](.cursor/rules/) – thin wrappers so file-type edits load the right style guide from `docs/`.
- Write docs for the things we build.
- For key architecture decisions, write ADR docs to `docs/adr`. When writing an ADR doc, read [docs/adr/README.md](docs/adr/README.md).
- Keep [README.md](README.md) accurate for this repo: how to install and run, environment setup, testing, etc.
