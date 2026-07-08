# Feature Specification: Advanced Duck Emporium Features

**Feature Branch**: `001-curator-quiz-frontend`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User stories 06–09 — Curator Add Duck, Duck of the Day, Personality Quiz, Web Frontend

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Web Browser Interface (Priority: P1)

As Quincy Quacker, I want to access the full duck emporium experience — browsing, carting, checking out, and enjoying bonus features — entirely through a web browser, without needing any technical tools.

**Why this priority**: This story delivers the largest user-facing value by transforming the emporium from an API-only service into a product accessible to any customer with a browser. All other advanced features are surfaced through this interface.

**Independent Test**: Open a browser, navigate to the emporium home page, browse ducks using search and filter, add one to the cart, complete the checkout flow, and receive an order confirmation — entirely without developer tools.

**Acceptance Scenarios**:

1. **Given** the home page loads, **When** a customer views the catalog, **Then** all ducks are displayed with name, category, price, and tagline, and search, category filter, and price-range controls are visible and functional.
2. **Given** a duck is displayed in the catalog, **When** a customer selects it, **Then** the duck's full detail page is shown with description, personality traits, stock status, and an "Add to Cart" button.
3. **Given** items are in the cart, **When** the customer views the cart, **Then** current items are shown with quantities, line totals, and a running total; the customer can change quantities, remove items, and proceed to checkout.
4. **Given** the checkout form is displayed, **When** the customer submits shipping and payment details, **Then** on success an order confirmation is shown with order ID, items, and total; validation errors are shown inline for invalid fields.
5. **Given** the page is accessed on a mobile viewport (≥ 320 px wide), **When** the customer interacts with any feature, **Then** the layout adapts without horizontal scrolling and all actions remain accessible.
6. **Given** an API error occurs (400, 404, 409), **When** any action is performed, **Then** a clear, human-readable error message is displayed to the customer.

---

### User Story 2 — Curator Adds a Duck (Priority: P2)

As Dr. Mallard, sole arbiter of duck quality, I want to add new ducks to the catalog through a secure admin endpoint, so that I can grow the flock without editing seed files manually.

**Why this priority**: Operational necessity for catalog growth; enables the curator to manage inventory independently and immediately.

**Independent Test**: Submit a valid new duck to the admin endpoint with the correct admin password and confirm the duck immediately appears in the public catalog listing.

**Acceptance Scenarios**:

1. **Given** a valid admin password, **When** a new duck is submitted with all required fields (name, category, price, tagline, description, personality traits, initial stock), **Then** the duck is immediately visible in the public catalog.
2. **Given** no admin password or an incorrect one is supplied, **When** a request is submitted, **Then** the system returns HTTP 401 and the request is rejected.
3. **Given** a duck name already exists in the catalog, **When** a submission uses that name, **Then** the system returns a clear error message rejecting the duplicate.
4. **Given** invalid field values (negative price, negative stock, or missing required fields), **When** a submission is made, **Then** the system returns specific, actionable error messages identifying each invalid field.
5. **Given** a duck is successfully added, **When** the action is logged, **Then** the log entry includes a timestamp and the duck's name, and contains no customer personally identifiable information.

---

### User Story 3 — Duck of the Day (Priority: P3)

As Quincy Quacker, I want to see a featured "Duck of the Day" on the home page, so that I discover new ducks and have a reason to return daily.

**Why this priority**: Engagement feature that drives repeat visits; depends on the core catalog being functional.

**Independent Test**: Request the Duck of the Day multiple times on the same calendar day and confirm the same duck is returned every time; repeat the following day and confirm a different duck is returned.

**Acceptance Scenarios**:

1. **Given** the current calendar day, **When** the Duck of the Day is requested multiple times, **Then** the same duck is returned for every request on that day.
2. **Given** a new calendar day has begun, **When** the Duck of the Day is requested, **Then** a different duck from the previous day is returned.
3. **Given** the algorithm selects a duck, **When** that duck is out of stock, **Then** it is skipped and the next eligible in-stock duck is featured instead.
4. **Given** all ducks are sold out, **When** the Duck of the Day is requested, **Then** a friendly message is returned ("The pond is empty today, come back tomorrow.") with no error.
5. **Given** the Duck of the Day is displayed, **When** a customer selects it, **Then** they are taken to the duck's full detail page.

---

### User Story 4 — "Which Duck Are You?" Personality Quiz (Priority: P4)

As Quincy Quacker, I want to take a short quiz that recommends a duck based on my personality, so that I can share the result and — perhaps accidentally — end up buying a duck.

**Why this priority**: Viral and engagement feature; fun and shareable, with potential to drive organic discovery and conversions.

**Independent Test**: Complete the quiz with a fixed set of answers and confirm the same duck recommendation is always returned for those answers; complete with a different set and confirm a different duck is returned.

**Acceptance Scenarios**:

1. **Given** a customer answers all 5 quiz questions, **When** the quiz is submitted, **Then** a single duck recommendation is returned with a short personalized message and a link to its detail page.
2. **Given** the same 5 answers are submitted multiple times, **When** the result is computed, **Then** the same duck is always returned (fully deterministic).
3. **Given** two or more categories tie for the highest score, **When** the result is resolved, **Then** the category appearing first alphabetically is selected as the winner.
4. **Given** the quiz is completed, **When** the result is returned, **Then** no cart is modified, no order is created, and no persistent state is changed.

---

### Quiz Definition

The personality quiz consists of exactly **5 multiple-choice questions**. Each answer awards weighted points to one duck category. The category with the highest total score across all answers determines the recommended duck.

**Duck Categories**:

| Category | Personality Profile |
|----------|---------------------|
| Adventurer | Bold, spontaneous, exploratory |
| Comedian | Playful, humorous, lighthearted |
| Philosopher | Reflective, analytical, deeply curious |
| Romantic | Warm, empathetic, relationship-focused |
| Zen Master | Calm, mindful, content with simplicity |

---

**Question 1 — Your ideal Saturday involves:**

| Option | Answer | Points |
|--------|--------|--------|
| A | Solving a complex puzzle or reading something deeply | +2 Philosopher |
| B | Exploring somewhere you have never been before | +2 Adventurer |
| C | Sharing a long meal with people you love | +2 Romantic |
| D | Making everyone around you laugh | +2 Comedian |
| E | A quiet walk with no particular destination | +2 Zen Master |

---

**Question 2 — In a group project, you naturally become:**

| Option | Answer | Points |
|--------|--------|--------|
| A | The one who keeps asking "but why?" | +2 Philosopher |
| B | The one who starts before a plan exists | +2 Adventurer |
| C | The one who keeps the team together | +2 Romantic |
| D | The one who keeps everyone's spirits up | +2 Comedian |
| E | The one who calms tensions | +2 Zen Master |

---

**Question 3 — Your social media feed is mostly:**

| Option | Answer | Points |
|--------|--------|--------|
| A | Long articles and thought-provoking threads | +2 Philosopher |
| B | Travel photos and outdoor adventures | +2 Adventurer |
| C | Friends' milestones and heartfelt moments | +2 Romantic |
| D | Memes and funny videos | +2 Comedian |
| E | Minimalist photography and slow-living content | +2 Zen Master |

---

**Question 4 — When choosing a gift, you:**

| Option | Answer | Points |
|--------|--------|--------|
| A | Find something that makes the recipient think | +2 Philosopher |
| B | Give an experience rather than an object | +2 Adventurer |
| C | Put deep thought into making it personal | +2 Romantic |
| D | Choose something guaranteed to make them laugh | +2 Comedian |
| E | Select something simple but quietly meaningful | +2 Zen Master |

---

**Question 5 — Your approach to a rainy afternoon is:**

| Option | Answer | Points |
|--------|--------|--------|
| A | Re-reading a favourite book with annotations | +2 Philosopher |
| B | Planning your next trip or adventure | +2 Adventurer |
| C | Calling a friend you have not spoken to in too long | +2 Romantic |
| D | Watching stand-up comedy or a funny film | +2 Comedian |
| E | Doing absolutely nothing, mindfully | +2 Zen Master |

---

**Tie-breaking Rule**: When two or more categories share the highest score, the category whose name appears first alphabetically is selected. Example: Adventurer ties with Philosopher → Adventurer wins.

---

### Edge Cases

- What happens when a duck added by the curator belongs to a category not mapped by the quiz? → That duck is not eligible for quiz recommendations; it is still available in the catalog.
- What happens when the Duck of the Day algorithm finds all in-stock ducks exhausted? → A friendly fallback message is shown; no error is raised.
- What happens when a quiz submission is missing one or more answers? → The system rejects the submission with a clear error identifying the unanswered questions.
- What happens when the curator submits a duck with a brand-new category? → The endpoint accepts any non-empty category string; no pre-defined category list is enforced by this feature.
- What happens when requests for the Duck of the Day straddle a midnight boundary? → The system uses the server's calendar date; brief inconsistency at midnight boundaries is acceptable.
- What happens when the admin endpoint is called without the `ADMIN_PASSWORD` environment variable configured? → The endpoint always returns HTTP 401, treating an unconfigured password as absent.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST serve a browser-accessible interface exposing catalog browsing, duck detail, cart management, checkout, Duck of the Day, and personality quiz — all without requiring developer tools.
- **FR-002**: The browser interface MUST display catalog ducks with name, category, price, and tagline, and MUST include working free-text search, category filter, and price-range filter controls.
- **FR-003**: The browser interface MUST display the Duck of the Day prominently, with a link to that duck's detail page.
- **FR-004**: The browser interface cart view MUST show items with quantities, line totals, and a running total, and MUST support quantity changes, item removal, and a proceed-to-checkout action.
- **FR-005**: The browser interface checkout form MUST collect shipping name, email, address, and a mocked card number, and MUST display the order confirmation (order ID, items, total) on success and inline validation errors on failure.
- **FR-006**: The browser interface MUST present the personality quiz and display the recommended duck with its personalized message and a link to the duck's detail page.
- **FR-007**: The browser interface MUST render without horizontal scrolling on viewports ≥ 320 px wide.
- **FR-008**: The browser interface MUST display human-readable error messages for API errors (400, 404, 409).
- **FR-009**: An admin endpoint MUST accept new duck submissions containing: name, category, price, tagline, description, personality traits, and initial stock.
- **FR-010**: The admin endpoint MUST reject requests that lack a valid admin password with HTTP 401.
- **FR-011**: The admin endpoint MUST reject submissions with duplicate names, negative prices, negative stock, or missing required fields, returning a specific error message for each violation.
- **FR-012**: A successfully added duck MUST appear immediately in the public catalog listing.
- **FR-013**: Every curator add-duck action MUST be logged with a timestamp and duck name; no customer PII MUST ever appear in the logs.
- **FR-014**: The Duck of the Day MUST return the same duck for all requests on the same calendar day (deterministic).
- **FR-015**: The Duck of the Day selection MUST skip any duck with zero stock.
- **FR-016**: When all ducks are out of stock, the Duck of the Day MUST return a friendly message ("The pond is empty today, come back tomorrow.") rather than an error.
- **FR-017**: The personality quiz MUST present exactly the 5 questions defined in the Quiz Definition section of this specification.
- **FR-018**: The quiz MUST score answers by summing weighted category points and returning the duck whose category has the highest total score.
- **FR-019**: Quiz ties MUST be broken by selecting the alphabetically first category name.
- **FR-020**: Completing the quiz MUST NOT modify any persistent state (cart, orders, analytics).
- **FR-021**: The quiz MUST be fully deterministic: identical answer sets MUST always produce the same duck recommendation.

### Key Entities

- **Duck Category**: A named personality profile (Adventurer, Comedian, Philosopher, Romantic, Zen Master) used for quiz scoring and result mapping.
- **Quiz Submission**: A set of exactly 5 answers (one per question), each selecting one of 5 options; carries no persistent identity.
- **Quiz Result**: A recommended duck, a short personalized message, and a link to that duck's detail page.
- **Admin Credential**: A shared secret (admin password) required to authenticate curator endpoint requests.
- **Duck of the Day**: The single duck selected for featured display on a given calendar date.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A non-technical user can complete a full emporium session (browse → add to cart → checkout) entirely in the browser in under 5 minutes, without consulting documentation.
- **SC-002**: A curator can add a new duck via the admin endpoint and see it appear in the public catalog within 3 seconds of a successful submission.
- **SC-003**: The Duck of the Day returns the same duck for 100% of requests made on the same calendar day, regardless of concurrent load.
- **SC-004**: The personality quiz returns a consistent result for any given set of answers: the same inputs always produce the same recommended duck with 100% reproducibility.
- **SC-005**: All browser interface API errors are surfaced to the user as readable messages within 2 seconds of the error occurring.
- **SC-006**: The browser interface is fully usable on viewports as narrow as 320 px without horizontal scrolling.

---

## Assumptions

- Stories 01–05 (browse catalog, duck detail, add to cart, checkout, search and filter) are already implemented and their API endpoints are available for the frontend to consume; this specification introduces no new backend-only data flows beyond what stories 06–09 define.
- The five quiz duck categories (Adventurer, Comedian, Philosopher, Romantic, Zen Master) correspond to existing category values in the catalog seed data; the quiz scoring logic maps only to these five named categories.
- If a quiz-winning category has no available duck in the catalog, the recommendation message will note the duck is currently unavailable but still identify the recommended type.
- The admin password is a single shared secret configured in the server environment; per-user admin accounts are out of scope.
- The web interface is served from the same origin as the API, so no cross-origin request handling is required.
- The Duck of the Day uses the server's local calendar date for day boundaries; time-zone edge cases at midnight are an accepted minor inconsistency.
- The browser frontend requires no build step; it is served as static plain files alongside the existing API.
- Admin management of the catalog (Dr. Mallard's endpoint) remains accessible via direct HTTP requests only; no browser-based admin UI is in scope.
