# API Design

> This file extends [security.md](./security.md), [error-handling.md](./error-handling.md) and [performance.md](./performance.md) with HTTP API conventions.

These rules describe the contract an API exposes over HTTP. They are independent of language, runtime and framework.

---

## Route Paths

- Lowercase only. Never use capital letters in a route path.
- Hyphens separate words in a path segment: `/v1/bank-accounts`, never `/v1/bankAccounts` or `/v1/bank_accounts`.
- Path parameters identify a resource; they are not a place for filters.

```
WRONG:   GET /v1/Users
WRONG:   GET /v1/user
WRONG:   GET /v1/bankAccounts/:id
CORRECT: GET /v1/users
CORRECT: GET /v1/bank-accounts/:id
```

Use sub-resources for relationships

```
GET    /v1/users/:id/orders
POST   /v1/users/:id/orders
```

## Casing

The casing convention differs by location, and this is the rule most often violated:

| Location        | Casing       |
| --------------- | ------------ |
| Route path      | `kebab-case` |
| Query parameter | `snake_case` |
| Request body    | `camelCase`  |
| Response body   | `camelCase`  |

Query parameters use underscores. Capital letters in a query parameter are not acceptable; capital letters in a body are.

```
WRONG:   GET /v1/users?isActive=true&createdAfter=2026-01-01
CORRECT: GET /v1/users?is_active=true&created_after=2026-01-01
```

## Versioning

Every route carries a version prefix. Versioning is what allows a breaking change to ship without breaking existing functionality.

```
/v1/users
/v1/users/:id
/v1/bank-accounts/:id/transactions
```

1. Non-breaking changes don't need a new version:
   - Adding new fields to responses
   - Adding new optional query parameters
   - Adding new endpoints
2. Breaking changes require a new version:
   - Removing or renaming fields
   - Changing field types
   - Changing URL structure
   - Changing authentication method

Involve the user here and ASK how to proceed. Use the above rules to provide recommendations.
There are many other factors to consider when changing versions, it is NOT acceptable to change versions without coordinating with the user.

## Filtering, Sorting, and Search

Filters, sorting, and pagination belong in query parameters. **Never send a body with a GET request**

```
WRONG:   GET /v1/users
         body: { "isActive": true, "role": "admin" }

CORRECT: GET /v1/users?is_active=true&role=admin
```

### Filtering

```
# Simple equality
GET /api/v1/orders?status=active&customer_id=abc-123

# Comparison operators (use bracket notation)
GET /api/v1/products?price[gte]=10&price[lte]=100
GET /api/v1/orders?created_at[after]=2025-01-01

# Multiple values (comma-separated)
GET /api/v1/products?category=electronics,clothing

# Nested fields (dot notation)
GET /api/v1/orders?customer.country=US
```

### Sorting

```
# Single field (prefix - for descending)
GET /api/v1/products?sort=-created_at

# Multiple fields (comma-separated)
GET /api/v1/products?sort=-featured,price,-created_at
```

### Full-Text Search

```
# Search query parameter
GET /api/v1/products?q=wireless+headphones

# Field-specific search
GET /api/v1/users?email=alice
```

## HTTP Methods and Status Codes

### Method Semantics

| Method | Idempotent | Safe | Use For                           |
| ------ | ---------- | ---- | --------------------------------- |
| GET    | Yes        | Yes  | Retrieve resources                |
| POST   | No         | No   | Create resources, trigger actions |
| PUT    | Yes        | No   | Full replacement of a resource    |
| PATCH  | No*        | No   | Partial update of a resource      |
| DELETE | Yes        | No   | Remove a resource                 |

*PATCH can be made idempotent with proper implementation

### Status Codes

Do not return 400 as a blanket response. The status code is the first thing a client branches on, and collapsing every failure into one code forces every consumer to parse message strings.

| Code | Meaning                                                     |
| ---- | ----------------------------------------------------------- |
| 200  | Success                                                     |
| 201  | Resource created                                            |
| 204  | Success, no content to return                               |
| 400  | Malformed request — unparseable, missing required structure |
| 401  | Not authenticated — no valid credentials supplied           |
| 403  | Authenticated, but not authorized for this resource         |
| 404  | Resource does not exist                                     |
| 409  | Conflict with current state — duplicate, version mismatch   |
| 422  | Well-formed request that failed validation                  |
| 429  | Rate limit exceeded                                         |
| 500  | Unexpected server error                                     |

The distinction between 401 and 403, and between 400 and 422, matters to clients. Use them.

Pair every non-2xx status with a specific, useful message — see [error-handling.md](./error-handling.md).

## Layered Concerns

When business logic stacks into layers, express them as a pipeline of independent steps rather than nesting inside a single handler. Each layer stays independently readable and testable, and the handler is left with the work that is actually specific to the route.

```
WRONG:   POST /v1/bank-accounts
         handler:
           if no credentials       -> respond 401
           if body invalid         -> respond 422
           if caller not permitted -> respond 403
           create the account

CORRECT: POST /v1/bank-accounts
         authenticate
      -> validate(createBankAccountSchema)
      -> authorize('bank-account:create')
      -> createBankAccount
```

Rules that apply regardless of framework:

- Order matters: authenticate before authorizing, validate before touching persistence.
- A layer should do one thing. A step that both authenticates and authorizes cannot be reused for a route that needs only one of them.

## Pagination

### Offset-Based (Simple)

```
GET /api/v1/users?page=2&per_page=20

# Implementation
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 20 OFFSET 20;
```

**Pros:** Easy to implement, supports "jump to page N"
**Cons:** Slow on large offsets (OFFSET 100000), inconsistent with concurrent inserts

### Cursor-Based (Scalable)

```
GET /api/v1/users?cursor=eyJpZCI6MTIzfQ&limit=20

# Implementation
SELECT * FROM users
WHERE id > :cursor_id
ORDER BY id ASC
LIMIT 21;  -- fetch one extra to determine has_next
```

```json
{
  "data": [...],
  "meta": {
    "has_next": true,
    "next_cursor": "eyJpZCI6MTQzfQ"
  }
}
```

**Pros:** Consistent performance regardless of position, stable with concurrent inserts
**Cons:** Cannot jump to arbitrary page, cursor is opaque

### When to Use Which

| Use Case                                | Pagination Type                         |
| --------------------------------------- | --------------------------------------- |
| Admin dashboards, small datasets (<10K) | Offset                                  |
| Infinite scroll, feeds, large datasets  | Cursor                                  |
| Public APIs                             | Cursor (default) with offset (optional) |
| Search results                          | Offset (users expect page numbers)      |

## Rate Limiting

Use rate limiting to protect public endpoints, as well as sensitive operations like resetting password, verifying email, etc

CAPTCHA is a valid method for ratelimiting.

Rate limiting must use a shared store such as Redis, a gateway, or the platform's native limiter. Do not use per-process in-memory counters for production APIs: they reset on deploy, split across replicas, and fail open in serverless or multi-instance environments.

## API Checklist

Before marking work complete:

- [ ] Route path is lowercase, plural, and hyphenated
- [ ] Correct HTTP method used (GET for reads, POST for creates, etc.)
- [ ] Route carries a version prefix
- [ ] Breaking response changes ship as a new version, not an edit to the old one
- [ ] No GET request sends a body
- [ ] Query parameters are `snake_case`; bodies are `camelCase`
- [ ] Status codes are specific, not a blanket 400
- [ ] Layered logic is expressed as a pipeline, not nested conditionals
- [ ] Collection endpoints are paginated
- [ ] Every error response carries an actionable or diagnostic message
- [ ] Response does not leak internal details (stack traces, SQL errors)
