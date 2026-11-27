---
paths:
  - '**/*.html'
  - '**/*.htm'
  - '**/*.tsx'
  - '**/*.jsx'
  - '**/*.vue'
  - '**/*.svelte'
  - '**/*.astro'
  - '**/*.hbs'
  - '**/*.ejs'
  - '**/*.njk'
  - '**/*.liquid'
  - '**/*.erb'
  - '**/*.cshtml'
  - '**/*.razor'
  - '**/*.css'
  - '**/*.scss'
---

# HTML Accessibility

> This file extends [coding-style.md](./coding-style.md) with accessibility rules. The rules are not optional and they decide whether someone using a keyboard, a screen reader, voice control or a magnifier can use the product at all.

Most accessibility bugs come from the same few mistakes. Using the right native element fixes most of them before they happen. So make sure to reference [coding-style.md](./coding-style.md) first.

## Never Make a `<div>` or `<span>` Clickable

This is the most common one, and it's never acceptable. If a user can click it, it has to be a `<button>` or an `<a href>`.

A `<div>` with a click handler looks fine with a mouse and is broken for everyone else:

- You can't Tab to it, so keyboard users can't reach it.
- Enter and Space do nothing, even if you somehow focus it.
- Screen readers announce it as plain text, so nobody knows it does anything.
- Voice control users can't say "click Save", because the browser doesn't know it's a control.

```html
<!-- WRONG: invisible to keyboards and screen readers -->
<div class="btn" onclick="save()">Save</div>

<!-- WRONG: the "fix" that still isn't one -->
<div class="btn" role="button" tabindex="0" onclick="save()">Save</div>

<!-- CORRECT -->
<button type="button" class="btn" onclick="save()">Save</button>
```

The second example is worth calling out. Adding `role="button"` and `tabindex="0"` gets you focus and an announcement, but you still have to write key handlers for Enter and Space, handle disabled states, and fix form behavior yourself. `<button>` does all of that already. Use it.

The same goes for clickable `<li>`, `<tr>`, `<img>`, `<svg>` and `<td>` elements. Put a real button or link inside them instead.

If a button's default styling is in the way, reset it in CSS. That's a styling problem, and it has a styling fix:

```css
.button-reset {
  all: unset;
}
```

### Clickable Cards

For a card where the whole thing should be clickable, don't wrap the card in a click handler. Put a real link on the card's title and stretch its click area over the card with a pseudo-element:

```html
<article class="card">
  <h3><a href="/projects/42" class="card__link">Website redesign</a></h3>
  <p>Due Friday · 4 open tasks</p>
</article>
```

```css
.card {
  position: relative;
}

.card__link::after {
  content: '';
  position: absolute;
  inset: 0;
}
```

Screen readers get one clean link with a sensible name, instead of a link that reads out the whole card.

## Links Go Places, Buttons Do Things

If clicking it changes the URL or takes the user somewhere, it's an `<a href>`. If it does something on the current page (submits, opens, closes, toggles, deletes, saves), it's a `<button>`.

The quick test: **would it make sense to open this in a new tab?** If yes, link. If no, button.

```html
<!-- WRONG: a link pretending to be a button -->
<a href="#" onclick="openModal()">Edit profile</a>
<a href="javascript:void(0)" onclick="deleteItem()">Delete</a>

<!-- WRONG: a button pretending to be a link -->
<button onclick="window.location = '/settings'">Settings</button>

<!-- CORRECT -->
<button type="button" onclick="openModal()">Edit profile</button>
<button type="button" onclick="deleteItem()">Delete</button>
<a href="/settings">Settings</a>
```

This matters because the two behave differently, and people rely on that:

- Links activate on Enter. Buttons activate on Enter _and_ Space.
- Links can be opened in a new tab, copied, bookmarked and previewed. Buttons can't.
- Screen readers announce them differently, and users have separate shortcuts to list all links or all buttons on a page.

Some more rules for links:

- An `<a>` without an `href` is not a link and isn't focusable. Never use `href="#"` or `href="javascript:..."` as a way to get a clickable element. Use a button.
- In client-side routed apps, use the router's link component (`<Link>` in Next.js / React Router). It renders a real `<a href>`. Don't navigate with `onClick={() => router.push(...)}` on a button or div, unless the navigation happens as a side effect of an action, like redirecting after a successful save.
- It's fine for a link to look like a button and a button to look like a link. Pick the element by behavior, then style it however the design calls for.

## Everything Has to Work With a Keyboard

Unplug the mouse and try it. Every single thing a mouse user can do, a keyboard user has to be able to do too.

- **Tab** and **Shift+Tab** move between interactive elements, in an order that matches the visual layout.
- **Enter** and **Space** activate buttons. **Enter** follows links.
- **Escape** closes dialogs, menus and popovers.
- **Arrow keys** move within composite widgets like tabs, menus, radio groups and listboxes.

If you're using native elements, you get almost all of this for free.

### `tabindex`

- `tabindex="0"` makes an element focusable in the normal order. You should rarely need it. If you're adding it to make something clickable, you should be using a `<button>`.
- `tabindex="-1"` makes an element focusable from script but leaves it out of the Tab order. Use it for things you move focus to programmatically, like a dialog container or an error summary.
- **Never use a positive `tabindex`** (`tabindex="1"`, `"5"`, etc.). It jumps the element ahead of everything else on the page and wrecks the Tab order for everyone. Fix the DOM order instead.

### Focus Must Be Visible

Keyboard users need to see where they are. Never remove the focus outline without putting a clearly visible replacement in its place.

```css
/* WRONG: keyboard users are now lost */
button:focus {
  outline: none;
}

/* CORRECT: visible for keyboard users, hidden for mouse clicks */
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

Make sure the focus style has enough contrast against the background (3:1 at minimum), and that sticky headers or footers don't cover the focused element.

### Don't Lose Focus

When content changes, think about where focus ends up:

- Opening a dialog moves focus into it. Closing it puts focus back on the button that opened it.
- Deleting an item from a list moves focus to a sensible neighbour, not back to the top of the page.
- After a client-side route change, move focus to the new page's `<h1>` or `<main>` so screen reader users know the page changed.
- Never take focus away from someone who is typing.

## Prefer Native Elements Over ARIA

The first rule of ARIA is: **don't use ARIA if a native element does the job.** ARIA only changes what screen readers announce. It doesn't add any behavior. A `role="button"` won't respond to the keyboard, and a `role="checkbox"` won't toggle when you click it. All of that is still on you.

Bad ARIA is worse than no ARIA, because it makes promises the element doesn't keep.

| Instead of                          | Use                                          |
| ----------------------------------- | -------------------------------------------- |
| `<div role="button">`               | `<button>`                                   |
| `<span role="link">`                | `<a href>`                                   |
| `<div role="checkbox">`             | `<input type="checkbox">`                    |
| `<div role="dialog">`               | `<dialog>`                                   |
| `<div role="heading" aria-level=2>` | `<h2>`                                       |
| `<div role="list">`                 | `<ul>`                                       |
| A custom accordion                  | `<details>` and `<summary>`                  |
| A custom select                     | `<select>`, unless it truly can't do the job |

When you do need ARIA, it's usually for **state** that HTML can't express on its own:

```html
<button type="button" aria-expanded="false" aria-controls="filters">
  Filters
</button>
<div id="filters" hidden>...</div>

<button type="button" aria-pressed="true">Bold</button>

<a href="/orders" aria-current="page">Orders</a>
```

Keep those attributes in sync with the UI. An `aria-expanded="false"` on a menu that's open is a bug.

If you really have to build a custom widget (tabs, combobox, tree, menu), follow the matching pattern in the [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/) exactly, including its keyboard behavior. Even better, use a well-tested headless library (Radix, React Aria, Headless UI) that already does.

## Everything Needs a Name

Every interactive element needs an accessible name, which is what a screen reader says when you land on it.

### Buttons and Links

Usually the text inside is the name, and that's the best option. Icon-only buttons don't have any text, so give them one:

```html
<!-- WRONG: announced as just "button" -->
<button type="button"><svg>...</svg></button>

<!-- CORRECT -->
<button type="button" aria-label="Close dialog">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>
```

Link text should make sense on its own, because screen reader users often hear a list of every link on the page. "Click here", "Read more" and "Learn more" mean nothing out of context.

```html
<!-- WRONG -->
<p>To see our pricing, <a href="/pricing">click here</a>.</p>

<!-- CORRECT -->
<p>See <a href="/pricing">our pricing plans</a>.</p>
```

If a link opens in a new tab, say so ("opens in a new tab") with visible text or an icon that has a label.

### Form Fields

Every input needs a real `<label>`. Placeholder text is not a label. It disappears as soon as someone starts typing, often has poor contrast, and isn't reliably read out.

```html
<!-- WRONG -->
<input type="email" placeholder="Email" />

<!-- CORRECT -->
<label for="email">Email</label>
<input id="email" type="email" name="email" autocomplete="email" />
```

- Clicking a properly connected label focuses the input, which also gives people a bigger target to hit.
- Group related radio buttons and checkboxes in a `<fieldset>` with a `<legend>` that asks the question.
- Mark required fields with the `required` attribute, plus a visible indicator. Don't rely on a red asterisk by itself.
- Put help text and error messages next to the field and connect them with `aria-describedby`:

```html
<label for="password">Password</label>
<input
  id="password"
  type="password"
  name="password"
  autocomplete="new-password"
  aria-describedby="password-hint password-error"
  aria-invalid="true"
/>
<p id="password-hint">At least 12 characters.</p>
<p id="password-error">Password is too short.</p>
```

- Error messages should say what went wrong and how to fix it. "Invalid input" doesn't help anyone.
- When a form submission fails, move focus to the first invalid field or to an error summary at the top of the form.

## Images and Icons

Every `<img>` needs an `alt` attribute. What goes in it depends on why the image is there:

- **Informative images:** describe what the image is telling you, not what it looks like pixel by pixel. `alt="Revenue grew 40% from January to June"` beats `alt="bar chart"`.
- **Decorative images:** use an empty `alt=""`. Screen readers skip it entirely. Leaving `alt` off completely is not the same thing, since many screen readers will read out the file name instead.
- **Images that are the only content of a link or button:** the `alt` describes where it goes or what it does. `alt="Home"` for a logo that links to the homepage, not `alt="Acme logo"`.
- Don't start with "Image of" or "Picture of". Screen readers already announce that it's an image.
- Don't put text in images. If you can't avoid it, the `alt` must include all of that text.

For inline SVGs, add `aria-hidden="true"` when they're decorative or sit next to visible text. If an SVG carries meaning by itself, give it `role="img"` and an `aria-label`.

## Hiding Things Correctly

There are three ways to hide something, and they mean different things:

| Goal                                          | How                                        |
| --------------------------------------------- | ------------------------------------------ |
| Hidden from everyone                          | `hidden` attribute or `display: none`      |
| Hidden visually, still read by screen readers | A `.visually-hidden` utility class (below) |
| Visible, but ignored by screen readers        | `aria-hidden="true"`                       |

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

Never put `aria-hidden="true"` on something that's focusable, or on a parent of something focusable. Keyboard users can still Tab to it, and screen readers will say nothing at all.

## Disabled Controls

The `disabled` attribute removes a control from the Tab order, so keyboard and screen reader users may never find out it exists, or why they can't use it. For a submit button that's disabled until the form is valid, it's often better to leave it enabled and show the validation errors when it's clicked. If you do disable something, make sure the reason is visible on the page.

## Accessibility Checklist

Before marking work complete:

- [ ] No `<div>`, `<span>` or other non-interactive element has a click handler
- [ ] Links are `<a href>` and navigate; buttons are `<button>` and perform actions
- [ ] No `href="#"` or `href="javascript:..."`
- [ ] Every interactive element can be reached and used with only the keyboard
- [ ] Focus is always visible, and `outline: none` is never used without a replacement
- [ ] No positive `tabindex` values
- [ ] Focus is moved and restored correctly when dialogs open and close, and when content is removed
- [ ] Native elements are used instead of ARIA roles wherever they exist
- [ ] ARIA state attributes (`aria-expanded`, `aria-pressed`, etc.) stay in sync with the UI
- [ ] Every button, link and form field has a clear accessible name
- [ ] Every input has a real `<label>`; placeholders are not used as labels
- [ ] Errors are tied to their fields with `aria-describedby` and explain how to fix the problem
- [ ] Every `<img>` has an `alt`, empty for decorative images
- [ ] Nothing focusable is inside `aria-hidden="true"`
