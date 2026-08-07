---
paths:
  - '**/*.scss'
---

# SCSS Coding Style

> This file extends [coding-style.md](../css/coding-style.md) with SCSS-specific nesting, selector, and module conventions.

## Keep Nesting Shallow

Use nesting only when it improves readability or represents a clear relationship.

Avoid nesting beyond three levels.

```scss
// Avoid
.card {
  .header {
    .title {
      .icon {
      }
    }
  }
}
```

Prefer:

```scss
.card {
}

.header {
}

.title {
}

.icon {
}
```

## Use `&` for States and Pseudo Selectors

Use `&` for states and pseudo selectors.

```scss
.button {
  &:hover {
  }

  &:focus-visible {
  }

  &:disabled {
  }
}
```

Avoid using `&` to create artificial class names.

```scss
// Avoid
.card {
  &Header {
  }

  &Title {
  }
}
```

## Use Component-Scoped Class Names

SCSS Modules automatically scope classes, so generic names are acceptable.

Prefer short, descriptive names:

```scss
.header {
}

.title {
}

.actions {
}

.icon {
}
```

Avoid repeating the component name:

```scss
// Avoid
.userCardHeader {
}

.userCardTitle {
}
```

The component context already provides scope:

```text
components/UserCard/
  UserCard.tsx
  userCard.module.scss
```

## Avoid `@extend`

Avoid `@extend` because it creates unexpected selector combinations.

Prefer mixins or shared classes.

```scss
// Avoid
.button-primary {
  @extend .button;
}
```

## Use Mixins Sparingly

Use mixins for reusable patterns.

```scss
@mixin focus-ring {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

Avoid using mixins for component styles.

```scss
// Avoid
@mixin card {
  padding: 1rem;
  border-radius: 0.5rem;
}
```

## Prefer CSS Custom Properties for Runtime Values

Use CSS variables when values need runtime changes.

```scss
:root {
  --color-primary: #0066ff;
}

.button {
  color: var(--color-primary);
}
```

Use SCSS variables for compile-time values:

- breakpoints
- spacing scales
- build-time constants

## Avoid Generating Large CSS with Loops

Avoid `@each`, `@for`, and generated utility classes unless intentionally used.

Generated CSS should remain predictable.

## Prefer Modern CSS Over SCSS Features

Prefer native CSS when possible.

```scss
.card {
  display: grid;
  gap: 1rem;
}
```

Avoid hiding simple CSS behind unnecessary abstractions.

## SCSS Checklist

Before marking work complete:

- [ ] No nesting deeper than three levels
- [ ] `&` used only for states/pseudo-selectors, not artificial class names
- [ ] Class names stay short and component-agnostic (scoping comes from the module)
- [ ] No `@extend`
- [ ] Mixins used only for reusable patterns, not component styling
- [ ] Runtime-changing values use CSS custom properties; compile-time values use SCSS variables
- [ ] No `@each`/`@for`-generated CSS unless intentional
- [ ] Native CSS preferred over SCSS abstractions where equivalent
