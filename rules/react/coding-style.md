---
paths:
  - '**/*.tsx'
  - '**/*.jsx'
  - '**/components/**/*.ts'
  - '**/components/**/*.js'
  - '**/hooks/**/*.ts'
  - '**/hooks/**/*.js'
---

# React Coding Style

> This file extends [typescript/coding-style.md](../typescript/coding-style.md) and [common/coding-style.md](../common/coding-style.md) with React specific content.

## File Extensions

- `.tsx` for any file containing JSX, even one-liner snippets
- `.ts` for pure logic, custom hooks without JSX, type definitions, utilities
- `.test.tsx` / `.test.ts` mirroring the source file
- Use `.jsx` only when the project intentionally avoids TypeScript

## Naming

- Components: `PascalCase` for both the symbol and the file (`UserCard.tsx`, default export `UserCard`)
- Custom hooks: `useCamelCase` for both the symbol and the file (`useDebounce.ts` exports `useDebounce`)
- Event handlers: name by what the function does, not the event it responds to — `updateProfile`, not `handleClick`. The prop passed to a child can still be `onClick`/`onSubmit` by convention.
- Boolean props: `isLoading`, `hasError`, `canSubmit` — never `loading` or `error` alone for booleans

## Component Shape

```tsx
type UserCardProps = {
  user: User;
  onSelect: (id: string) => void;
};

export function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <button type="button" onClick={() => onSelect(user.id)}>
      {user.name}
    </button>
  );
}
```

- Prefer `type Props = {}` for closed component prop shapes
- Use `interface` only when the prop type is extended via declaration merging or exported as a public API extension point
- Always destructure props in the parameter list — no `props.user` access inside the body
- Type the return implicitly through JSX (`function Foo(): JSX.Element` only when the function returns conditionally and the union confuses inference)
- Do not use `React.FC` unless there is a specific reason to do so. Not using React.FC incentivizes manually typing children props

## JSX

- Self-close tags with no children: `<img />`, `<UserCard user={u} />`
- Use fragments `<>...</>` over wrapper `<div>` when no DOM element is needed
- Conditional rendering: `{condition && <Foo />}` for booleans, ternary for either/or, early return for guard clauses
- Never put logic inline in JSX when it reads as multi-line — extract to a const above the return or a function

```tsx
// Prefer
const greeting = user.isAdmin ? 'Welcome, admin' : `Hello ${user.name}`;
return <h1>{greeting}</h1>;

// Over
return <h1>{user.isAdmin ? 'Welcome, admin' : `Hello ${user.name}`}</h1>;
```

## Server / Client Boundary (Next.js App Router, RSC)

- Default every new component to a Server Component.
- Only add `"use client"` if the file directly uses:
  - React state (`useState`, `useReducer`)
  - Effects (`useEffect`, `useLayoutEffect`)
  - Refs (`useRef`)
  - Browser APIs (`window`, `document`, `localStorage`, etc.)
  - Event handlers (`onClick`, `onChange`, etc.)
  - Client-only hooks (e.g. `useRouter`, `useSearchParams`)
- Before adding `"use client"`, determine whether only part of the component is interactive.
  - If so, extract the interactive portion into its own Client Component.
  - Keep the parent as a Server Component whenever possible.
- Minimize the size of Client Components. They should contain only the code that must run in the browser.
- Place the `"use client"` directive on line 1, before any imports
- Never import a Client Component file from inside a `"use server"` action file
- Never re-export server-only code through a client module — the bundler will silently include it
- Never add `"use client"` in `page.tsx` or `layout.tsx` as metadata cannot be added to client components

## Imports

- React imports first: `import { useState } from "react"`
- Then third-party libs, then absolute project imports, then relative
- Type-only imports: `import type { ReactNode } from "react"` — never mix runtime and type imports in one statement when ESLint's `consistent-type-imports` is configured

## Hooks Discipline

See [hooks.md](./hooks.md) for the full ruleset. Style highlights:

- Custom hooks must start with `use`
- Group all hook calls at the top of the component, before any conditional logic
- Avoid creating ad-hoc hooks for one-line wrappers — inline the call instead

## Effects

- Avoid a `useEffect` that depends on state properties — if behavior needs to run when state changes, trigger it from the event handler that causes the change instead
- `useEffect` on props is acceptable, but before adding one, ask whether you actually need to derive new state or behavior from a prop change. Always prefer NOT using `useEffect`

## Business Logic

- Decouple business logic from view logic — most of a component's code should be UI concerns
- Extract non-trivial business logic into one or more service functions, ideally pure, rather than inlining it in the component

## Component Size

- Keep components small — over ~200 lines is too big
- To shrink an oversized component: extract business logic into service functions, split into child components, and use custom hooks to isolate state-dependent logic

## State

- Local first (`useState`), lift only when shared
- Use Redux (Redux Toolkit) instead of React Context for shared/cross-cutting state
- Use Thunk instead of Saga for async Redux logic — generator-based Saga is harder to follow than the testability it buys
- Never duplicate state that can be derived — compute during render

## Class Components

Forbidden in new code. Use function components for all new code. Avoid `.bind(this)` when you do have to touch a legacy class component.

## File Layout per Component

```
components/UserCard/
  UserCard.tsx
  userCard.module.css   # or userCard.module.scss if project is using scss
  UserCard.test.tsx     # Only if the project has existing tests
  components/           # Child components used only by UserCard
    UserAvatar/
      ...
  hooks/
    useUserCard.ts
  services/
    userCard.service.ts
```

Inline single-file components are fine for trivial presentational pieces.

If a child component is only used by a single parent, keep it inside a `components` subfolder within that parent's own folder rather than promoting it to the shared components directory.

## Assets

- Use `.svg` for vector-based assets such as icons
- Use `.png` or `.jpg` for photos

## Dependencies

Install React packages as `devDependencies`, not `dependencies`. Some cloud/build environments install `dependencies` before the runtime starts — don't ship libraries that aren't needed in prod.
