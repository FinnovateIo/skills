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
---

# HTML Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with general HTML markup structure. For interactive elements, keyboard support, ARIA and everything else accessibility related, see [accessibility.md](./accessibility.md).

These rules apply to anything that renders HTML, including JSX and framework templates. The examples use plain HTML, but `<div onClick>` in React is exactly the same problem as `<div onclick>` in a static page.

## Pick the Element for What It Is, Not How It Looks

HTML elements carry meaning. Browsers, screen readers, search engines and browser extensions all read that meaning. CSS can make any element look like anything, so choose the element based on what the content _is_ and style it afterwards.

Before you reach for a `<div>` or a `<span>`, check whether one of these fits:

| If the content is...                     | Use                            |
| ---------------------------------------- | ------------------------------ |
| Something you click to do an action      | `<button>`                     |
| Something you click to go somewhere      | `<a href="...">`               |
| A heading for a section                  | `<h1>` – `<h6>`                |
| A paragraph of text                      | `<p>`                          |
| A group of similar items                 | `<ul>` / `<ol>` with `<li>`    |
| Name/value pairs (metadata, definitions) | `<dl>` with `<dt>` and `<dd>`  |
| Rows and columns of data                 | `<table>`                      |
| A form control's caption                 | `<label>`                      |
| A group of related form controls         | `<fieldset>` with `<legend>`   |
| An image with a caption                  | `<figure>` with `<figcaption>` |
| A date or time                           | `<time datetime="...">`        |
| Expandable content                       | `<details>` with `<summary>`   |
| A modal or popup                         | `<dialog>`                     |

`<div>` and `<span>` are fine. They're the right choice for wrappers that exist only for layout or styling. Just don't use them when a real element already does the job.

### Example

Instead of:

<div class="card">
  <div class="title">Account Settings</div>
  <div class="description">Manage your account.</div>
  <div class="button" onclick="openSettings()">
    Open Settings
  </div>
</div>

Prefer:

<section class="card">
  <h2>Account Settings</h2>
  <p>Manage your account.</p>
  <button type="button" onclick="openSettings()">
    Open Settings
  </button>
</section>

## Page Structure

Every page should use landmark elements so people can jump around it instead of reading top to bottom:

```html
<body>
  <header>
    <nav aria-label="Main">...</nav>
  </header>

  <main>
    <h1>Account settings</h1>
    ...
  </main>

  <footer>...</footer>
</body>
```

- Exactly one `<main>` per page.
- Use `<nav>` for major navigation blocks, not every group of links. If there's more than one `<nav>`, give each an `aria-label` so they can be told apart ("Main", "Breadcrumb", "Footer").
- `<header>` and `<footer>` can also appear inside an `<article>` or `<section>`, which is fine.
- Use `<section>` when the content has a heading of its own. If it has no heading, it's probably just a `<div>`.
- Use `<article>` for content that would still make sense pulled out on its own: a blog post, a comment, a product card.
- Use `<aside>` for content that's related but secondary, like a sidebar.

## Headings

Headings are how a lot of people navigate. Screen reader users often pull up a list of headings and jump straight to the one they want, so the outline has to make sense.

- One `<h1>` per page, describing what the page is.
- Don't skip levels on the way down. An `<h2>` is followed by an `<h3>`, not an `<h4>`. Going back up (from `<h4>` to `<h2>`) is fine.
- Pick the heading level based on the outline, not the font size. If an `<h2>` needs to look smaller, change it in CSS.
- Don't use headings just to make text big and bold. If it isn't introducing a section, it isn't a heading.

```html
<!-- WRONG: picked for size, levels skipped -->
<h1>Dashboard</h1>
<h4>Recent orders</h4>

<!-- CORRECT -->
<h1>Dashboard</h1>
<h2 class="section-title--small">Recent orders</h2>
```

## Lists and Tables

If you're rendering several of the same thing in a row (nav links, cards, search results, tags), it's a list. Use `<ul>` or `<ol>`. Screen readers announce "list, 8 items", which tells people what they're dealing with before they start.

Use a `<table>` when the data really is two-dimensional, meaning each value relates to both its row and its column. Don't use tables for layout, and don't fake a table with a grid of `<div>`s.

```html
<table>
  <caption>
    Invoices for March
  </caption>
  <thead>
    <tr>
      <th scope="col">Invoice</th>
      <th scope="col">Amount</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">INV-1042</th>
      <td>$1,200.00</td>
      <td>Paid</td>
    </tr>
  </tbody>
</table>
```

Give header cells `<th>` with `scope`, and use a `<caption>` (it can be visually hidden) so the table has a name.

## Forms

- Wrap form controls in a real `<form>`. You get Enter-to-submit, native validation and password manager support for free.
- Give every `<button>` an explicit `type`. A button inside a form defaults to `type="submit"`, which is how "Cancel" buttons end up submitting forms. Use `type="button"` for anything that isn't the submit action.
- Use the right `input` type: `email`, `tel`, `url`, `number`, `date`, `search`, `password`. Mobile users get the right keyboard and the browser does some of the validation for you.
- Add `autocomplete` to fields that collect personal details (`name`, `email`, `street-address`, `current-password`, `new-password`, `one-time-code`). It saves people a lot of typing.
- Give `<input>`, `<select>` and `<textarea>` a `name` attribute that matches what the server expects.

## Document Basics

- `<html lang="en">` (or the right language). Screen readers use it to pick the correct pronunciation.
- Every page has a unique, descriptive `<title>`, most specific part first: `Billing – Account settings – Acme`.
- Include `<meta name="viewport" content="width=device-width, initial-scale=1">`. Never add `maximum-scale=1` or `user-scalable=no`, since that stops people from zooming in.
- `id`s must be unique on the page. Things like `<label for>` and `aria-describedby` silently break when they're not. In components that render more than once, generate the id (`useId()` in React) instead of hardcoding it.

## Keep the Markup Lean

- Don't stack wrapper `<div>`s that do nothing. Every extra layer is something to read past in the dev tools, and something to style around.
- Don't use `<br>` for spacing. That's what margin is for. `<br>` is only for line breaks that are part of the content, like an address or a poem.
- Don't use inline `style` attributes for static styling. Put it in the stylesheet.
- Don't use presentational elements or attributes (`<center>`, `<font>`, `align`, `bgcolor`).
- Use `<strong>` and `<em>` when you mean importance or emphasis. Use CSS when you just want bold or italic text.

## HTML Checklist

Before marking work complete:

- [ ] Every element was chosen for what the content is, not how it looks
- [ ] The page has `<header>`, `<nav>`, `<main>` and `<footer>` where they apply, and only one `<main>`
- [ ] There's one `<h1>`, and heading levels don't skip on the way down
- [ ] Repeated items are in a list, and tabular data is in a `<table>` with `<th scope>`
- [ ] Every `<button>` has an explicit `type`
- [ ] Inputs use the correct `type`, and personal fields have `autocomplete`
- [ ] `<html>` has a `lang`, the page has a meaningful `<title>`, and zoom isn't disabled
- [ ] No duplicate `id`s, no `<br>` for spacing, no pointless wrapper `<div>`s
