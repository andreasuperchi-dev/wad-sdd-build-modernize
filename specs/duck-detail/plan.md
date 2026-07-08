# Plan — duck-detail

## Input
- Source spec: `specs/duck-detail/spec.md`
- Open questions status: none unresolved

## Technical approach summary
Extend the existing Story 1 architecture by adding a detail query path on top of the same local JSON-backed repository. Introduce a detail DTO and stock-status formatter in the service layer, then expose `GET /ducks/:id` via Express route handling with explicit `404` JSON for unknown IDs.

## Data model

### Existing persisted model (unchanged)
`Duck` entity already persisted in local JSON:
- `id`
- `name`
- `category`
- `price`
- `tagline`
- `description`
- `personalityTraits`
- `stock`

### New API response model: Duck detail item
For `GET /ducks/:id`, add a detail DTO (service/contract level):
- `id: string`
- `name: string`
- `category: string`
- `price: number`
- `tagline: string`
- `description: string`
- `personalityTraits: string[]`
- `stockStatus: "Sold out" | "In stock" | `Only ${number} left``

### Error response model
For unknown/invalid IDs:
- HTTP `404`
- JSON body: `{ "error": "Duck not found" }`

## Module and file layout

Existing files reused/extended in `duck-emporium/src/`:
- `domain/duck.ts`
  - add detail response type(s) and stock-status union/helper signature if needed
- `data/catalog.repository.ts`
  - optionally add `getDuckById(id)` convenience method (or keep `getAllDucks()` and find in service)
- `services/catalog.service.ts`
  - add detail query + stock-status derivation logic
- `http/routes/catalog.route.ts`
  - add `GET /ducks/:id` route with `404` handling

New/updated test files:
- `services/catalog.service.test.ts` (extend for detail behaviors)
- `http/routes/catalog.route.test.ts` (extend for detail route behaviors)
- optional: `data/catalog.repository.test.ts` (only if repository API changes)

## Public interfaces

### Repository interface options
Preferred minimal change option:
- Keep existing `getAllDucks(): Promise<Duck[]>`
- Perform ID lookup in service

Alternative (if clarity outweighs extra API surface):
- Add `getDuckById(id: string): Promise<Duck | null>`

### Service interface additions
Add method:
- `CatalogService.getDuckDetailById(id: string): Promise<DuckDetailResult>`

`DuckDetailResult`:
- success: `{ duck: DuckDetailItem }`
- not found: `{ error: "Duck not found" }`

Stock status helper contract:
- `toStockStatus(stock: number): string`
- rules:
  - `0` => `"Sold out"`
  - `1..2` => `"Only {stock} left"`
  - `>2` => `"In stock"`

### HTTP route contract
- `GET /ducks/:id`
- Success (`200`):
  - `{ duck: DuckDetailItem }` (or bare object if aligned with existing API style; lock choice in tests)
- Not found (`404`):
  - `{ "error": "Duck not found" }`

## External dependencies
- No new runtime dependencies required.
- Continue using:
  - `express`
  - `vitest`
  - `supertest`
  - Node built-ins / existing TypeScript setup

## Testing strategy

### Service tests
Add/extend tests to cover:
1. Valid ID returns full detail payload fields.
2. `stockStatus` mapping for boundaries:
   - `0` -> `Sold out`
   - `1` -> `Only 1 left`
   - `2` -> `Only 2 left`
   - `3+` -> `In stock`
3. Unknown ID yields not-found result.
4. Detail lookup succeeds using an ID present in catalog-style data (traceability to Story 1).

### Route/integration tests
Add/extend tests for `GET /ducks/:id`:
5. Valid ID returns `200` + JSON with required detail fields.
6. Unknown ID returns `404` + `{ "error": "Duck not found" }`.
7. Response stockStatus string matches deterministic rules.

### Regression safety
8. Existing `GET /ducks` tests must remain green (no regressions from route extension).

## Risks and mitigations
- **Risk:** Inconsistent response shape between list and detail endpoints.
  - **Mitigation:** define detail response contract clearly and lock with route tests.
- **Risk:** Route conflict/order issues between `/ducks` and `/ducks/:id`.
  - **Mitigation:** keep deterministic route registration and add integration tests for both paths.
- **Risk:** Ambiguity around unknown vs malformed IDs.
  - **Mitigation:** treat non-matching IDs uniformly as `404` for current scope.
- **Risk:** Stock status phrasing drift.
  - **Mitigation:** centralize mapping logic in one helper and test all boundary values.
- **Risk:** Breaking Story 1 behavior while extending shared service.
  - **Mitigation:** run Story 1 route/service tests in the story test suite after changes.
