# Spec: Search and Filter the Catalog

**Story ID:** `search-and-filter`  
**Date:** 8 luglio 2026  
**Status:** Draft

---

## Problem

Customers browsing the duck catalog need a way to narrow down results by specific criteria (free-text search, category, price range) instead of scrolling through the entire catalog. Currently, they can only browse all ducks or see a single duck's detail page.

---

## Users

- **Primary:** Customers with specific duck needs (e.g., "philosophical duck under €20")
- **Secondary:** Customers refining broad categories into more specific results

---

## Scope

### In scope
- Free-text search (name, tagline, long description; case-insensitive)
- Filter by one or more categories (AND logic)
- Filter by price range (minimum and/or maximum; either bound optional)
- Composable filters (free text AND category AND price all apply together)
- Empty state messaging ("No duck matches your existential criteria.")
- Pagination (20 ducks per page)
- Persistent filters across pagination
- Relevance-based sorting (name match > tagline match > description match, then by price ascending)

### Out of scope
- Fuzzy / typo-tolerant search
- Saved searches
- Custom sort orders (stable default only)
- Search suggestions / autocomplete
- Recent searches
- Faceted counts ("5 ducks in Philosophy category")

---

## Functional Requirements

### Search Query
1. Accept a free-text search string (optional)
2. Search is case-insensitive
3. Match against: duck `name`, `tagline`, and `longDescription`
4. Ranking: exact name match > tagline match > description match
5. Preserve search query across pagination

### Category Filter
1. Display a list of all available categories (from ducks in catalog)
2. Allow selection of zero, one, or multiple categories
3. Apply AND logic: return ducks matching ALL selected categories
4. Preserve selected categories across pagination

### Price Filter
1. Provide input fields for minimum price and maximum price
2. Both bounds are optional (can filter by min only, max only, or both)
3. Apply inclusive range: `price >= min AND price <= max`
4. Preserve min/max values across pagination

### Results Display
1. Paginate results at 20 ducks per page
2. Show pagination controls (prev, next, page indicator)
3. Display duck cards with name, image, tagline, price (same as browse-catalog)
4. Sort by: relevance (search match quality), then by price ascending

### Empty State
1. When no ducks match the applied filters, display:
   - Message: "No duck matches your existential criteria."
   - Option to: clear filters, modify search, go back to browse
2. Not a blank page; should be user-friendly and actionable

### Filter Persistence
1. Filters and search query remain active during pagination
2. URL or session state tracks: search query, categories, min price, max price, current page
3. Back/forward browser navigation restores filter state

---

## Non-Functional Requirements

- Search/filter response time: < 500ms for typical queries
- Support at least 1000 ducks in catalog without degradation
- Filters must be accessible on the same page view as results (no modal/separate page)
- Mobile-responsive (filters remain accessible on small screens)

---

## Acceptance Criteria

✅ Free-text search matches duck name, tagline, and long description (case-insensitive)  
✅ Filter by one or more categories  
✅ Filter by minimum and/or maximum price (either bound is optional)  
✅ Filters compose (free text AND category AND price all apply together)  
✅ Empty result set renders "No duck matches your existential criteria." message  
✅ Results are paginated (20 per page)  
✅ Filters and search persist across pagination  
✅ Results sorted by relevance, then by price ascending  

---

## Open Questions

- ~~Should filters be sticky in a sidebar or inline with results?~~ → **Sticky sidebar**
- ~~Should we show "X results found" count above results?~~ → **Yes**
- ~~Should category filter allow "select all" shortcut?~~ → **Yes; selecting all = no category filter applied**
- ~~When user navigates away and returns, should filters be restored?~~ → **Yes, via URL query params**
- ~~Should we debounce search input (delay before querying) to avoid excessive requests?~~ → **Yes, 300ms (client-side only)**
