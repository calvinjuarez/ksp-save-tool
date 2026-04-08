# Architecture Decision Records

ADRs document significant architecture and design decisions for this project.

## When to write one

Write an ADR when you make a choice that:

- Affects how multiple parts of the system interact
- Has non-obvious trade-offs worth documenting
- Future contributors would benefit from understanding the rationale

Skip ADRs for trivial choices, obvious defaults, or one-off fixes.

## When to edit one

Avoid editing ADRs that were committed as part of a different effort or worksession, except to:

- Update **Status**
- Add links to related ADRs in **See also**

This keeps historical context intact. When a later ADR changes a detail of an existing one, add a See also link from the old ADR to the new one instead of rewriting the old doc.

## Format

Use this structure:

```markdown
# ADR-XXX: Short Title

## Status

Proposed | Accepted | Deprecated | Superseded by [ADR-YYY](YYY-slug.md)

## See also

Optional. Links to related ADRs with a brief note on why each is relevant. Use when a later ADR updates or supersedes part of this one.

- [ADR-YYY](YYY-slug.md) – Supersedes the X behavior described below.

## Context

What situation or problem led to this decision?

## Decision

What did we decide to do?

## Consequences

**Pros:**
- ...

**Cons:**
- ...

## Implementation Notes

Optional. Concrete details for implementers.
```

## Naming

Files: `NNN-short-slug.md` (e.g. `001-use-smogon-calc-with-overrides.md`). Use the next available number. The `ADR-NNN` in the title matches the filename prefix.
