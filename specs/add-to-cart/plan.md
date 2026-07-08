# Plan — add-to-cart

## Input
- Source spec: `specs/add-to-cart/spec.md`
- Open questions status: none unresolved

## Technical approach summary
Add a session-scoped cart subsystem on top of the existing catalog/detail stack. Use an anonymous `sid` cookie to identify the current cart, store cart state in an in-memory store keyed by `sid`, and expose cart CRUD operations through JSON endpoints. Keep stock validation authoritative by checking against catalog data on add/update operations.

## Data model

### Session
- `sid: string` (opaque random identifier)
- Transport: HTTP cookie (`HttpOnly`, `SameSite=Lax`)
- Lifecycle: created lazily on first cart interaction when missing

### Cart storage model (server-side, in-memory)
- `Map<string, Cart>` keyed by `sid`

`Cart`:
- `items: Map<string, CartLine>` keyed by `duckId`

`CartLine`:
- `duckId: string`
- `quantity: number`

### Computed/cart response model
`CartItemView`:
- `duckId: string`
- `name: string`
- `unitPrice: number`
- `quantity: number`
- `lineTotal: number`

`CartView`:
- `items: CartItemView[]`
- `total: number`

### Error model
- `400`: invalid payload/quantity
- `404`: duck not found
- `409`: quantity exceeds stock
- Body shape: `{ "error": string }`

## Module and file layout

Extend `duck-emporium/src/` with focused modules:

- `domain/cart.ts`
  - cart-related types (`Cart`, `CartLine`, `CartItemView`, `CartView`)
  - optional quantity validation helpers

- `data/cart.store.ts`
  - in-memory cart store abstraction
  - get/create cart by `sid`
  - upsert/remove line item operations

- `http/session/session.ts`
  - session ID creation/parsing utilities
  - cookie read/write helpers (`sid`)

- `services/cart.service.ts`
  - business logic for add/update/remove/get cart
  - stock validation against catalog repository/service
  - total/lineTotal calculation

- `http/routes/cart.route.ts`
  - `GET /cart`
  - `POST /cart/items`
  - `PATCH /cart/items/:duckId`
  - `DELETE /cart/items/:duckId`

- `http/app.ts`
  - register cart routes (keep existing routes unchanged)

## Public interfaces

### Cart store interface
- `getOrCreateCart(sessionId: string): Cart`
- `getCart(sessionId: string): Cart | undefined`
- `setItem(sessionId: string, duckId: string, quantity: number): void`
- `removeItem(sessionId: string, duckId: string): void`

### Session interface
- `getOrCreateSessionId(request, response): string`
  - reads `sid` from cookie
  - creates and sets cookie when missing

### Cart service interface
- `getCart(sessionId: string): Promise<CartView>`
- `addItem(sessionId: string, duckId: string, quantity?: number): Promise<CartView | CartError>`
- `updateItem(sessionId: string, duckId: string, quantity: number): Promise<CartView | CartError>`
- `removeItem(sessionId: string, duckId: string): Promise<CartView>`

Where `CartError` includes:
- `{ status: 400; error: string }`
- `{ status: 404; error: string }`
- `{ status: 409; error: string }`

### Route contracts
- `GET /cart` → `200` + `CartView`
- `POST /cart/items` body `{ duckId: string; quantity?: number }`
  - success `200` + `CartView`
  - errors `400|404|409`
- `PATCH /cart/items/:duckId` body `{ quantity: number }`
  - success `200` + `CartView`
  - errors `400|404|409`
- `DELETE /cart/items/:duckId`
  - success `200` + `CartView`

## External dependencies
- No required new runtime dependencies.
- Use existing stack:
  - `express`
  - `vitest`
  - `supertest`
- Cookie handling can be implemented without `cookie-parser` (manual parse/set) to keep dependency surface small.

## Testing strategy

### Unit tests
1. `cart.service.test.ts`
   - add with default quantity `1`
   - add increments existing quantity
   - update quantity behavior
   - remove item behavior
   - stock conflict -> `409`
   - invalid quantity -> `400`
   - unknown duck -> `404`
   - line totals and cart total calculations

2. `session.test.ts` (or equivalent)
   - creates `sid` when missing
   - preserves provided `sid`

3. `cart.store.test.ts`
   - isolates carts by session ID
   - per-session item mutations do not leak

### Route/integration tests (`cart.route.test.ts`)
4. `GET /cart` returns empty cart + total `0` for new session.
5. `POST /cart/items` default quantity path.
6. `PATCH /cart/items/:duckId` updates quantity.
7. `DELETE /cart/items/:duckId` removes item.
8. error mapping assertions for `400`, `404`, `409`.
9. same client cookie preserves cart across requests.
10. separate clients (different cookies) have isolated carts.

### Regression checks
11. Existing catalog/detail tests remain green.

## Risks and mitigations
- **Risk:** Session cookie parsing bugs create cart duplication.
  - **Mitigation:** centralize session helper + dedicated tests.
- **Risk:** In-memory store causes data loss on restart (expected but surprising).
  - **Mitigation:** document explicitly in API behavior and spec acceptance.
- **Risk:** Stock checks become stale under concurrent updates.
  - **Mitigation:** enforce stock check on every add/update request and keep logic centralized.
- **Risk:** Route behavior inconsistency with existing API conventions.
  - **Mitigation:** keep consistent JSON envelopes and error body shape.
- **Risk:** Floating-point rounding drift in totals.
  - **Mitigation:** keep deterministic currency handling strategy (consistent numeric arithmetic and tests for expected totals).
