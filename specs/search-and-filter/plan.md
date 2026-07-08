# Plan — search-and-filter

## Input
- Source spec: `specs/search-and-filter/spec.md`
- Open questions status: resolved during clarification
  - Filters layout: sticky sidebar
  - Results count: show count above results
  - Category “Select all”: equivalent to no category filter
  - Filter restore on return: yes, via URL query params
  - Search debounce: yes, 300ms on client input

## Technical approach summary
Add query-based catalog search/filter on top of the existing catalog flow. Implement filtering and ranking in the catalog service, expose them through `GET /ducks` query params, and return paginated results with metadata for UI rendering. Keep all filter state in URL query params so pagination and browser navigation naturally preserve state.

## Data model

### Existing models reused
- `Duck` domain entity (id, name, category, price, tagline, description/longDescription, stock)
- Seed-backed catalog repository from local JSON

### New request query model
`CatalogSearchQuery` (parsed from URL query params):
- `q?: string` (free text)
- `categories?: string[]` (0..n categories)
- `minPrice?: number`
- `maxPrice?: number`
- `page?: number` (default `1`)
- `pageSize?: number` (fixed to `20` for this story)

Validation/normalization rules:
- `q` trimmed; empty becomes undefined
- categories deduplicated, trimmed, case-normalized for matching
- `minPrice`/`maxPrice` must be valid numbers if present
- if both bounds exist, enforce `minPrice <= maxPrice`
- invalid query values return `400` with structured error payload

### New response model
`CatalogSearchResponse`:
- `items: CatalogItem[]`
- `pagination: { page: number; pageSize: number; totalItems: number; totalPages: number; hasPrev: boolean; hasNext: boolean }`
- `appliedFilters: { q?: string; categories: string[]; minPrice?: number; maxPrice?: number }`
- `message?: string` (empty state friendly copy)

### Ranking metadata (internal only)
`MatchScore` (not exposed in API):
- `0`: exact/strong name match
- `1`: tagline match
- `2`: description match
- `3`: no free-text query (neutral)
Sort by `(score ASC, price ASC, stable original order)`.

## Module and file layout

Under `duck-emporium/src/`:

- `services/catalog.service.ts` (extend)
  - add search/filter composition
  - add relevance scoring and sorting
  - add pagination and results count metadata

- `services/catalog.service.test.ts` (extend)
  - unit tests for composition, ranking, pagination, edge cases

- `http/routes/catalog.route.ts` (extend)
  - parse/validate query params
  - map service result to `200`
  - map invalid query to `400`

- `http/routes/catalog.route.test.ts` (extend)
  - route-level behavior for query params and response contract

- `domain/duck.ts` (optional small extension)
  - if needed, add helper types for searchable fields

No new persistence files required.

## Public interfaces

### Service interface extension
`CatalogService.searchCatalog(query: CatalogSearchQuery): Promise<CatalogSearchResponse>`

Responsibilities:
- apply `stock > 0` baseline filter
- apply free-text filter across name, tagline, description (case-insensitive)
- apply category filter (AND semantics, matching all selected categories)
- apply inclusive price range filter
- apply ranking + stable tiebreakers
- paginate at fixed page size `20`
- produce `totalItems` for “X results found” UI

### HTTP contract extension
`GET /ducks`

Supported query params:
- `q`
- `category` (repeatable) or `categories` (comma-separated) — choose one normalized server-side format and document in tests
- `minPrice`
- `maxPrice`
- `page`

Response:
- `200` with `CatalogSearchResponse`
- empty results include message: "No duck matches your existential criteria."
- `400` on invalid query parameters

## External dependencies
- No new runtime dependencies required
- Continue using current stack:
  - `express`
  - `vitest`
  - `supertest`
  - Node built-ins
- Debounce (`300ms`) is a frontend behavior; backend remains stateless and query-driven

## Testing strategy

### Unit tests (`services/catalog.service.test.ts`)
1. Free-text matches `name`, `tagline`, `description`, case-insensitive
2. Category filtering with multiple categories uses AND semantics
3. Price filtering supports min only, max only, and min+max
4. Filter composition applies all criteria together
5. Ranking order: name matches before tagline before description
6. Price ascending tiebreak for same relevance bucket
7. Stable ordering for complete ties
8. Pagination returns 20 items per page with correct metadata
9. Empty result returns friendly message
10. Result count (`totalItems`) is correct

### Route tests (`http/routes/catalog.route.test.ts`)
11. `GET /ducks` with no filters returns paginated default page
12. Query params are parsed and forwarded correctly
13. Invalid `minPrice`, `maxPrice`, `page`, or range returns `400`
14. Filters preserved through query params across page changes
15. Response includes `pagination` and `appliedFilters`

### Regression tests
16. Existing browse-catalog behavior still works for default (no-query) access
17. Existing duck-detail/cart stories are unaffected by catalog changes

## Risks and mitigations
- **Risk:** Ambiguity in category query format (`category` vs `categories`).
  - **Mitigation:** standardize one accepted format and lock with route tests.
- **Risk:** Ranking rules may be interpreted inconsistently.
  - **Mitigation:** explicit scoring table + deterministic unit tests.
- **Risk:** Performance degradation as catalog size grows.
  - **Mitigation:** single-pass filtering where possible and bounded pagination output.
- **Risk:** Confusing “Select all” behavior.
  - **Mitigation:** treat as no category filter and reflect clearly in `appliedFilters`.
- **Risk:** Backend/frontend mismatch on debounce expectations.
  - **Mitigation:** document debounce as client-only; backend remains request-driven.
