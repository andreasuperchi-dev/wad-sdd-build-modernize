# Plan — checkout

## Input
- Source spec: `specs/checkout/spec.md`
- Open questions status: none unresolved

## Technical approach summary
Implement `POST /checkout` as a session-scoped transaction-like workflow on top of existing cart/session/catalog modules. The checkout service validates payload, loads cart by `sid`, re-validates stock against current catalog, performs an atomic local-file update for catalog stock and order persistence, clears cart on success, and returns a `201` confirmation payload.

## Data model

### Existing models reused
- `Duck` from catalog storage (`src/data/ducks.seed.json`)
- Session cart state keyed by `sid` (in-memory cart store)

### New checkout input model
`CheckoutRequest`:
- `shippingName: string`
- `email: string`
- `address: string`
- `cardNumber: string` (mocked; non-empty only)

Validation constraints (to lock in tests):
- `shippingName`: trimmed, required, min/max length (e.g. 2..100)
- `address`: trimmed, required, min/max length (e.g. 5..250)
- `email`: trimmed, required, max length (e.g. <=254), strong regex format
- `cardNumber`: trimmed, required non-empty string (no real payment checks)

### New order persistence model
`OrderRecord` persisted in local JSON file (`src/data/orders.json`):
- `orderId: string`
- `createdAt: string` (ISO timestamp)
- `shippingName: string`
- `email: string`
- `address: string`
- `items: OrderItem[]`
- `total: number`

`OrderItem`:
- `duckId: string`
- `name: string`
- `unitPrice: number`
- `quantity: number`
- `lineTotal: number`

### Checkout response model
`CheckoutConfirmation`:
- `orderId: string`
- `createdAt: string`
- `items: OrderItem[]`
- `total: number`

### Error model
- `400` validation/cart-empty errors: `{ error: string; fieldErrors?: Record<string, string> }`
- `409` stock conflict: `{ error: string }`

## Module and file layout

Add/extend under `duck-emporium/src/`:

- `domain/order.ts`
  - `OrderRecord`, `OrderItem`, `CheckoutRequest`, `CheckoutConfirmation`, validation result types

- `data/orders.repository.ts`
  - local JSON read/append order operations
  - create file if missing, parse/validate collection

- `data/catalog.repository.ts` (extend)
  - add atomic stock update capability and persistence write-back for ducks
  - expose operation that can validate+apply decrements in one write flow

- `services/checkout.service.ts`
  - payload validation
  - cart loading by session
  - stock re-validation
  - atomic sequence orchestration:
    1) verify stock for all lines
    2) persist decremented stock
    3) persist order
    4) clear cart
  - return typed success/error result

- `http/routes/checkout.route.ts`
  - `POST /checkout`
  - map service errors to `400`/`409`; success to `201`

- `http/app.ts` (extend)
  - register checkout route while preserving existing routes

Tests:
- `services/checkout.service.test.ts`
- `http/routes/checkout.route.test.ts`
- `data/orders.repository.test.ts`
- optional extension in `data/catalog.repository.test.ts` for stock-write behavior

## Public interfaces

### Orders repository
- `getAllOrders(): Promise<OrderRecord[]>`
- `appendOrder(order: OrderRecord): Promise<void>`

### Catalog repository extensions
- `decrementStockAtomic(lines: Array<{ duckId: string; quantity: number }>): Promise<{ ok: true } | { ok: false; error: string }>`

(Alternative equivalent API allowed if it keeps all-or-nothing semantics.)

### Checkout service
- `checkout(sessionId: string, payload: unknown): Promise<CheckoutResult>`

`CheckoutResult`:
- success: `{ status: 201; confirmation: CheckoutConfirmation }`
- validation/cart errors: `{ status: 400; error: string; fieldErrors?: Record<string, string> }`
- stock conflict: `{ status: 409; error: string }`

### HTTP contract
- `POST /checkout`
  - uses current `sid` session
  - success: `201` + confirmation JSON
  - errors: `400`/`409` JSON

## External dependencies
- No new mandatory runtime package required.
- Continue with existing stack:
  - `express`
  - `vitest`
  - `supertest`
  - Node built-ins (`node:fs/promises`, `node:crypto`)
- Email validation can use a robust in-code regex and constraints (no external validator package required unless complexity demands it).

## Testing strategy

### Unit tests
1. `checkout.service.test.ts`
   - valid checkout returns `201` confirmation
   - required field failures return `400`
   - strong email validation failures return `400`
   - empty cart returns `400`
   - stock conflict returns `409`
   - success decrements stock, appends order, clears cart
   - ensures mocked payment behavior (card accepted as non-empty string)

2. `orders.repository.test.ts`
   - writes and reads persisted orders
   - handles empty/missing orders file initialization
   - preserves records across repository re-instantiation (restart simulation)

3. `catalog.repository.test.ts` (extend)
   - stock decrement operation is all-or-nothing
   - no partial write on conflict

### Route/integration tests
4. `checkout.route.test.ts`
   - `POST /checkout` happy path (`201`)
   - `400` validations + field errors
   - `400` for empty cart
   - `409` for stock conflict
   - session-scoped checkout (`sid`) behavior

### Regression checks
5. Re-run stories 1–3 test suites to ensure no breakage in catalog/detail/cart flows.

## Risks and mitigations
- **Risk:** Partial updates if stock and order writes are separated unsafely.
  - **Mitigation:** centralize atomic checkout flow and test failure paths explicitly.
- **Risk:** Concurrent checkout races on shared stock file.
  - **Mitigation:** perform stock check and write in one repository operation; keep operation serialized in process.
- **Risk:** Overly strict/lenient email validation.
  - **Mitigation:** define explicit regex + boundary test cases in spec-driven tests.
- **Risk:** Accidental persistence of sensitive card data.
  - **Mitigation:** never store raw card number in order records; verify in tests.
- **Risk:** Floating-point money drift in totals.
  - **Mitigation:** deterministic total computation strategy and precise assertions in tests.
