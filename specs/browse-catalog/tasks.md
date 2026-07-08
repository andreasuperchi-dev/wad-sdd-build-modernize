# Tasks — browse-catalog

Source plan: `specs/browse-catalog/plan.md`

## Task 1 — Define duck domain types and contracts
**Goal**
Create the shared domain and DTO contracts used by repository, service, and route.

**Work**
- Add `src/domain/duck.ts` with:
  - `Duck` persisted entity type
  - `CatalogItem` response item type
  - `CatalogResult` response envelope type
  - Minimal type guards/helpers needed by repository validation

**Dependencies**
- None

**Independently committable**
- Yes (types/contracts only)

**Acceptance check**
- Type-check passes for new file (no TS errors in touched files).
- If a type-level/unit test exists for guards, `vitest` for that test file passes.

---

## Task 2 — Add and validate seed dataset
**Goal**
Provide local JSON seed data meeting story constraints.

**Work**
- Add `src/data/ducks.seed.json` with at least 10 ducks across at least 3 categories.
- Ensure each record includes required persisted fields from plan.
- Add a seed validation test (e.g., `src/data/ducks.seed.test.ts`) asserting:
  - record count >= 10
  - distinct categories >= 3
  - required fields are present and correctly typed

**Dependencies**
- Depends on Task 1

**Independently committable**
- Yes (data + validation test)

**Acceptance check**
- `vitest src/data/ducks.seed.test.ts` passes.

---

## Task 3 — Implement catalog repository (file read)
**Goal**
Load duck records from local JSON with predictable error behavior.

**Work**
- Add `src/data/catalog.repository.ts` with `CatalogRepository.getAllDucks(): Promise<Duck[]>`.
- Read from configured local JSON file path.
- Parse JSON and return duck array.
- Handle missing file / invalid JSON in a controlled, testable way.
- Add `src/data/catalog.repository.test.ts` for:
  - valid file read
  - missing file handling
  - invalid JSON handling

**Dependencies**
- Depends on Task 1
- Uses data from Task 2 for happy-path test fixtures

**Independently committable**
- Yes (repository + repository tests)

**Acceptance check**
- `vitest src/data/catalog.repository.test.ts` passes.

---

## Task 4 — Implement catalog service (filter + map)
**Goal**
Apply availability rule and produce API-safe catalog response.

**Work**
- Add `src/services/catalog.service.ts` with `CatalogService.getAvailableCatalogItems()`.
- Use repository to fetch all ducks.
- Filter records to `stock > 0` only.
- Map to `CatalogItem` fields only (`id`, `name`, `category`, `price`, `tagline`).
- Preserve input order (deterministic output).
- Return empty-state payload with friendly message when result is empty.
- Add `src/services/catalog.service.test.ts` for:
  - stock filtering
  - DTO shape mapping
  - deterministic ordering
  - explicit empty-state response

**Dependencies**
- Depends on Task 1 and Task 3

**Independently committable**
- Yes (service + service tests)

**Acceptance check**
- `vitest src/services/catalog.service.test.ts` passes.

---

## Task 5 — Implement HTTP route `GET /ducks`
**Goal**
Expose catalog service via JSON API contract.

**Work**
- Add `src/http/routes/catalog.route.ts` with handler for `GET /ducks`.
- Add/update `src/http/app.ts` to register the route.
- Route returns HTTP 200 JSON for both non-empty and empty states.
- Add `src/http/routes/catalog.route.test.ts` (integration-style) covering:
  - HTTP 200 + JSON content type
  - only available ducks returned
  - required listing fields present
  - explicit empty-state payload when no available ducks

**Dependencies**
- Depends on Task 4

**Independently committable**
- Yes (route wiring + route tests)

**Acceptance check**
- `vitest src/http/routes/catalog.route.test.ts` passes.

---

## Task 6 — Story-level acceptance sweep
**Goal**
Prove all browse-catalog acceptance criteria are covered and green together.

**Work**
- Run all tests introduced in Tasks 2–5 as a suite.
- Confirm each acceptance criterion in `spec.md` maps to at least one passing test.
- Add a short traceability note in test comments or test names if needed.

**Dependencies**
- Depends on Tasks 2, 3, 4, and 5

**Independently committable**
- Yes (verification-only changes if needed)

**Acceptance check**
- `vitest` passes for browse-catalog related tests.
- Criteria coverage is explicit in test naming/comments.

---

## Dependency summary
- Task 1 → foundation
- Task 2 → depends on 1
- Task 3 → depends on 1 (uses 2 data for happy path)
- Task 4 → depends on 1, 3
- Task 5 → depends on 4
- Task 6 → depends on 2, 3, 4, 5
