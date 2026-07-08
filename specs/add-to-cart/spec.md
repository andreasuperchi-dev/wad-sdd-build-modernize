# Spec — add-to-cart

## Problem
Customers can browse and inspect ducks, but they cannot stage a purchase. The system needs a session-scoped cart API so a customer can add ducks, adjust quantities, remove items, and see a running total before checkout.

## Users
- **Primary:** Quincy Quacker (customer)
- **Secondary:** API/frontend consumer using the same-origin JSON API

## Scope

### In scope
- Session-scoped cart managed via anonymous session cookie.
- Server-side in-memory cart storage keyed by session ID.
- Cart operations via JSON endpoints:
  - `GET /cart`
  - `POST /cart/items`
  - `PATCH /cart/items/:duckId`
  - `DELETE /cart/items/:duckId`
- Add duck by ID with optional quantity (default `1`).
- Update quantity for existing line item.
- Remove line item from cart.
- Return cart items and running total.
- Enforce stock limits when adding/updating quantities.
- Deterministic error mapping:
  - `400` invalid input
  - `404` unknown duck ID
  - `409` requested quantity exceeds available stock

### Out of scope
- User accounts/login.
- Cross-session persistence.
- Discounts/coupons/gift wrapping.
- Checkout/payment behavior.

## Functional requirements
1. The system SHALL identify a cart session with an HTTP-only cookie (name: `sid`) and associate it with a server-side in-memory cart.
2. If `sid` is missing, the system SHALL create a new session/cart and set the cookie.
3. `POST /cart/items` SHALL accept `duckId` and optional `quantity` (default `1`), then add or increment that item in the current session cart.
4. `PATCH /cart/items/:duckId` SHALL set/update quantity for that item in the current cart.
5. `DELETE /cart/items/:duckId` SHALL remove the line item from the current cart.
6. `GET /cart` SHALL return cart contents including line-item quantities, line totals, and overall running total.
7. For add/update, if requested resulting quantity exceeds duck stock, the API SHALL reject with `409` and clear error JSON.
8. For add/update, invalid quantity values (non-integer, zero, negative, missing required body fields) SHALL return `400`.
9. If `duckId` does not exist in catalog, add/update SHALL return `404` with clear error JSON.
10. Cart state SHALL persist across requests within the same session cookie and SHALL NOT be persisted across server restarts.

## Non-functional requirements
- **API style:** JSON-first, consistent with stories 1–2.
- **Session security baseline:** `sid` cookie is `HttpOnly` and `SameSite=Lax`.
- **Determinism:** Same session + same sequence of requests yields same cart state.
- **Testability:** All acceptance criteria covered by automated `vitest` tests.
- **Simplicity:** In-memory store only; no DB/cache required for this story.

## Acceptance criteria
1. A client can add a duck by ID to cart via API; quantity defaults to `1` when omitted.
2. A client can change item quantity and remove an item.
3. `GET /cart` returns current items, per-line totals, and running total.
4. Exceeding available stock returns `409` with a human-readable JSON error.
5. Invalid input returns `400`; unknown duck ID returns `404`.
6. Repeated requests with same `sid` preserve cart state; different `sid` values isolate carts.
7. All add-to-cart tests pass with `vitest`.

## Open questions
- None at this stage.
