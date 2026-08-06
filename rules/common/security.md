# Security Guidelines

## Mandatory Security Checks

Before **any** commit, verify:

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs are validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize rendered HTML)
- [ ] CSRF protection enabled where applicable
- [ ] Authentication and authorization verified
- [ ] Rate limiting applied to public endpoints
- [ ] Sensitive data is encrypted or tokenized where appropriate
- [ ] Error messages do not expose sensitive information or implementation details
- [ ] All exceptions are handled appropriately
- [ ] Unexpected errors are logged

---

## Secret Management

- Never hardcode secrets in source code.
- Store secrets in environment variables or a secret manager.
- Validate required secrets during application startup.
- Rotate any secrets that may have been exposed.

---

## Sensitive Data

- Minimize the amount of sensitive data that passes through your backend.
- When possible, use direct uploads (for example, pre-signed URLs) instead of proxying files through the backend.
- Never allow payment card information to pass through your backend unless your system is explicitly designed and compliant to handle it.
- Encrypt sensitive data at rest.
- Prefer storing access tokens or references instead of raw sensitive information.

---

## API Security

- Validate and sanitize all request input.
- Use parameterized queries for all database access.
- Apply authorization checks on every protected endpoint.
- Use appropriate HTTP status codes.
- User-facing error messages should be specific enough to resolve the issue but must never expose:
  - Internal implementation details
  - Database technology
  - Stack traces
  - Resource identifiers that should remain private
  - Secrets or configuration values
- Log unexpected server-side errors for investigation.

See [error-handling.md](./error-handling.md) for how to write error messages that are specific enough to be useful without leaking any of the above.

---

## Resource Protection

- Avoid database or external API calls inside loops that could be abused to create denial-of-service conditions.
- Paginate large result sets.
- Stream large file uploads and downloads instead of loading them entirely into memory.
- Delegate long-running work to background workers where appropriate.

---

## Security Response Protocol

If a security issue is discovered:

1. Stop development immediately.
2. Assess the severity.
3. Fix all critical vulnerabilities before continuing.
4. Alert the user that they MUST rotate exposed credentials. Do NOT attempt to do this yourself.
5. Review the codebase for similar vulnerabilities.
6. Add or update tests to prevent regressions.
