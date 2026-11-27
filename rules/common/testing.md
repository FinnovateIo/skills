# Testing

More tests is not the goal. **Meaningful** tests are the goal.

---

## When to Write a Test

Write tests for code where a mistake is plausible and expensive:

- Business logic, calculations, and decision rules
- Data transforms, parsing, and validation
- Branching logic and the edge cases that branches exist to handle
- The public contract of a module, service, or API endpoint

Do NOT write tests for:

- Trivial code: pass-through functions, getters, constants, simple wiring
- Behavior owned by a framework or library. Trust that `Array.map` and your ORM work
- Guarantees the type system already enforces
- The same behavior at multiple layers — pick the highest layer that covers it

Follow the project's existing conventions. If a project has no tests, do not introduce a test framework unless asked.

---

## Test Behavior, Not Implementation

Assert on what the code **does** — its return values, the state it leaves behind, the response it sends — not on how it does it internally.

The test for a good test: **a refactor that preserves behavior should not break it.** If renaming a private helper or reordering internal calls turns tests red, those tests are coupled to implementation and will be rewritten instead of trusted.

---

## Mock at the Boundaries, Not Everywhere

If you're mocking every module your code interacts with and then asserting against those mocks, you're mostly testing the mocks rather than your actual code. These tests can pass even when something is broken, and fail when you make perfectly valid refactoring changes.

Keep mocks focused on things that are slow, unpredictable, or outside your control:

- Network requests and third-party services
- Time, timers, and random values
- Infrastructure that isn't practical to run in tests

Everything else, including your own validators, mappers, and helper functions, should run as it normally would.

```ts
// WRONG: every collaborator is mocked; the test only proves the mocks were called
test('creates a user', async () => {
  const validator = { validate: vi.fn().mockReturnValue(true) };
  const mapper = { toEntity: vi.fn().mockReturnValue({ id: '1' }) };
  const repository = { save: vi.fn().mockResolvedValue({ id: '1' }) };

  await createUser({ validator, mapper, repository }, input);

  expect(validator.validate).toHaveBeenCalledWith(input);
  expect(mapper.toEntity).toHaveBeenCalledWith(input);
  expect(repository.save).toHaveBeenCalledWith({ id: '1' });
});

// CORRECT: real logic runs; only storage is faked; the assertion is the outcome
test('creates a user with a normalized email', async () => {
  const repository = createInMemoryUserRepository();

  const user = await createUser(repository, { email: ' Ada@Example.com ' });

  expect(user.email).toBe('ada@example.com');
  expect(await repository.findById(user.id)).toEqual(user);
});
```

Asserting that a mock was called is meaningful only when **the call is the behavior** — the email was sent, the payment was charged, the event was published.

---

## Fewer, Sharper Tests

Write one test per distinct behavior, not one test per input.

- Before adding a test, ask: _what bug would this catch that no existing test catches?_ If the answer is "none", do not write it.
- Cover the happy path, each meaningful branch, and the edge cases that actually matter (empty, boundary, invalid). Stop there.
- When several inputs exercise the same behavior, use a parameterized test (`test.each`, `pytest.mark.parametrize`, table-driven tests) instead of copy-pasted cases.

```ts
// WRONG: three tests for one behavior
test('rejects an empty password', () => { ... });
test('rejects a short password', () => { ... });
test('rejects a password with no uppercase letter', () => { ... });

// CORRECT: one behavior, a table of inputs
test.each([
  ['', 'Password is required'],
  ['Ab1', 'Password must be at least 12 characters long'],
  ['lowercase123456', 'Password must contain an uppercase letter']
])('rejects invalid password %j', (password, expectedMessage) => {
  expect(validatePassword(password)).toEqual({ isValid: false, message: expectedMessage });
});
```

---

## Keep Tests DRY

Test files follow the same DRY rules as application code. If 20 tests repeat the same 5 lines of setup, those lines belong in a helper at the top of the file.

- Extract repeated setup into factory or setup functions: `createUser(overrides)`, `renderLoginForm()`, `setupService()`
- Factories take overrides so each test states only what is different about it
- Before introducing a new helper, check relevant existing tests for similar setup or helpers that can be reused.
- Keep helpers simple and focused. Avoid branching logic or turning test helpers into their own abstraction layer.
- Don't create helpers speculatively. Wait until there's actual duplication before extracting them.

The goal is to reduce unnecessary repetition without hiding what each test is actually doing.

```ts
// WRONG: identical setup copied into every test
test('applies the loyalty discount', () => {
  const repository = createInMemoryOrderRepository();
  const pricing = createPricingService({ taxRate: 0.13 });
  const service = createOrderService(repository, pricing);
  const customer = { id: 'c1', tier: 'gold', country: 'CA' };
  const order = service.create(customer, [{ sku: 'A', price: 100 }]);

  expect(order.total).toBe(101.7);
});

// CORRECT: setup lives in one place; each test shows only what matters
const setupOrder = (customerOverrides: Partial<Customer> = {}): Order => {
  const repository = createInMemoryOrderRepository();
  const pricing = createPricingService({ taxRate: 0.13 });
  const service = createOrderService(repository, pricing);
  const customer = {
    id: 'c1',
    tier: 'standard',
    country: 'CA',
    ...customerOverrides
  };

  return service.create(customer, [{ sku: 'A', price: 100 }]);
};

test('applies the loyalty discount to gold customers', () => {
  expect(setupOrder({ tier: 'gold' }).total).toBe(101.7);
});

test('charges full price to standard customers', () => {
  expect(setupOrder().total).toBe(113);
});
```

---

## Assertions

- Assert on specific values. `toBeDefined()`, `toBeTruthy()`, and "does not throw" rarely prove anything on their own.
- Prefer one clear reason to fail per test. A test with ten unrelated assertions is several tests hiding in one.
- Avoid snapshotting large outputs as a substitute for deciding what matters. A snapshot nobody reads gets blindly updated.
- Test names describe behavior: `'rejects expired tokens'`, not `'test validateToken 3'`.

---

## Testing Checklist

Before marking work complete:

- [ ] Every test would catch a real bug that no other test catches
- [ ] Tests assert on behavior and outcomes, not internal calls
- [ ] Only external, slow, or non-deterministic dependencies are mocked
- [ ] Mock-call assertions are used only where the call is the behavior
- [ ] Input variations use parameterized tests, not copy-pasted cases
- [ ] Repeated setup is extracted into helpers at the top of the file
- [ ] No tests for trivial code, framework behavior, or coverage padding
- [ ] Bug fixes include a test that reproduces the bug
