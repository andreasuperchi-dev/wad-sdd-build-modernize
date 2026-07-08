# Spec — duck-detail

## Problem
Customers can browse available ducks, but they cannot yet inspect one duck in depth before deciding to purchase. The system needs a JSON-first detail endpoint that returns a complete duck profile and a clear stock status.

## Users
- **Primary:** Quincy Quacker (customer)
- **Secondary:** Web/API consumers that render a duck detail view

## Scope

### In scope
- Add a JSON API endpoint `GET /ducks/:id`.
- Return complete detail data for a valid duck ID.
- Return stock status text derived from numeric stock:
  - `0` → `"Sold out"`
  - `1..2` → `"Only {stock} left"`
  - `>2` → `"In stock"`
- Return HTTP `404` for unknown IDs with a JSON error payload.
- Ensure catalog records can be referenced by ID from story 1 output (`GET /ducks` includes `id`).

### Out of scope
- Reviews.
- Related-ducks recommendations.
- UI/HTML rendering.
- Search/filter behavior.

## Functional requirements
1. The application SHALL expose `GET /ducks/:id` as a JSON endpoint.
2. For an existing duck ID, the endpoint SHALL return HTTP `200` and a full duck detail payload including:
   - `id`
   - `name`
   - `category`
   - `price`
   - `tagline`
   - `description` (long description)
   - `personalityTraits`
   - `stockStatus` (derived string)
3. `stockStatus` SHALL be computed deterministically with rules:
   - if `stock === 0`, return `"Sold out"`
   - if `stock <= 2`, return `"Only {stock} left"`
   - otherwise return `"In stock"`
4. For unknown or invalid IDs, the endpoint SHALL return HTTP `404` with a clear JSON error body, e.g. `{ "error": "Duck not found" }`.
5. The system SHALL preserve stable ID-based lookup so catalog items from story 1 can be used to request details.

## Non-functional requirements
- **Consistency:** API style must remain JSON-first and align with story 1 conventions.
- **Determinism:** The same ID and stored data always return the same payload and status text.
- **Testability:** All acceptance criteria are covered by automated `vitest` tests.
- **Simplicity:** Reuse existing local JSON storage/repository approach; no new persistence technology.

## Acceptance criteria
1. `GET /ducks/:id` with a valid ID returns `200` and JSON including full detail fields and computed `stockStatus`.
2. Stock status messages match rules exactly (`Sold out`, `Only {stock} left`, `In stock`).
3. Unknown ID returns HTTP `404` with a clear JSON error (`Duck not found`).
4. At least one test confirms details can be fetched using an ID sourced from catalog listing data.
5. All duck-detail tests pass with `vitest`.

## Open questions
- None at this stage.
