# API Design

> This file extends [security.md](./security.md), [error-handling.md](./error-handling.md) and [performance.md](./performance.md) with HTTP API conventions.

These rules describe the contract an API exposes over HTTP. They are independent of language, runtime and framework.

---

## Route Paths

- Lowercase only. Never use capital letters in a route path.
- **Singular nouns, not plural.** `/v1/user`, not `/v1/users`.
- Hyphens separate words in a path segment: `/v1/bank-account`, never `/v1/bankAccount` or `/v1/bank_account`.
- Path parameters identify a resource; they are not a place for filters.

> The singular-noun rule is deliberate and runs against the common REST convention of plural collection names. It is a house standard — do not "correct" it.

```
WRONG:   GET /v1/Users
WRONG:   GET /v1/users
WRONG:   GET /v1/bankAccounts/:id
CORRECT: GET /v1/user
CORRECT: GET /v1/bank-account/:id
```

## Versioning

Every route carries a version prefix. Versioning is what allows a breaking change to ship without breaking existing clients.

```
/v1/user
/v1/user/:id
/v1/bank-account/:id/transaction
```

- Introduce `/v2` rather than changing the shape of an existing `/v1` response.
- A new optional field is additive and does not require a version bump. Removing a field, renaming one, or changing its type does.

## GET Semantics

Filters, sorting, and pagination belong in query parameters. **Never send a body with a GET request**

```
WRONG:   GET /v1/user
         body: { "isActive": true, "role": "admin" }

CORRECT: GET /v1/user?is_active=true&role=admin
```

If a read genuinely requires a payload too large or too structured for a query string, that is a POST to a dedicated search route — not a GET with a body.

## Casing

The casing convention differs by location, and this is the rule most often violated:

| Location        | Casing                   |
| --------------- | ------------------------ |
| Route path      | `lowercase-with-hyphens` |
| Query parameter | `snake_case`             |
| Request body    | `camelCase`              |
| Response body   | `camelCase`              |

Query parameters use underscores. Capital letters in a query parameter are not acceptable; capital letters in a body are.

```
WRONG:   GET /v1/user?isActive=true&createdAfter=2026-01-01
CORRECT: GET /v1/user?is_active=true&created_after=2026-01-01
```

## Status Codes

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
WRONG:   POST /v1/bank-account
         handler:
           if no credentials       -> respond 401
           if body invalid         -> respond 422
           if caller not permitted -> respond 403
           create the account

CORRECT: POST /v1/bank-account
         authenticate
      -> validate(createBankAccountSchema)
      -> authorize('bank-account:create')
      -> createBankAccount
```

Rules that apply regardless of framework:

- Order matters: authenticate before authorizing, validate before touching persistence.
- A layer should do one thing. A step that both authenticates and authorizes cannot be reused for a route that needs only one of them.

## Collection Endpoints

Every endpoint that can return an unbounded result set must be paginated. See [performance.md](./performance.md) for pagination, bulk operations, and the prohibition on database calls inside loops.

## API Checklist

Before marking work complete:

- [ ] Route path is lowercase, singular, and hyphenated
- [ ] Route carries a version prefix
- [ ] Breaking response changes ship as a new version, not an edit to the old one
- [ ] No GET request sends a body
- [ ] Query parameters are `snake_case`; bodies are `camelCase`
- [ ] Status codes are specific, not a blanket 400
- [ ] Layered logic is expressed as a pipeline, not nested conditionals
- [ ] Collection endpoints are paginated
- [ ] Every error response carries an actionable or diagnostic message
