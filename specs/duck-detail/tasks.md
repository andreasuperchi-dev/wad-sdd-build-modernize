# Tasks — duck-detail

Source plan: `specs/duck-detail/plan.md`

## Task 1 — Define detail domain contracts
**Goal**
Add type contracts for duck detail responses and not-found result.

**Work**
- Update `src/domain/duck.ts` with:
  - `DuckDetailItem`
  - `DuckDetailResult` (`{ duck: DuckDetailItem } | { error: "Duck not found" }`)
  - stock status type (`"Sold out" | "In stock" | `Only ${number} left``)
- Keep existing Story 1 list contracts intact.

**Dependencies**
- None

**Independently committable**
- Yes (types only)

**Acceptance check**
- Type-check passes for touched files.

---

## Task 2 — Implement detail lookup and stock-status mapping in service
**Goal**
Provide deterministic detail retrieval by ID and stock status derivation logic.

**Work**
- Update `src/services/catalog.service.ts`:
  - add `getDuckDetailById(id: string)`
  - locate duck by ID from repository data
  - map to full detail DTO with `stockStatus`
  - return `{ error: "Duck not found" }` when ID is unknown
- Add/extend `src/services/catalog.service.test.ts` for:
  - valid ID returns full detail payload
  - stock status boundaries (`0`, `1`, `2`, `3+`)
  - unknown ID returns not-found result
  - detail lookup using an ID present in catalog data shape

**Dependencies**
- Depends on Task 1

**Independently committable**
- Yes (service + service tests)

**Acceptance check**
- `vitest src/services/catalog.service.test.ts` passes.

---

## Task 3 — Expose `GET /ducks/:id` route
**Goal**
Publish detail endpoint with 200/404 JSON behavior.

**Work**
- Update `src/http/routes/catalog.route.ts`:
  - add `GET /ducks/:id`
  - call service detail method
  - return `200` for found duck and `404` with `{ "error": "Duck not found" }` otherwise
- Ensure route registration keeps `GET /ducks` behavior unchanged.
- Add/extend `src/http/routes/catalog.route.test.ts` for:
  - valid ID: `200` + expected detail JSON fields
  - unknown ID: `404` + error payload
  - stockStatus mapping observable at route level

**Dependencies**
- Depends on Task 2

**Independently committable**
- Yes (route + route tests)

**Acceptance check**
- `vitest src/http/routes/catalog.route.test.ts` passes.

---

## Task 4 — Story-level regression and acceptance sweep
**Goal**
Confirm duck-detail acceptance criteria and no Story 1 regressions.

**Work**
- Run duck-detail service and route tests together.
- Re-run existing Story 1 route/service tests to ensure `GET /ducks` remains green.
- Validate acceptance traceability:
  - valid detail response fields
  - deterministic stockStatus rules
  - unknown ID returns `404` + JSON error
  - detail lookup using catalog ID

**Dependencies**
- Depends on Tasks 2 and 3

**Independently committable**
- Yes (verification-only changes if needed)

**Acceptance check**
- `vitest` passes for duck-detail and impacted browse-catalog tests.

---

## Dependency summary
- Task 1 → foundation
- Task 2 → depends on 1
- Task 3 → depends on 2
- Task 4 → depends on 2, 3
