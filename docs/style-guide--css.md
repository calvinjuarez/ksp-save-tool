# CSS Style Guide

Conventions for styling in this project. See [AGENTS.md](../AGENTS.md) for rules that reference this guide.

## Design tokens

We use CSS custom properties (variables) for shared design values. Define them in `:root` in [src/style.css](../src/style.css).

### Naming

**Prefix:** `--house--` – Namespace for our design system. Easy to find/replace site-wide if it changes.

**Delimiters:**

| Delimiter | Role
| ---       | ---
| `--`      | Separates segments (domain boundaries, hierarchy)
| `_`       | Joins words within a segment (e.g. `border_radius`, `padding_x`, `interactive_hover`)
| `-`       | Attaches variant to preceding segment (e.g. `gray-500`, `input-focus`, `border_radius-lg`)

**Token structure:**

```text
--house--[domain--]{property}[-{variant}]
```

- **Domain** (optional) – Scope for element-specific tokens. Omitted for definitions, semantic families, and global applications.
- **Property** – The thing being defined. Use `_` to join compound words.
- **Variant** (optional) – Attached with `-` to domain or property. The variant itself may use `_` for compound sub-variants (e.g. `interactive_hover`).

**Domain-scoped:**

- `--house--color--ink`, `--house--color--ink-muted` (color domain; `--` separates domain from family, `-` attaches faintness variant)
- `--house--input--border_color`
- `--house--input-focus--border_color` (domain variant: input in focus state)
- `--house--page--max_width`

**Global** (no domain):

- `--house--gray-500` (definition: palette-shade)
- `--house--border_radius-lg`, `--house--border_color-interactive`, `--house--border_color-interactive_hover` (applications). See [design-tokens.md](design-tokens.md) for full registry.

### Composition

Tokens can reference other tokens. Define colors first; applications reuse them: `--house--border_color-interactive: var(--house--gray-200);`

### Layers

- **Definitions** – Raw color values (e.g. `--house--gray-500: #666`). Define once.
- **Semantic families** – Aliases for common use (e.g. `--house--color--ink: var(--house--gray-600)`).
- **Applications** – Where a color is used (e.g. `--house--border_color`). Reference definitions or families.

### Token reference

Full registry: [design-tokens.md](design-tokens.md)

## Class naming

Component classes use the same delimiter conventions as design tokens.

**Delimiters:**

| Delimiter | Role
| ---       | ---
| `_`       | Word join (word boundary)
| `-`       | Variant/modifier
| `--`      | Child/element

**Mnemonic:** One underscore = word join; one hyphen = modifier; two hyphens = element.

**Scope prefixes:**

| Prefix   | Meaning
| ---      | ---
| `v-`     | View layout — structural containers, tied to a view
| `c-`     | Component layout — structural containers, tied to a component
| `l-`     | Local — presentational, might be promoted to global
| *(none)* | Global — shared across the app

**Example:**

```html
<button class="l-foo_item">
	Label <small class="l-foo_item--sublabel">sublabel</small>
</button>
```

Here: `l-foo_item` is the block; `l-foo_item--sublabel` is the sublabel child; `l-foo_item-active` would be a variant.

## Approach

- **Selector-driven** – Components define styles via semantic selectors (`.foo_label`, `label`, etc.). The selector owns the decision “this element is muted”; the token supplies the value.
- **No utility classes for tokens** – We don’t add `.text-muted` to markup. Composition happens in the CSS, not in `class=""` attributes.
- **Design decisions** – See [design-system.md](design-system.md) for typography and other design principles.
