# Tasks — checkout

Source plan: `specs/checkout/plan.md`

## Task 1 — Define order and checkout domain contracts
**Goal**
Add domain-level types for checkout input, order records, confirmation payloads, and checkout result errors.

**Work**
- Add `src/domain/order.ts` containing:
  - `CheckoutRequest`
  - `OrderItem`
  - `OrderRecord`
  - `CheckoutConfirmation`
  - `CheckoutResult` unions for `201`, `400`, `409`
- Define validation-related field error typing.
- Keep existing stories 1–3 domain contracts unchanged.

**Dependencies**
- None

**Independently committable**
- Yes (types/contracts only)

**Acceptance check**
- Type-check passes for touched files.
- If type/helper tests are added, `vitest` for those files passes.

---

## Task 2 — Implement orders JSON repository
**Goal**
Persist orders in local JSON file with restart-safe behavior.

**Work**
- Add `src/data/orders.repository.ts` with:
  - `getAllOrders()`
  - `appendOrder(order)`
- Handle file bootstrap (missing file -> initialized list).
- Validate parsed order collection shape before use.
- Add `src/data/orders.repository.test.ts` covering:
  - append + read
  - missing file initialization
  - persistence across repository re-instantiation

**Dependencies**
- Depends on Task 1

**Independently committable**
- Yes (repository + tests)

**Acceptance check**
- `vitest src/data/orders.repository.test.ts` passes.

---

## Task 3 — Extend catalog repository for atomic stock decrement
**Goal**
Support all-or-nothing stock decrement needed by checkout.

**Work**
- Extend `src/data/catalog.repository.ts` with atomic stock update API for multiple lines.
- Ensure operation:
  - validates all requested lines before writing
  - applies all decrements together or none
  - persists updated ducks JSON only on full success
- Extend `src/data/catalog.repository.test.ts` with:
  - successful multi-line decrement
  - conflict path with no partial writes

**Dependencies**
- Depends on Task 1

**Independently committable**
- Yes (repository extension + tests)

**Acceptance check**
- `vitest src/data/catalog.repository.test.ts` passes.

---

## Task 4 — Implement checkout service orchestration
**Goal**
Implement end-to-end checkout business logic and validation.

**Work**
- Add `src/services/checkout.service.ts` implementing `checkout(sessionId, payload)`.
- Include strong validation for:
  - `shippingName`, `email`, `address`, `cardNumber`
  - strict email regex + length constraints
  - trimmed inputs and field error reporting
- Integrate with cart store/service to read current session cart.
- Return `400` for invalid payload or empty cart.
- Re-validate stock and return `409` on conflicts.
- On success, perform orchestration:
  1) atomic stock decrement
  2) order record creation + persistence
  3) cart clear
  4) confirmation return (`201`)
- Ensure raw card number is not persisted in orders.
- Add `src/services/checkout.service.test.ts` covering plan scenarios.

**Dependencies**
- Depends on Tasks 1, 2, and 3

**Independently committable**
- Yes (service + tests)

**Acceptance check**
- `vitest src/services/checkout.service.test.ts` passes.

---

## Task 5 — Expose `POST /checkout` route
**Goal**
Publish checkout endpoint and map service results to HTTP responses.

**Work**
- Add `src/http/routes/checkout.route.ts` with `POST /checkout`.
- Resolve current `sid` using existing session helper.
- Map service results:
  - `201` confirmation
  - `400` validation/cart errors
  - `409` stock conflict
- Register route in `src/http/app.ts` without breaking existing routes.
- Add `src/http/routes/checkout.route.test.ts` for:
  - happy path `201`
  - validation `400`
  - empty-cart `400`
  - stock conflict `409`
  - session-scoped behavior

**Dependencies**
- Depends on Task 4

**Independently committable**
- Yes (route + tests)

**Acceptance check**
- `vitest src/http/routes/checkout.route.test.ts` passes.

---

## Task 6 — Story-level acceptance and regression sweep
**Goal**
Confirm checkout acceptance criteria and preserve stories 1–3 behavior.

**Work**
- Run checkout tests (repository/service/route) as a suite.
- Re-run prior story tests for catalog, detail, and cart.
- Validate acceptance traceability:
  - checkout success confirmation (`201`)
  - strict validation failures (`400`)
  - empty cart (`400`)
  - stock conflict all-or-nothing (`409`)
  - stock decremented + order persisted + cart cleared on success
  - no real payment integration

**Dependencies**
- Depends on Tasks 2, 3, 4, and 5

**Independently committable**
- Yes (verification-only changes if needed)

**Acceptance check**
- `vitest` passes for checkout tests and impacted earlier story tests.

---

## Dependency summary
- Task 1 → foundation
- Task 2 → depends on 1
- Task 3 → depends on 1
- Task 4 → depends on 1, 2, 3
- Task 5 → depends on 4
- Task 6 → depends on 2, 3, 4, 5
