# Plan — browse-catalog

## Input
- Source spec: `specs/browse-catalog/spec.md`
- Open questions status: none unresolved

## Technical approach summary
Implement a small read-only catalog slice that loads ducks from a local JSON file, filters to `stock > 0`, maps to a list-safe DTO, and serves it through `GET /ducks` as JSON. Keep implementation modular to support later stories (detail, cart, search/filter).

## Data model

### Domain entity: Duck (storage shape)
Local JSON records should support current and near-future stories.

Proposed persisted fields:
- `id: string`
- `name: string`
- `category: string`
- `price: number`
- `tagline: string`
- `description: string`
- `personalityTraits: string[]`
- `stock: number`

Rationale:
- Story 1 only requires subset (`id`, `name`, `category`, `price`, `tagline`, `stock`) but full shape avoids later schema churn.

### API response model: Catalog item
For `GET /ducks` return minimal listing fields:
- `id: string`
- `name: string`
- `category: string`
- `price: number`
- `tagline: string`

### Empty-state response model
When no available ducks:
- HTTP 200
- JSON payload with explicit message, e.g.:
  - `message: string`
  - `items: []`

## Module and file layout

Planned structure under `duck-emporium/src/`:
- `domain/duck.ts`
  - duck type definitions and lightweight guards
- `data/catalog.repository.ts`
  - local JSON file reader/writer boundary (read for this story)
- `services/catalog.service.ts`
  - availability filter (`stock > 0`) + mapping to catalog DTO
- `http/routes/catalog.route.ts`
  - `GET /ducks` handler
- `http/app.ts`
  - app wiring / route registration
- `data/ducks.seed.json`
  - seed catalog (>= 10 ducks, >= 3 categories)

Planned tests (`*.test.ts` next to source):
- `data/catalog.repository.test.ts`
- `services/catalog.service.test.ts`
- `http/routes/catalog.route.test.ts`

## Public interfaces

### Repository interface
- `CatalogRepository.getAllDucks(): Promise<Duck[]>`

Responsibilities:
- Read from local JSON file path.
- Return parsed duck records.
- Surface file/parse errors in a controlled way.

### Service interface
- `CatalogService.getAvailableCatalogItems(): Promise<CatalogResult>`

Where `CatalogResult` is:
- success with items: `{ items: CatalogItem[] }`
- explicit empty state: `{ items: []; message: string }`

Responsibilities:
- Enforce `stock > 0` rule.
- Preserve deterministic order as stored.
- Map domain entity to listing DTO.

### HTTP route contract
- `GET /ducks`
- Response `200 application/json`:
  - non-empty: `{ items: CatalogItem[] }`
  - empty: `{ items: []; message: string }`

## External dependencies
- Runtime framework: Express (recommended for this workshop)
- Node built-ins (`node:fs/promises`, `node:path`, `node:url`) for local file access
- Test runner: `vitest`
- Optional test helper for HTTP assertions (choose one):
  - `supertest` (if using Express)

No database, no external APIs, no payment provider.

## Testing strategy

### Unit tests
1. Repository tests
   - Reads valid JSON file into duck array.
   - Handles missing/invalid JSON predictably.
2. Service tests
   - Filters out `stock <= 0`.
   - Maps to required catalog fields only.
   - Returns explicit empty-state payload when no available ducks.

### Route/integration tests
3. `GET /ducks` returns `200` + JSON content type.
4. Response contains only available ducks.
5. Response item shape includes required listing fields.
6. Empty catalog case returns friendly message and empty items array.
7. Seed data validation test ensures at least 10 ducks across at least 3 categories.

### Determinism check
8. Same input dataset returns same ordered output.

## Risks and mitigations
- **Risk:** Ambiguous empty-state payload shape could break later consumers.
  - **Mitigation:** lock response contract in route tests.
- **Risk:** Data file path resolution differs across test/runtime contexts.
  - **Mitigation:** inject/configure data file path and cover with tests.
- **Risk:** Invalid seed data (missing fields/types) causes runtime issues.
  - **Mitigation:** add basic schema guard and seed validation tests.
- **Risk:** Future stories need richer fields than listing DTO.
  - **Mitigation:** persist fuller duck entity now, expose minimal DTO for catalog.
- **Risk:** Over-engineering story 1.
  - **Mitigation:** keep modules thin and focused on read-only catalog flow.
