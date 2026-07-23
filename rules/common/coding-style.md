# Coding Style

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate existing ones:

```
// Pseudocode
WRONG:  modify(original, field, value) → changes original in-place
CORRECT: update(original, field, value) → returns new copy with change
```

Rationale: Immutable data prevents hidden side effects, makes debugging easier, and enables safe concurrency.

## Core Principles

### KISS (Keep It Simple)

- Prefer the simplest solution that actually works
- Avoid premature optimization
- Optimize for clarity over cleverness

### DRY (Don't Repeat Yourself)

- Extract repeated logic into shared functions or utilities
- Avoid copy-paste implementation drift
- Introduce abstractions when repetition is real, not speculative

### FART (Functional, Approachable, Reliable and Testable)

- Functional: favor pure functions and predictable inputs/outputs over hidden state
- Approachable: code should be understandable without deep prior context
- Reliable: behavior stays consistent across environments and edge cases
- Testable: design units so they can be verified in isolation, without heavy setup

### YAGNI (You Aren't Gonna Need It)

- Do not build features or abstractions before they are needed
- Avoid speculative generality
- Start simple, then refactor when the pressure is real

## File Organization

MANY SMALL FILES > FEW LARGE FILES:

- High cohesion, low coupling
- 100-200 lines typical, 300 MAX
- Extract utilities from large modules
- Organize by feature/domain, not by type

## Error Handling

ALWAYS handle errors comprehensively:

- Log detailed error context on the server side
- Never silently swallow errors
- Catch errors where they can be handled meaningfully
- Preserve useful context when rethrowing errors
- Return actionable user-facing errors without exposing internal implementation details
- Log unexpected errors using the project's logging infrastructure

## Input Validation

ALWAYS validate at system boundaries:

- Validate all user input before processing
- Use schema-based validation where available
- Fail fast with clear error messages
- Never trust external data (API responses, user input, file content)

## Naming Conventions

- Variables and functions: `camelCase` with descriptive names
- Booleans: prefer `is`, `has`, `should`, or `can` prefixes
- Interfaces, types, and components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Custom hooks: `camelCase` with a `use` prefix

## Code Smells to Avoid

### Deep Nesting

Prefer early returns over nested conditionals once the logic starts stacking.

### Magic Numbers

Use named constants for meaningful thresholds, delays, and limits.

### Long Functions

Split large functions into focused pieces with clear responsibilities.

## Comments

- Prefer self-explanatory code over comments
- Add comments only when explaining non-obvious intent, tradeoffs, or business rules
- Keep comments synchronized with the code

## Code Quality Checklist

Before marking work complete:

- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<300 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No hardcoded values (use constants or config)
- [ ] No mutation (immutable patterns used)
