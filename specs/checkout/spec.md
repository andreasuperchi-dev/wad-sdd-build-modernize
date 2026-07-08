# Spec — checkout

## Problem
Customers can build a cart but cannot complete a purchase. The system needs a checkout endpoint that validates shipping/payment input, re-validates stock at purchase time, atomically finalizes the order, persists it, clears the session cart, and returns confirmation.

## Users
- **Primary:** Quincy Quacker (customer)
- **Secondary:** API/frontend consumer submitting checkout form data

## Scope

### In scope
- Add session-based checkout endpoint: `POST /checkout`.
- Use current session cart (identified by existing `sid` cookie).
- Validate checkout payload:
  - required `shippingName`, `email`, `address`, `cardNumber`
  - strong email validation (regex + reasonable length checks)
  - trimmed string constraints with min/max lengths for shipping/address fields
- Re-validate stock for every cart line at submit time.
- Decrement stock atomically for all cart lines (all-or-nothing).
- Persist orders to local JSON storage (same style as duck data) across restarts.
- Generate unique order ID and timestamp.
- Clear cart on successful checkout.
- Return order confirmation JSON.

### Out of scope
- Real payment integrations (Stripe/PayPal/etc.).
- Email notifications.
- Order history/listing endpoints.
- Fraud checks, 3DS, card tokenization.

## Functional requirements
1. The application SHALL expose `POST /checkout` and process checkout for the cart bound to the current `sid` session.
2. The endpoint SHALL require request body fields:
   - `shippingName`
   - `email`
   - `address`
   - `cardNumber` (mocked; any non-empty string after trim)
3. Validation SHALL reject invalid payloads with HTTP `400` and field-specific JSON error messages, including:
   - missing/empty required fields
   - invalid email format via strong regex-based validation
   - shipping/address violating configured min/max length constraints
4. If cart is empty, checkout SHALL return HTTP `400` with a clear error.
5. On valid payload, checkout SHALL re-validate stock for every cart line against current catalog data.
6. If any line exceeds available stock, checkout SHALL fail with HTTP `409` and SHALL NOT modify stock, orders, or cart.
7. If stock is sufficient for all lines, system SHALL atomically:
   - decrement stock for all involved ducks
   - create and persist an order record
   - clear the session cart
8. Created order record SHALL include:
   - `orderId` (unique)
   - `createdAt` (timestamp)
   - shipping summary (`shippingName`, `email`, `address`)
   - purchased line items (duck ID, name, unit price, quantity, line total)
   - `total`
9. Successful checkout SHALL return HTTP `201` with order confirmation containing at least `orderId`, `items`, `total`, and `createdAt`.
10. Orders SHALL persist to local JSON file storage and remain available after server restarts.
11. Payment handling SHALL remain mocked; no external payment provider calls are allowed.

## Non-functional requirements
- **Consistency:** JSON-first API consistent with stories 1–3.
- **Atomicity:** checkout write path is all-or-nothing for stock decrement + order persist + cart clear.
- **Durability (orders):** order persistence survives process restart via local JSON file.
- **Determinism:** same valid input and state leads to predictable confirmation structure.
- **Security baseline:** input is trimmed/sanitized for validation; sensitive card data is not persisted beyond what is strictly required for mocked flow (preferred: do not persist raw card number).
- **Testability:** all acceptance criteria covered by automated `vitest` tests.

## Acceptance criteria
1. `POST /checkout` with valid payload and non-empty cart returns `201` and order confirmation JSON.
2. Required-field and strong email validation failures return `400` with clear error messages.
3. Empty cart checkout returns `400`.
4. Stock conflict during checkout returns `409` and leaves stock/cart/orders unchanged.
5. Successful checkout decrements stock for all line items, persists order, and clears cart.
6. Persisted orders remain after restart (file-backed persistence behavior covered by tests).
7. Implementation does not integrate real payment providers.

## Open questions
- None at this stage.
