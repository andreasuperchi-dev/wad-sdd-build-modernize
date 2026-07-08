# Research — Advanced Duck Emporium Features

## Decision 1: Curator endpoint authentication

- **Decision**: Protect duck-creation endpoint with a single shared secret from `ADMIN_PASSWORD`, provided in request header `x-admin-password`.
- **Rationale**: Matches story constraints (workshop-level admin), avoids account/session complexity, and keeps endpoint easy to exercise via curl and automated tests.
- **Alternatives considered**:
  - Bearer JWT admin auth (rejected: unnecessary operational complexity)
  - Query-string password (rejected: poor security hygiene and logging risk)

## Decision 2: Curator payload validation and duplicate checks

- **Decision**: Validate required fields server-side with explicit field-by-field checks and reject duplicates by normalized duck `name` (case-insensitive trim).
- **Rationale**: Produces clear user-facing errors, prevents accidental catalog duplication, and aligns with acceptance criteria requiring specific validation failures.
- **Alternatives considered**:
  - Schema library dependency (e.g., zod/joi) (rejected for now: avoid new dependencies for workshop scope)
  - Duplicate detection by generated ID only (rejected: misses semantic duplicate names)

## Decision 3: Catalog persistence update strategy

- **Decision**: Reuse `CatalogRepository` JSON storage and append new ducks by safe read-modify-write flow.
- **Rationale**: Existing project already persists catalog in JSON and uses repository abstraction; this is minimal-change and consistent with current architecture.
- **Alternatives considered**:
  - New database table/store (rejected: out of scope)
  - In-memory only additions (rejected: non-persistent and violates curator story intent)

## Decision 4: Audit logging rules

- **Decision**: Log successful curator add-duck actions to stdout with ISO timestamp + duck name + action label; do not include request body fields containing customer data.
- **Rationale**: Satisfies acceptance criteria and keeps observability simple while explicitly preventing customer PII leakage.
- **Alternatives considered**:
  - Structured logging framework (rejected: unnecessary extra setup)
  - No logging (rejected: acceptance criteria requires action log)

## Decision 5: Duck of the Day determinism

- **Decision**: Use server-local calendar date (`YYYY-MM-DD`) as deterministic seed; derive index over current in-stock ducks sorted by stable key (`id`) and return one entry for the day.
- **Rationale**: Guarantees same-day stability, next-day change potential, deterministic behavior across requests, and straightforward testability.
- **Alternatives considered**:
  - Pure random per request (rejected: non-deterministic)
  - Persist selected duck daily in storage (rejected: unnecessary state)

## Decision 6: Sold-out behavior for featured duck

- **Decision**: Build candidate list from in-stock ducks only; if empty, return friendly fallback payload rather than error.
- **Rationale**: Directly satisfies acceptance criteria and avoids brittle fallback logic.
- **Alternatives considered**:
  - Select from all ducks then skip recursively (rejected: more complex edge handling)
  - HTTP 404 when empty (rejected: explicitly disallowed)

## Decision 7: Quiz scoring and tie-breaking

- **Decision**: Encode fixed 5-question/5-option rubric from spec in immutable configuration; compute category totals and resolve ties by alphabetical category name.
- **Rationale**: Ensures strict reproducibility and traceability to specification-defined quiz text/rules.
- **Alternatives considered**:
  - Dynamic quiz definition from DB/JSON file (rejected: unnecessary indirection)
  - Random tie-break (rejected: violates determinism)

## Decision 8: Quiz recommendation mapping

- **Decision**: Return one recommended duck by selecting first in-stock duck (sorted by `id`) in winning category; if none in stock, return deterministic “category match but unavailable” response.
- **Rationale**: Keeps output stable and deterministic while handling stock edge cases safely.
- **Alternatives considered**:
  - Fail request when no in-stock duck in category (rejected: poor UX)
  - Cross-category fallback (rejected: weakens quiz intent)

## Decision 9: Frontend architecture

- **Decision**: Serve static files (`index.html`, CSS, JS) from Express and use `fetch()` to existing API endpoints plus new featured/quiz/admin endpoints as needed.
- **Rationale**: Matches story requirement to avoid build step/framework and keeps deployment simple.
- **Alternatives considered**:
  - React/Vue SPA tooling (rejected: explicitly out of scope)
  - Server-side templates (rejected: explicitly out of scope)

## Decision 10: Frontend error handling strategy

- **Decision**: Centralize API error rendering in client script and display human-readable inline/toast messages for 400/404/409 responses.
- **Rationale**: Meets UX acceptance criteria and reduces duplicated error code across views.
- **Alternatives considered**:
  - Silent failures with console-only logs (rejected: poor usability)
  - Raw JSON output to UI (rejected: non-friendly)

## Decision 11: Responsive baseline

- **Decision**: Use mobile-first CSS layout and verify no horizontal scroll at 320px viewport.
- **Rationale**: Direct mapping to required responsive success criterion without introducing framework dependencies.
- **Alternatives considered**:
  - Desktop-first with media-query overrides (rejected: harder to guarantee small viewport quality quickly)

## Decision 12: Test strategy

- **Decision**: Keep tests adjacent to source (`*.test.ts`) using Vitest + Supertest for new route/service coverage, including determinism tests for quiz and featured duck.
- **Rationale**: Aligns with project conventions and enables precise regression coverage for deterministic logic.
- **Alternatives considered**:
  - Add external E2E browser framework (rejected: out of scope for planning phase)
