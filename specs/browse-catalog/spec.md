# Spec — browse-catalog

## Problem
Customers need a simple way to discover what ducks are currently purchasable before navigating to details or adding to cart. The system must expose a stable, JSON-first catalog endpoint that other stories can build on.

## Users
- **Primary:** Quincy Quacker (customer)
- **Secondary:** Frontend/API consumers that will use the catalog data in later stories

## Scope

### In scope
- Expose a JSON catalog endpoint at `GET /ducks`.
- Return only ducks with `stock > 0` (currently available ducks).
- Source catalog data from a local JSON file.
- Seed at least 10 ducks across at least 3 categories.
- Return list items with the minimum required fields: `id`, `name`, `category`, `price`, `tagline`.
- Return an explicit empty-state response when no ducks are available.

### Out of scope
- Pagination.
- Images/media.
- Sorting controls.
- Search/filter logic (story 5).
- HTML rendering/server-side templating for this story.

## Functional requirements
1. The application SHALL provide `GET /ducks` as a JSON endpoint.
2. The endpoint SHALL read catalog records from a local JSON storage file.
3. The endpoint SHALL include only records where `stock` is a number greater than `0`.
4. Each returned duck SHALL include at least:
   - `id` (string)
   - `name` (string)
   - `category` (string)
   - `price` (number, major currency units)
   - `tagline` (string)
5. The seed dataset SHALL contain at least 10 ducks across at least 3 distinct categories.
6. If no ducks are available (`stock > 0` yields none), the endpoint SHALL return a successful response with an explicit empty state message (not a blank/implicit empty payload).
7. The endpoint SHALL be deterministic for a given stored dataset (same input file content => same output content/order).

## Non-functional requirements
- **Stack alignment:** TypeScript, Node 20+, ES modules.
- **Simplicity:** Local file-based storage; no external services.
- **Testability:** Acceptance criteria must be covered by automated tests (`vitest`).
- **Reliability:** Invalid/missing data file behavior should be handled predictably in implementation and tests.
- **Performance:** Suitable for a small workshop-sized catalog; no optimization requirements beyond straightforward file read for this story.

## Acceptance criteria
1. `GET /ducks` returns HTTP 200 and JSON.
2. Response contains only ducks with `stock > 0`.
3. Every item in the response includes `name`, `category`, `price`, and `tagline` (and `id` for referential continuity into later stories).
4. Seed data exists with at least 10 ducks and at least 3 categories.
5. If all ducks are unavailable (or dataset empty after availability filter), response is HTTP 200 with an explicit friendly empty-state message.
6. At least one automated test validates each criterion above.

## Open questions
- None for this story at this stage.
