# Tasks: Advanced Duck Emporium Features

**Input**: Design documents from `/specs/001-curator-quiz-frontend/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare project scaffolding for advanced stories 06–09.

- [x] T001 Add runtime scripts for local app execution in package.json
- [x] T002 Create static frontend shell files in src/public/index.html, src/public/styles.css, and src/public/app.js
- [x] T003 [P] Define quiz domain types and constants in src/domain/quiz.ts
- [x] T004 [P] Define featured duck result types in src/domain/featured.ts
- [x] T005 [P] Add admin configuration helper for `ADMIN_PASSWORD` in src/http/config/admin.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared backend capabilities required before user-story implementation.

**⚠️ CRITICAL**: Complete this phase before starting user stories.

- [x] T006 Extend catalog persistence with add-duck write support in src/data/catalog.repository.ts
- [x] T007 Add duplicate-name lookup support in src/data/catalog.repository.ts
- [x] T008 Add deterministic date-seed utility for daily selection in src/services/featured.service.ts
- [x] T009 Add reusable API error response mapper in src/http/routes/error-response.ts
- [x] T010 Add PII-safe curator audit logger in src/services/audit.logger.ts
- [x] T011 Wire static assets and new routers in src/http/app.ts

**Checkpoint**: Foundation complete — user stories can proceed.

---

## Phase 3: User Story 1 - Web Browser Interface (Priority: P1) 🎯 MVP

**Goal**: Deliver a browser-based customer flow for catalog, detail, cart, and checkout without developer tools.

**Independent Test**: Open `/`, browse/filter catalog, open detail, manage cart, checkout successfully, and see inline API errors.

- [x] T012 [US1] Implement frontend API client and shared state management in src/public/app.js
- [x] T013 [P] [US1] Implement responsive catalog and filter UI markup in src/public/index.html
- [x] T014 [P] [US1] Implement responsive layout and mobile styles in src/public/styles.css
- [x] T015 [US1] Implement duck detail rendering and add-to-cart actions in src/public/app.js
- [x] T016 [US1] Implement cart quantity update/removal and totals in src/public/app.js
- [x] T017 [US1] Implement checkout form submit and confirmation rendering in src/public/app.js
- [x] T018 [US1] Implement human-readable API error presentation for 400/404/409 in src/public/app.js

**Checkpoint**: User Story 1 is functional and independently testable.

---

## Phase 4: User Story 2 - Curator Adds a Duck (Priority: P2)

**Goal**: Add secure curator endpoint for creating ducks with validation, duplicate checks, immediate catalog visibility, and audit logs.

**Independent Test**: Submit valid payload with correct `x-admin-password` to `/admin/ducks` and verify immediate appearance in `/ducks`.

- [x] T019 [US2] Implement curator add-duck validation and creation workflow in src/services/curator.service.ts
- [x] T020 [US2] Implement curator route with admin header auth in src/http/routes/admin.route.ts
- [x] T021 [US2] Add curated duck ID generation and normalization logic in src/services/curator.service.ts
- [x] T022 [US2] Integrate duplicate-name conflict and field error mapping in src/http/routes/admin.route.ts
- [x] T023 [US2] Add PII-safe add-duck success logging in src/services/curator.service.ts
- [x] T024 [US2] Register curator router in src/http/app.ts

**Checkpoint**: User Story 2 is functional and independently testable.

---

## Phase 5: User Story 3 - Duck of the Day (Priority: P3)

**Goal**: Provide deterministic daily featured duck selection with sold-out skipping and friendly empty fallback.

**Independent Test**: Call `/ducks/featured` repeatedly on same day for identical result; verify fallback when all ducks are sold out.

- [x] T025 [US3] Implement deterministic featured-duck selection service in src/services/featured.service.ts
- [x] T026 [US3] Implement featured duck endpoint in src/http/routes/featured.route.ts
- [x] T027 [US3] Implement sold-out skipping and empty-pond fallback payload in src/services/featured.service.ts
- [x] T028 [US3] Register featured router in src/http/app.ts
- [x] T029 [US3] Render Duck of the Day section and detail navigation in src/public/app.js and src/public/index.html

**Checkpoint**: User Story 3 is functional and independently testable.

---

## Phase 6: User Story 4 - Personality Quiz (Priority: P4)

**Goal**: Deliver deterministic 5-question quiz recommendation with alphabetical tie-break and no persistent side effects.

**Independent Test**: Submit fixed answers to `/quiz/result` and verify identical recommendation on repeated submissions.

- [x] T030 [US4] Implement quiz scoring engine using fixed question weights in src/services/quiz.service.ts
- [x] T031 [US4] Implement alphabetical tie-break resolution in src/services/quiz.service.ts
- [x] T032 [US4] Implement quiz result endpoint and input validation in src/http/routes/quiz.route.ts
- [x] T033 [US4] Register quiz router in src/http/app.ts
- [x] T034 [US4] Implement quiz UI, submit flow, and recommendation rendering in src/public/app.js and src/public/index.html
- [x] T035 [US4] Ensure quiz flow does not mutate cart/orders/catalog state in src/services/quiz.service.ts

**Checkpoint**: User Story 4 is functional and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, docs, and end-to-end validation.

- [x] T036 [P] Update API usage docs for new endpoints in README.md
- [x] T037 [P] Add feature-level implementation notes in specs/001-curator-quiz-frontend/quickstart.md
- [x] T038 Validate all quickstart scenarios end-to-end in specs/001-curator-quiz-frontend/quickstart.md
- [x] T039 Run full test and smoke verification command updates in package.json

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 → required before Phase 2
- Phase 2 → required before all user story phases
- Phase 3 (US1) → MVP baseline frontend
- Phase 4 (US2), Phase 5 (US3), Phase 6 (US4) → can proceed after Phase 2; listed in priority order
- Phase 7 → after all targeted stories are complete

### User Story Dependencies

- **US1 (P1)**: Depends only on foundational setup and existing stories 01–05 APIs
- **US2 (P2)**: Depends on foundational setup; independent of US1 UI
- **US3 (P3)**: Depends on foundational setup; frontend integration task depends on US1 frontend scaffolding
- **US4 (P4)**: Depends on foundational setup; frontend integration task depends on US1 frontend scaffolding

---

## Parallel Execution Examples

### User Story 1

- Run T013 and T014 in parallel (HTML and CSS split files)
- Then run T015 and T016 in parallel (detail/cart subflows in same file sections only after agreeing merge order)

### User Story 2

- Run T020 and T021 in parallel (route/auth and service ID-normalization prep)
- Then complete T022 and T023 sequentially due to shared service/route integration

### User Story 3

- Run T026 in parallel with T027 after T025 scaffolds service contract
- Finish with T029 once endpoint contract is stable

### User Story 4

- Run T031 in parallel with T032 after T030 establishes scoring model
- Then complete T034 and T035 sequentially for behavior validation

---

## Implementation Strategy

### MVP First

1. Finish Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) as browser-based MVP.
3. Validate independent test criteria for US1 before moving on.

### Incremental Delivery

1. Add curator operations (US2) for catalog growth.
2. Add daily engagement feature (US3).
3. Add quiz recommendation experience (US4).
4. Finish with polish and scenario validation.

### Quality Gates

- Each story must pass its independent test criteria before advancing.
- Preserve mocked payment behavior (no external provider integration).
- Keep frontend build-free and same-origin.
