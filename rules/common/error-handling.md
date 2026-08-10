# Error Handling

Proper error handling is paramount. An application is judged by what it does when things go wrong, and most production incidents are diagnosed through the errors the system surfaces.

---

## Every Error Is Actionable or Diagnostic

A user-facing error must be one of two things:

**Actionable** — the user can read it and fix the problem themselves.

> "Your password must contain an uppercase letter."

**Diagnostic** — the user cannot fix it, but the message carries enough specificity that a developer can locate the failure from a ticket alone.

> "Something went wrong while creating your profile data during registration."

An error that is neither is a defect. A generic "oops, something went wrong" as a general-purpose response tells the user nothing and tells the developer nothing, which turns every report into an investigation from zero.

```
WRONG:   "An error occurred."
WRONG:   "Invalid input."
CORRECT: "Your password must be at least 12 characters long."
CORRECT: "We could not verify your bank account because the routing number was rejected by our provider."
```

Specificity is the requirement. Never expose internals in the process — see [security.md](./security.md) for what must never appear in an error message.

---

## Never Mask API Errors Client-Side

**This is not negotiable.** When an API returns a response that explains what went wrong, the client surfaces that explanation. Consuming a specific, well-formed error and replacing it with a generic string is prohibited.

The damage compounds:

- At best, the user loses the information they needed to correct their own mistake.
- At worst, a masked error reads as a _different_ error. A validation failure presented as a network problem sends the user, and later the developer, down entirely the wrong path.
- Real-world troubleshooting becomes guesswork, because the message in the bug report never existed on the server.

```js
// WRONG: the server explained the problem, the client threw it away
try {
  await api.post('/v1/user', payload);
} catch (error) {
  showToast('Something went wrong. Please try again.');
}

// CORRECT: surface what the server said, fall back only when there is nothing to surface
try {
  await api.post('/v1/user', payload);
} catch (error) {
  showToast(getApiErrorMessage(error));
}
```

The fallback exists for the case where the response genuinely carries no usable message — a network failure, a timeout, a gateway error. It is a last resort, not the default path.

```js
function getApiErrorMessage(error) {
  const message = error?.response?.data?.message;

  if (message) {
    return message;
  }

  return 'We could not reach the server. Please check your connection and try again.';
}
```

Reshaping a server message for tone or localization is fine. Discarding its meaning is not.

---

## The Catch-All 500

A generic message **is** correct for genuinely unexpected failures — a database transaction that rolled back, a null dereference, a dependency that returned something impossible. The user should not see internals, and there is nothing actionable to tell them.

```
"Something went wrong on our end. Please try again."
```

This carries one non-negotiable condition: **it must be logged.** Write it to the server's stdout through the project's logging infrastructure, with the stack trace and enough request context to reconstruct what happened. Sentry or an equivalent error tracker is strongly preferred over raw stdout.

An unexpected error that is swallowed without logging is completely unacceptable.

- Log the full error, including the stack and the original cause.
- Include correlation context: request id, user id, route, and relevant parameters.
- Never log secrets, tokens, or the sensitive payloads described in [security.md](./security.md).
- Return the generic message to the user and the specific detail to the log

---

## Catch Every Exception, Somewhere

Every exception must be caught — immediately, or somewhere along the call stack. An uncaught exception is a crash.

- Catch where the error can actually be handled. A `catch` that only rethrows an identical error adds nothing.
- Do not catch to silence. Swallowing an error is acceptable only when the failure is genuinely expected and the recovery is deliberate — and it warrants a comment saying so.
- Preserve context when rethrowing. The original error is the useful part; wrapping must not discard it.
- Let unexpected errors reach a top-level handler that logs them and returns the catch-all response.

Language-specific mechanics — treating caught errors as `unknown`, narrowing safely, and chaining `Error` causes — are in [../typescript/coding-style.md](../typescript/coding-style.md).

---

## Error Handling Checklist

Before marking work complete:

- [ ] Every user-facing error is actionable or diagnostic, never generic filler
- [ ] No API error message is discarded or replaced client-side
- [ ] Unexpected errors return a generic response **and** are logged with full context
- [ ] Error messages expose no internals, stack traces, or configuration values
- [ ] Every exception is caught somewhere along the call stack
- [ ] Rethrown errors preserve the original cause
- [ ] No error is swallowed without a deliberate, commented reason
