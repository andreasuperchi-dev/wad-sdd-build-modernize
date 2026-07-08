# Data Model — Advanced Duck Emporium Features

## Entity: `Duck`

Existing catalog aggregate extended with curator write scenarios.

### Fields

- `id: string` — unique stable identifier
- `name: string` — unique display name (case-insensitive uniqueness)
- `category: string` — duck category used by browse/filter and quiz matching
- `price: number` — non-negative monetary amount
- `tagline: string` — short customer-facing summary
- `description: string` — full detail text
- `personalityTraits: string[]` — list of traits displayed in detail and UI
- `stock: number` — integer >= 0

### Validation Rules

- `name`, `category`, `tagline`, `description` are required non-empty strings
- `personalityTraits` is a required non-empty array of non-empty strings
- `price >= 0`
- `stock >= 0`
- `name` must be unique across all ducks (normalized comparison)

### State Transitions

- `created` via curator endpoint
- `stock decremented` via checkout
- `sold-out` when `stock = 0`

---

## Entity: `CuratorAddDuckRequest`

Input contract for admin endpoint.

### Fields

- `name: string`
- `category: string`
- `price: number`
- `tagline: string`
- `description: string`
- `personalityTraits: string[]`
- `initialStock: number`

### Validation Rules

- Requires valid admin credential (`x-admin-password` = `ADMIN_PASSWORD`)
- Same field constraints as `Duck`
- `initialStock` mapped to persisted `stock`

---

## Entity: `DuckOfTheDay`

Derived read model for daily feature.

### Fields (success)

- `date: string` (`YYYY-MM-DD`, server local date)
- `duck: DuckSummary`

### Fields (fallback)

- `date: string`
- `message: string`

### Relationships

- Derived from current `Duck[]` where `stock > 0`

### Deterministic Rule

- In-stock ducks sorted by stable key (`id`)
- Selection index derived from date seed and list length

---

## Entity: `QuizQuestion`

Static configuration object.

### Fields

- `id: string` (`q1`…`q5`)
- `prompt: string`
- `options: QuizOption[]`

## Entity: `QuizOption`

### Fields

- `id: string` (`A`…`E`)
- `text: string`
- `weights: Record<QuizCategory, number>`

---

## Entity: `QuizSubmission`

### Fields

- `answers: Record<QuestionId, OptionId>`

### Validation Rules

- Must include exactly one option per question (`q1`…`q5`)
- Option IDs must be valid for corresponding question

---

## Entity: `QuizResult`

### Fields

- `winningCategory: QuizCategory`
- `scores: Record<QuizCategory, number>`
- `recommendedDuck: DuckSummary | null`
- `message: string`
- `duckDetailUrl: string | null`

### Deterministic Rules

- Category score is sum of configured weights
- Ties resolved by alphabetical category name
- Duck selection deterministic within winning category (stable sort by `id`)

---

## Value Type: `QuizCategory`

Enum-like string set:

- `Adventurer`
- `Comedian`
- `Philosopher`
- `Romantic`
- `Zen Master`

---

## Entity: `FrontendViewState` (client-side)

Ephemeral browser state only; never persisted server-side.

### Fields

- `catalogFilters` (query, category, minPrice, maxPrice)
- `selectedDuckId`
- `cartSnapshot`
- `checkoutFormState`
- `quizFormState`
- `globalError`

### Constraints

- Must be reconstructable from API responses
- No secret/admin credentials stored in browser state for customer flows
