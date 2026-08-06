---
paths:
  - '**/*.css'
---

# CSS Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with CSS specific content. For positioning, Flexbox and browser quirks, see [layout.md](./layout.md).

## Units

### Prefer `rem` for sizing

Use `rem` for spacing, dimensions, and typography.

Assume a `16px` root font size unless the project explicitly overrides it.

Prefer consistent scales:

- `0.25rem` for fine adjustments
- `0.5rem` for common spacing
- `1rem+` for larger spacing

Exceptions:

- Use `1px` for hairline borders and subtle shadow offsets.

### Media Queries

Use `em` for media query breakpoints.

```scss
@media (max-width: 48em) {
  // styles
}
```

### Avoid Viewport Units

Avoid `vh` and `vw` for layout sizing.

Prefer content-driven layouts using containers, Flexbox, and Grid.

### Avoid Arbitrary Percentages

Avoid percentage widths and heights except for common values:

- `0%`
- `50%`
- `100%`

Use Flexbox or Grid for proportional layouts.

### Avoid Unnecessary `calc()`

Avoid using `calc()` to compensate for layout issues.

Prefer wrapper elements that own spacing and let children use normal sizing.

```scss
// Avoid
.panel {
  width: calc(100% - 2rem);
}

// Prefer
.panel-wrapper {
  padding: 0 1rem;
}

.panel {
  width: 100%;
}
```

## Media Queries

### Use the Standard Breakpoints

Use one or more of `34em`, `48em`, `64em`, `72em`. Do not invent breakpoints to fit a single component — a breakpoint that exists in one file only means every other component ignores it, and the layout shifts in stages.

### Max-Width Only, Largest Screen First

Write the styles for the largest screen size, then apply `max-width` media queries to adjust progressively downward. Do not mix `min-width` and `max-width`.

```scss
// WRONG: mixed directions, ranges overlap
.sidebar {
  width: 100%;
}

@media (min-width: 48em) {
  .sidebar {
    width: 20rem;
  }
}

@media (max-width: 64em) {
  .sidebar {
    padding: 0.5rem;
  }
}

// CORRECT: desktop base, max-width steps down
.sidebar {
  width: 20rem;
}

@media (max-width: 48em) {
  .sidebar {
    width: 100%;
    padding: 0.5rem;
  }
}
```

### Avoid Height-Based Media Queries

`min-height` and `max-height` queries are not necessary in most cases

### Group Queries at the Bottom Once They Multiply

Inline media queries next to the rule they modify are fine in small numbers. Past three or four in a single file, move them into media query blocks at the bottom of the file — one block per breakpoint. A reader can then see the whole behaviour of the UI at a given breakpoint in one place instead of reconstructing it from scattered fragments.

```scss
// Component styles above...

@media (max-width: 48em) {
  .card { ... }
  .card__header { ... }
  .card__actions { ... }
}

@media (max-width: 34em) {
  .card { ... }
}
```

## Box Model

### Use `box-sizing: border-box`

`border-box` makes `width` and `height` include padding and border. Without it, `width: 100%` plus any padding overflows the parent

```scss
.field {
  box-sizing: border-box;
  width: 100%;
  padding: 0.5rem;
  border: 1px solid;
}
```

### `width: 100%` Is Often Redundant

A `div` is a block container by default and already spans the full width of its parent. Setting `width: 100%` on it adds nothing, and it actively hurts once the element also carries horizontal padding or margin.

## CSS Checklist

Before marking work complete:

- [ ] Sizes use `rem` on a `0.5rem` or `0.25rem` scale — no arbitrary pixel values
- [ ] Media queries use `em` and only the `34em` / `48em` / `64em` / `72em` breakpoints
- [ ] Media queries are `max-width` only, written largest screen first
- [ ] No height-based media queries
- [ ] No `vh` / `vw`, no percentage sizes other than `0%` / `50%` / `100%`
- [ ] No `calc` where a container with padding would do
- [ ] `box-sizing: border-box` set where width includes padding or border
- [ ] No redundant `width: 100%` on block-level elements
- [ ] More than three or four media queries in a file are grouped at the bottom
