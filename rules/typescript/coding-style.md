---
paths:
  - '**/*.ts'
  - '**/*.tsx'
---

# TypeScript/JavaScript Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with TypeScript/JavaScript specific content.

### Type Annotations

- Use types to make public APIs, shared models, and component props explicit, readable, and reusable.
- Add parameter and return types to exported functions, shared utilities, and public class methods
- Let TypeScript infer obvious local variable types
- Extract repeated inline object shapes into named `type` aliases
- Stay selective about which TypeScript features you lean on — the goal is static type safety, not an OOP paradigm shift. Avoid ambient `declare`/`namespace` blocks and decorators unless a framework requires them for interop (e.g. Angular)

```typescript
// WRONG: Exported function without explicit types
export function formatUser(user) {
  return `${user.firstName} ${user.lastName}`;
}

// CORRECT: Explicit types on public APIs
type User = {
  firstName: string;
  lastName: string;
};

export function formatUser(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}
```

### Interfaces vs. Type Aliases

- Prefer `type` by default — object shapes, unions, intersections, tuples, mapped types, and utility types all use `type`
- Reach for `interface` only when you need declaration merging or a shape a class explicitly `implements`
- Prefer string literal unions over `enum` unless an `enum` is required for interoperability

```typescript
type User = {
  id: string;
  email: string;
};

type UserRole = 'admin' | 'member';
type UserWithRole = User & {
  role: UserRole;
};
```

### NEVER use `any`

- NEVER use `any` in application code
- Use `unknown` for external or untrusted input, then narrow it safely
- Use generics when a value's type depends on the caller

```typescript
// WRONG: any removes type safety
function getErrorMessage(error: any) {
  return error.message;
}

// CORRECT: unknown forces safe narrowing
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error';
}
```

### JavaScript Files

- In `.js` and `.jsx` files, use JSDoc when types improve clarity and a TypeScript migration is not practical
- Keep JSDoc aligned with runtime behavior

```javascript
/**
 * @param {{ firstName: string, lastName: string }} user
 * @returns {string}
 */
export function formatUser(user) {
  return `${user.firstName} ${user.lastName}`;
}
```

## Naming

- Variables and functions: `camelCase`
- Interfaces, types, and components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

## Variable Declarations

- `const` by default, then `let`; never `var`
- Declare each variable on its own line — no comma-separated multi-declarations

## Immutability

Use spread operator for immutable updates:

```typescript
type User = {
  id: string;
  name: string;
};

// WRONG: Mutation
function updateUser(user: User, name: string): User {
  user.name = name; // MUTATION!
  return user;
}

// CORRECT: Immutability
function updateUser(user: Readonly<User>, name: string): User {
  return {
    ...user,
    name
  };
}
```

## Asynchronous Code

- Prefer `async`/`await` over chained `.then()` calls for readability.
- Add explicit `Promise<T>` return types to asynchronous functions.
- Await every Promise unless it is intentionally being run in the background.
- Do not ignore Promises accidentally. Unawaited Promises can cause lost work, unhandled rejections, or race conditions.
- In serverless environments, always await asynchronous work before returning from a handler. The runtime may freeze or terminate after the handler completes, causing pending operations to be cancelled.
- If a Promise is intentionally not awaited, make the intent explicit (for example, using `void` or a platform-specific background task API).
- Avoid mixing `await` with `.then()` in the same function.

```typescript
async function loadUser(userId: string): Promise<User> {
  const user = await fetchUser(userId);
  return user;
}
```

## Error Handling

- Treat caught errors as `unknown` and narrow them before accessing properties.
- Never assume caught errors are instances of `Error`; JavaScript allows throwing any value.
- Use `instanceof Error` or custom type guards to safely access error properties.
- Extract reusable error-narrowing helpers when the same logic is needed in multiple places.
- Preserve original error context when rethrowing errors by using `Error` causes.
- Use `await` when returning promises inside `try/catch` blocks so asynchronous errors are caught correctly.
- Avoid swallowing errors unless there is a deliberate reason and the failure is handled appropriately.

```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error';
}

async function loadUser(userId: string): Promise<User> {
  try {
    return await riskyOperation(userId);
  } catch (error: unknown) {
    logger.error('Operation failed', { error });

    throw new Error(getErrorMessage(error), {
      cause: error
    });
  }
}
```

## Input Validation

Use Zod for schema-based validation and infer types from the schema:

```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
});

type UserInput = z.infer<typeof userSchema>;

const validated: UserInput = userSchema.parse(input);
```

## Loops and Higher-Order Functions

- Prefer `map()`, `reduce()`, and similar higher-order functions over manual loops when they fit the goal; use `Object.keys()`/`Object.entries()` for object iteration
- Don't use `map()` purely for side effects like a loop — use it only when its return value is used; use `forEach()` or a loop otherwise

## Destructuring

- Deep, multi-layer destructuring hurts readability — plain dot notation is fine for pulling out a single value
- If destructuring a complex tuple or object becomes hard to read, prefer a plain `if`/`else` over forcing a destructured shape

## Recursion

JS doesn't reliably support tail-call optimization — prefer loops over recursion unless the call stack depth is small and bounded.

## Declaration Order

Avoid relying on hoisting. Write code so everything referenced on a line is already defined above it.

## Console.log

- No `console.log` statements in production code
- Use proper logging libraries instead
