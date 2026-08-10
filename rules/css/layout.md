---
paths:
  - '**/*.css'
  - '**/*.scss'
---

# CSS Layout

> This file extends [coding-style.md](./coding-style.md) with positioning, Flexbox and browser compatibility rules.

## Positioning Priority

When an element needs precise positioning, work down this list and stop at the first option that does the job:

1. **Margins** — for slight adjustments to an element's default position. Negative margins are acceptable.
2. **Flexbox** — for distributing and aligning siblings. Do not reach for it first; you do not always need Flexbox to centre a div.
3. **Absolute positioning** — remember it resolves against the nearest ancestor that has a `position` of its own, so the parent needs `position: relative`.
4. **Fixed positioning** — last resort, and only when the element genuinely must leave the document flow entirely.

Each step down this list removes the element further from the natural flow, which means more work to keep it correct as surrounding content changes.

```scss
// WRONG: absolute positioning for a nudge
.icon {
  position: absolute;
  top: 0.25rem;
}

// CORRECT: a margin adjustment stays in flow
.icon {
  margin-top: 0.25rem;
}
```

## Avoid `z-index`

`z-index` is far less essential than it appears. Elements stack in DOM order by default, so an element that needs to sit on top usually just needs to come later inside the same parent.

Applying `z-index` creates stacking contexts, and those produce side effects that surface later. Prefer keeping elements in their natural order within a parent container.

`z-index` is acceptable if ordering does not provide the needed functionality

## Flexbox and Grid

### Do Not Overuse Flexbox

Flexbox is for distributing space along an axis. If you are simply stacking `div`s in a column, block layout already does that — adding `display: flex; flex-direction: column` buys nothing and introduces flex sizing rules you now have to reason about.

```scss
// WRONG: Flexbox to stack blocks that already stack
.list {
  display: flex;
  flex-direction: column;
}

// CORRECT: block flow
.list {
  ...
}
```

### Prefer Plain CSS and Flexbox Over a Grid System

Use pure CSS and Flexbox rather than pulling in a grid framework. A grid system adds a layer of class-name indirection and a set of breakpoints that will not match the ones in [coding-style.md](./coding-style.md).

### Responsive Direction Flip

The standard responsive pattern is a row that becomes a column at a small breakpoint:

```scss
.toolbar {
  display: flex;
  flex-direction: row;
}

@media (max-width: 48em) {
  .toolbar {
    flex-direction: column;
  }
}
```

## Browser Quirks

### Safari

For scroll containers, put spacing on the inner content as **padding**, not margin. Safari does not respect trailing margin inside a scroll container, so the final item loses its bottom or right gap.

```scss
// WRONG: Safari drops the trailing gap
.scroller__content {
  margin: 1rem;
}

// CORRECT
.scroller__content {
  padding: 1rem;
}
```

## Layout Checklist

Before marking work complete:

- [ ] Positioning uses the lightest tool that works — margin before Flexbox before absolute before fixed
- [ ] Every `position: absolute` has a positioned ancestor
- [ ] No `z-index` where DOM order would do
- [ ] No Flexbox on containers that only stack blocks
- [ ] No grid framework where plain CSS and Flexbox would work
- [ ] Responsive direction flips use `34em` or `48em`
- [ ] Scroll container inner content uses padding, not margin
