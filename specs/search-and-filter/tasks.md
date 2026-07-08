# Tasks — search-and-filter

Source plan: `specs/search-and-filter/plan.md`

---

## Task 1 — Define `CatalogSearchQuery` and `CatalogSearchResponse` types
**Goal**
Add the domain-level types needed by both the service and the route layer.

**Work**
- Extend `src/domain/duck.ts` (or a new adjacent file) with:
  - `CatalogSearchQuery` (q, categories, minPrice, maxPrice, page, pageSize)
  - `PaginationMeta` (page, pageSize, totalItems, totalPages, hasPrev, hasNext)
  - `CatalogSearchResponse` (items, pagination, appliedFilters, message?)
  - `MatchScore` enum/const (NAME=0, TAGLINE=1, DESCRIPTION=2, NONE=3) — internal only
- Keep existing `Duck`, `CatalogItem` types unchanged.

**Dependencies**
- None

**Independently committable**
- Yes (types only)

**Acceptance check**
- TypeScript type-check passes for touched files.

---

## Task 2 — Extend catalog service with search, filter, ranking and pagination
**Goal**
Implement all query logic inside the service layer, keeping the route thin.

**Work**
- Extend `src/services/catalog.service.ts` with `searchCatalog(query: CatalogSearchQuery): Promise<CatalogSearchResponse>`:
  - baseline filter: `stock > 0`
  - free-text filter (case-insensitive) across `name`, `tagline`, `description`
  - category filter (zero categories = no filter; otherwise AND match)
  - inclusive price range filter (`minPrice` / `maxPrice`)
  - relevance ranking (name match → tagline match → description match → no query)
  - price ascending tiebreak within same relevance bucket
  - pagination (fixed page size 20; offset by page)
  - result count `totalItems` for pagination metadata
  - empty state message: "No duck matches your existential criteria."
- Extend `src/services/catalog.service.test.ts` with:
  - free-text matches name, tagline, description (case-insensitive)
  - category AND semantics (multiple categories)
  - price filter: min only, max only, both bounds
  - filter composition
  - relevance ranking order
  - price ascending tiebreak
  - pagination returns correct page + metadata
  - empty result returns message
  - `totalItems` correctness
  - "Select all" (empty categories array) = no category filter

**Dependencies**
- Depends on Task 1

**Independently committable**
- Yes (service + tests)

**Acceptance check**
- `vitest src/services/catalog.service.test.ts` passes.

---

## Task 3 — Extend `GET /ducks` route with query param parsing and validation
**Goal**
Accept search/filter/pagination query params and wire them to the service.

**Work**
- Extend `src/http/routes/catalog.route.ts`:
  - parse `q`, `category` (repeatable), `minPrice`, `maxPrice`, `page` from query string
  - normalize: trim `q`, deduplicate/trim categories, parse numbers
  - validate: `minPrice`/`maxPrice` must be valid numbers if present; `minPrice <= maxPrice` if both; `page >= 1`
  - on invalid params: return `400` with structured error payload
  - call `catalogService.searchCatalog()` with normalized query
  - return `200` with `CatalogSearchResponse`
- Extend `src/http/routes/catalog.route.test.ts`:
  - default (no params) returns paginated page 1
  - `q` param filters correctly
  - `category` param(s) filter correctly
  - `minPrice`/`maxPrice` filter correctly
  - invalid `minPrice`/`page` returns `400`
  - `minPrice > maxPrice` returns `400`
  - response shape includes `pagination` and `appliedFilters`
  - empty result response includes message

**Dependencies**
- Depends on Task 2

**Independently committable**
- Yes (route extension + tests)

**Acceptance check**
- `vitest src/http/routes/catalog.route.test.ts` passes.

---

## Task 4 — Regression: verify stories 1–4 are unaffected
**Goal**
Ensure existing browse-catalog, duck-detail, add-to-cart, and checkout tests still pass after the catalog service and route changes.

**Work**
- Run full test suite.
- Fix any unintended breakage in:
  - `catalog.service.test.ts` (pre-existing tests)
  - `catalog.route.test.ts` (pre-existing tests)
  - `duck.test.ts`, `cart.test.ts`, `order.test.ts`
  - `cart.service.test.ts`, `checkout.service.test.ts`
  - `cart.route.test.ts`, `checkout.route.test.ts`

**Dependencies**
- Depends on Tasks 1–3

**Independently committable**
- Yes (no new features; fixes only if needed)

**Acceptance check**
- `vitest` (full suite) passes with no failures.
