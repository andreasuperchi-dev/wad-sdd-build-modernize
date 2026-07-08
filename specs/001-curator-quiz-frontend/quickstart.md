# Quickstart — Advanced Duck Emporium Features

This guide validates stories 06–09 end-to-end against the contracts and data model.

## Prerequisites

- Node.js 20+
- npm installed
- Repository root: `wad-sdd-build-modernize`

## Setup

1. Install dependencies:
   - `npm install`
2. Configure admin secret:
   - `export ADMIN_PASSWORD='quack-admin'`
3. Start app (project command used by your current branch/workflow).

## Validation Scenarios

### Scenario 1 — Curator adds a new duck

**Goal**: Validate admin auth + payload validation + persistence visibility.

1. Unauthorized request:
   - `POST /admin/ducks` without `x-admin-password`
   - Expected: `401` with error payload.
2. Invalid payload request:
   - Use negative `price` or missing `name`.
   - Expected: `400` with clear field-specific message.
3. Valid request:
   - Send full payload with `x-admin-password: quack-admin`.
   - Expected: `201` and returned created duck.
4. Verify catalog visibility:
   - `GET /ducks`
   - Expected: newly created duck appears immediately.
5. Verify logging:
   - Check server stdout for timestamp + duck name, with no customer PII.

Related contract: `contracts/advanced-features.openapi.yaml` (`/admin/ducks`)

---

### Scenario 2 — Duck of the Day determinism

**Goal**: Validate same-day stability, sold-out skip, and empty fallback.

1. Call `GET /ducks/featured` multiple times on same day.
   - Expected: identical duck response each time.
2. Simulate next day (or adjust test clock) and call again.
   - Expected: deterministic but potentially different duck.
3. Mark selected duck sold out and retry.
   - Expected: another in-stock duck returned.
4. Set all duck stock to zero and retry.
   - Expected: `200` with friendly fallback message, no error status.

Related contract: `contracts/advanced-features.openapi.yaml` (`/ducks/featured`)

---

### Scenario 3 — Personality quiz determinism

**Goal**: Validate fixed 5-question scoring and tie-break rule.

1. Submit valid 5-answer payload to `POST /quiz/result`.
   - Expected: `200`, winning category, recommendation message, detail URL.
2. Submit identical payload repeatedly.
   - Expected: exactly same result every time.
3. Submit tie-producing answers.
   - Expected: alphabetical category tie-break applied.
4. Submit incomplete answers (e.g., missing `q5`).
   - Expected: `400` with actionable validation error.
5. Confirm no persistent state changed:
   - Cart, orders, and catalog remain unchanged after quiz calls.

Related contract: `contracts/advanced-features.openapi.yaml` (`/quiz/result`)

---

### Scenario 4 — Web frontend journey

**Goal**: Validate browser-only customer journey and responsive/error handling.

1. Open `GET /` in desktop browser.
   - Expected: catalog view with search/filter controls and Duck of the Day section.
2. Navigate to duck detail and add to cart.
   - Expected: item appears in cart with totals.
3. Complete checkout form with valid mocked card data.
   - Expected: order confirmation with ID/items/total.
4. Trigger known API validation error (e.g., invalid checkout email).
   - Expected: human-friendly inline error in UI.
5. Repeat basic flow on mobile viewport width 320px.
   - Expected: no horizontal scrolling; controls usable.

Related contracts:
- `contracts/advanced-features.openapi.yaml` (`/`, `/ducks/featured`, `/quiz/result`)
- Existing API contracts for `/ducks`, `/ducks/{id}`, `/cart`, `/checkout`

## Expected Outcome

All four scenarios pass with deterministic behavior for featured duck and quiz, secure curator endpoint behavior, and a functional no-build responsive frontend served from the same application.

## Implementation Notes

- Frontend assets are served from `src/public/` through Express static middleware.
- Curator endpoint authentication uses `x-admin-password` against `ADMIN_PASSWORD`.
- Featured duck and quiz outputs are deterministic by design (date seed and fixed scoring rules).
- Quiz endpoint is read-only and does not mutate cart, orders, or catalog state.

## Validation Status

Validated on 2026-07-08:

- `npm test` ✅ (root project test suite)
- `npm run smoke` ✅ (app boot and route wiring smoke check)
