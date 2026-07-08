# Tasks — add-to-cart

Source plan: `specs/add-to-cart/plan.md`

## Task 1 — Define cart domain contracts
**Goal**
Introduce cart-specific types and validation helpers used by store/service/routes.

**Work**
- Add `src/domain/cart.ts` with:
  - `CartLine`, `Cart`, `CartItemView`, `CartView`
  - `CartError` union (`400|404|409`)
  - quantity validation helper(s) for positive integers
- Keep stories 1–2 domain contracts unchanged.

**Dependencies**
- None

**Independently committable**
- Yes (types/helpers only)

**Acceptance check**
- Type-check passes for touched files.
- If helper tests are added, `vitest` for that test file passes.

---

## Task 2 — Implement in-memory cart store
**Goal**
Provide session-keyed cart persistence in memory.

**Work**
- Add `src/data/cart.store.ts` implementing:
  - `getOrCreateCart(sessionId)`
  - `getCart(sessionId)`
  - `setItem(sessionId, duckId, quantity)`
  - `removeItem(sessionId, duckId)`
- Add `src/data/cart.store.test.ts` to verify:
  - per-session cart isolation
  - item set/update/remove behavior
  - no leakage between different session IDs

**Dependencies**
- Depends on Task 1

**Independently committable**
- Yes (store + store tests)

**Acceptance check**
- `vitest src/data/cart.store.test.ts` passes.

---

## Task 3 — Implement session helper for `sid` cookie
**Goal**
Create/reuse anonymous session IDs through HTTP-only cookies.

**Work**
- Add `src/http/session/session.ts`:
  - parse cookie header for `sid`
  - create random `sid` when missing
  - set `Set-Cookie` with `HttpOnly; SameSite=Lax`
- Add `src/http/session/session.test.ts` to verify:
  - missing cookie creates session + sets cookie
  - existing `sid` is preserved

**Dependencies**
- Depends on Task 1

**Independently committable**
- Yes (session helper + tests)

**Acceptance check**
- `vitest src/http/session/session.test.ts` passes.

---

## Task 4 — Implement cart service business logic
**Goal**
Apply cart rules, stock checks, and total calculations.

**Work**
- Add `src/services/cart.service.ts` implementing:
  - `getCart(sessionId)`
  - `addItem(sessionId, duckId, quantity?)`
  - `updateItem(sessionId, duckId, quantity)`
  - `removeItem(sessionId, duckId)`
- Integrate with existing duck data source for duck existence, pricing, and stock.
- Enforce status-mapped errors:
  - `400` invalid quantity/payload
  - `404` unknown duck
  - `409` stock exceeded
- Compute deterministic line totals and cart total.
- Add `src/services/cart.service.test.ts` covering plan scenarios.

**Dependencies**
- Depends on Tasks 1 and 2

**Independently committable**
- Yes (service + service tests)

**Acceptance check**
- `vitest src/services/cart.service.test.ts` passes.

---

## Task 5 — Expose cart HTTP routes
**Goal**
Publish cart operations via API endpoints.

**Work**
- Add `src/http/routes/cart.route.ts`:
  - `GET /cart`
  - `POST /cart/items`
  - `PATCH /cart/items/:duckId`
  - `DELETE /cart/items/:duckId`
- Use session helper to resolve/create `sid` per request.
- Map service errors to HTTP `400|404|409` JSON responses.
- Register cart route in `src/http/app.ts` without breaking existing routes.
- Add `src/http/routes/cart.route.test.ts` for endpoint behaviors and error mapping.

**Dependencies**
- Depends on Tasks 3 and 4

**Independently committable**
- Yes (route wiring + route tests)

**Acceptance check**
- `vitest src/http/routes/cart.route.test.ts` passes.

---

## Task 6 — Session continuity and isolation integration checks
**Goal**
Prove same-session persistence and different-session isolation at API level.

**Work**
- Extend `src/http/routes/cart.route.test.ts` (or add dedicated integration test) to verify:
  - same client/cookie preserves cart across multiple requests
  - different clients/cookies have isolated carts

**Dependencies**
- Depends on Task 5

**Independently committable**
- Yes (integration tests only)

**Acceptance check**
- `vitest` for cart route/integration tests passes.

---

## Task 7 — Story-level acceptance and regression sweep
**Goal**
Confirm add-to-cart acceptance criteria and ensure no regressions in stories 1–2.

**Work**
- Run all add-to-cart tests together.
- Re-run existing catalog/detail test suites.
- Validate acceptance traceability:
  - add with default quantity
  - update/remove
  - running totals
  - `409` stock conflict
  - `400` invalid input
  - `404` unknown duck
  - session continuity/isolation

**Dependencies**
- Depends on Tasks 4, 5, and 6

**Independently committable**
- Yes (verification-only changes if needed)

**Acceptance check**
- `vitest` passes for add-to-cart tests and impacted prior-story tests.

---

## Dependency summary
- Task 1 → foundation
- Task 2 → depends on 1
- Task 3 → depends on 1
- Task 4 → depends on 1, 2
- Task 5 → depends on 3, 4
- Task 6 → depends on 5
- Task 7 → depends on 4, 5, 6
