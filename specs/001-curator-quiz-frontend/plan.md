# Implementation Plan: Advanced Duck Emporium Features

**Branch**: `001-curator-quiz-frontend` | **Date**: 2026-07-08 | **Spec**: /specs/001-curator-quiz-frontend/spec.md

**Input**: Feature specification from `/specs/001-curator-quiz-frontend/spec.md`

## Summary

Deliver stories 06–09 by extending the existing Node/TypeScript Express app with: (1) curator-only duck creation endpoint, (2) deterministic Duck of the Day selection that skips sold-out items, (3) deterministic personality quiz recommendation endpoint using fixed weighted questions, and (4) no-build browser UI served by the same app that consumes existing and new JSON endpoints.

## Technical Context

**Language/Version**: TypeScript (ES modules), Node.js 20+

**Primary Dependencies**: `express` 5, `vitest`, `supertest`, `tsx`

**Storage**: JSON files on disk (`src/data/ducks.seed.json`, `src/data/orders.json`), in-memory session cart store

**Testing**: Vitest unit/integration tests and route tests next to source (`*.test.ts`)

**Target Platform**: Node.js HTTP server on macOS/Linux developer environments

**Project Type**: Single-project web service with static asset serving

**Performance Goals**:
- Duck of the Day and quiz endpoint response under 150ms p95 in local dev dataset
- Admin add-duck persistence and visibility in catalog within 3 seconds

**Constraints**:
- Must keep payments mocked only (no third-party gateway integration)
- Must not introduce frontend build pipeline/framework
- Must use same-origin static frontend (no CORS complexity)
- Must avoid logging customer PII

**Scale/Scope**:
- Workshop scale (single service, small/medium JSON dataset)
- One shared admin secret (`ADMIN_PASSWORD`) for curator endpoint
- Exact 5-question deterministic quiz as defined in spec

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Current constitution file (`.specify/memory/constitution.md`) is an unfilled template containing placeholders (`[PROJECT_NAME]`, `[PRINCIPLE_*]`).

### Pre-Phase 0 Gate Evaluation

| Gate | Status | Notes |
|------|--------|-------|
| Constitution principles available and enforceable | ⚠️ CONDITIONAL PASS | No enforceable principles are defined yet; cannot evaluate hard MUST/SHOULD rules.
| Feature aligns with project guardrails from AGENTS | ✅ PASS | Node 20+, TypeScript ES modules, `node:` built-ins, vitest tests, mocked payment respected.
| Scope bounded to stories 06–09 | ✅ PASS | Feature scope explicitly excludes stories 01–05 changes.

Decision: proceed with planning under conditional constitution pass and document no additional principle exceptions.

### Post-Phase 1 Re-Check

| Gate | Status | Notes |
|------|--------|-------|
| Added artifacts violate known project constraints | ✅ PASS | Artifacts and contracts keep mocked payments and no frontend build stack.
| Architecture introduces unjustified complexity | ✅ PASS | Single-service extension with static files and incremental routes only.
| Unresolved technical clarifications remain | ✅ PASS | All technical context items resolved in research.

## Project Structure

### Documentation (this feature)

```text
specs/001-curator-quiz-frontend/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── advanced-features.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/
│   ├── catalog.repository.ts
│   ├── ducks.seed.json
│   └── ...
├── domain/
│   ├── duck.ts
│   ├── cart.ts
│   ├── order.ts
│   └── (new) quiz.ts
├── http/
│   ├── app.ts
│   ├── routes/
│   │   ├── catalog.route.ts
│   │   ├── cart.route.ts
│   │   ├── checkout.route.ts
│   │   ├── (new) admin.route.ts
│   │   ├── (new) featured.route.ts
│   │   └── (new) quiz.route.ts
│   └── session/
├── services/
│   ├── catalog.service.ts
│   ├── cart.service.ts
│   ├── checkout.service.ts
│   ├── (new) curator.service.ts
│   ├── (new) featured.service.ts
│   └── (new) quiz.service.ts
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

**Structure Decision**: Keep the existing single-project Express architecture and add three focused service/route pairs plus static frontend assets under `src/public/`; no separate frontend project.

## Phase 0: Outline & Research

Research output: `/specs/001-curator-quiz-frontend/research.md`

Resolved decisions include:
- deterministic day-based duck selection algorithm
- admin authentication and validation approach
- deterministic quiz scoring + tie-break semantics
- static frontend delivery and API integration pattern
- logging and PII-safety boundaries

## Phase 1: Design & Contracts

Design outputs:
- `/specs/001-curator-quiz-frontend/data-model.md`
- `/specs/001-curator-quiz-frontend/contracts/advanced-features.openapi.yaml`
- `/specs/001-curator-quiz-frontend/quickstart.md`

Agent-context update script execution:
- Attempted standard script lookup under `.specify/scripts/bash/`.
- No `update-agent-context` script is present in this repository; no update executed.

## Complexity Tracking

No constitution-approved violations or justified complexity exceptions required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
