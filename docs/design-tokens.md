# Design System – Tokens

Token reference for the design system. See [style-guide--css.md](style-guide--css.md) for naming conventions and implementation details.

## De-facto tokens

Use `white` and `black` directly. No custom property needed.

## Definitions (100–600 scale)

### Grays

| Token                         | Value  |
| ---                           | ---
| `--house--gray-100`          | `#f2f2f2`
| `--house--gray-200`          | `#e0e0e0`
| `--house--gray-300`          | `#c9c9c9`
| `--house--gray-400`          | `#999`
| `--house--gray-500`          | `#666`
| `--house--gray-600`          | `#333`

### Blues

| Token                         | Value  |
| ---                           | ---
| `--house--blue-100`          | `#f0f7ff`
| `--house--blue-200`          | `#c7dcff`
| `--house--blue-300`          | `#93c5fd`
| `--house--blue-400`          | `#60a5fa`
| `--house--blue-500`          | `#0d6efd`
| `--house--blue-600`          | `#0a5dd9`

### Reds

| Token                         | Value  |
| ---                           | ---
| `--house--red-100`           | `#fef2f2`
| `--house--red-200`           | `#fecaca`
| `--house--red-300`           | `#fca5a5`
| `--house--red-400`           | `#f87171`
| `--house--red-500`           | `#dc3545`
| `--house--red-600`           | `#b91c1c`

### Oranges

Balanced pure orange (anchored at `500`), tuned to sit beside blues and reds without reading as danger red.

| Token                         | Value  |
| ---                           | ---
| `--house--orange-100`        | `#fff4ed`
| `--house--orange-200`        | `#ffe0cc`
| `--house--orange-300`        | `#ffc090`
| `--house--orange-400`        | `#ff994d`
| `--house--orange-500`        | `#fd7e14`
| `--house--orange-600`        | `#dc6505`

## Semantic families (4 faintness levels + dark)

Each family has: base, dark, muted, hint, faint. Token pattern: `--house--color--{family}`, `--house--color--{family}-dark`, `--house--color--{family}-muted`, `--house--color--{family}-hint`, `--house--color--{family}-faint`.

| Family   | Base    | Dark    | Muted   | Hint    | Faint   |
| ---      | ---     | ---     | ---     | ---     | ---     |
| Ink      | `--house--color--ink` | `--house--color--ink-dark` | `--house--color--ink-muted` | `--house--color--ink-hint` | `--house--color--ink-faint` |
| Primary  | `--house--color--primary` | `--house--color--primary-dark` | `--house--color--primary-muted` | `--house--color--primary-hint` | `--house--color--primary-faint` |
| Danger   | `--house--color--danger` | `--house--color--danger-dark` | `--house--color--danger-muted` | `--house--color--danger-hint` | `--house--color--danger-faint` |
| Template | `--house--color--template` | `--house--color--template-dark` | `--house--color--template-muted` | `--house--color--template-hint` | `--house--color--template-faint` |

Template maps to the orange ramp. Use for shipped placeholder UI or assets you expect forks to replace (not for error / destructive states—use Danger).

## Applications

### Borders

| Token                               | References | Use
| ---                                 | ---        | ---
| `--house--border_color`            | `gray-100` | Subtle borders (cards, dividers, move slots)
| `--house--border_color-interactive` | `gray-200` | Default interactive borders, form control borders
| `--house--border_color-interactive_hover` | `gray-400` | Hover-state borders

### Border radius

| Token                         | Value  | Use
| ---                           | ---    | ---
| `--house--border_radius-lg`  | `8px`  | Cards, wells
| `--house--border_radius-md`   | `6px`  | Buttons, move slots
| `--house--border_radius-sm`  | `4px`  | Form controls, mode buttons

### Inputs

| Token                               | References | Use
| ---                                 | ---        | ---
| `--house--input--padding_x`        | `0.5rem`   | Horizontal padding
| `--house--input--padding_y`        | `0.25rem`  | Vertical padding
| `--house--input--padding`          | composite  | Shorthand: `padding_y padding_x`
| `--house--input--border_radius`    | `border_radius-sm` | Form control corners
| `--house--input--border_color`     | `border_color-interactive` | Default form border
| `--house--input-focus--border_color` | `color--primary-muted` | Focus ring / outline
