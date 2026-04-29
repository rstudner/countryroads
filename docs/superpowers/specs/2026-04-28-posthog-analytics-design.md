# PostHog Analytics — Design Spec
Date: 2026-04-28

## Problem

PostHog is installed but sends only `$pageview`, `$pageleave`, and one `$autocapture` event. The default dashboard ("My App Dashboard") has generic SaaS metrics (DAU, WAU, retention) that don't reflect the rental business. Zero custom events means no visibility into whether visitors click Book Now, how far they scroll, or which pages they visit.

## Goal

Instrument the site with two custom events covering all conversion CTAs and key section visibility, then rebuild the PostHog dashboard with 5 insights that directly answer the question: "are visitors convinced, and are they booking?"

---

## Events

### `cta_clicked`

Fired on click of any conversion or navigation link. Implemented via a single delegated listener on `document` in `main.js` — no HTML changes required.

**Properties:**

| Property | Values |
|----------|--------|
| `label` | `book_direct` · `view_airbnb` · `read_reviews_airbnb` · `book_tour_facebook` · `message_facebook` · `trail_guide` · `guided_tours` · `street_view` |
| `page` | `index` · `trails` · `tours` |
| `location` | `hero` · `nav` · `nav_mobile` · `trails_section` · `tours_section` · `book_section` · `reviews_section` · `cta_bar` · `footer` · `about` · `how_to_book` |

**Classification logic (matched on `href`):**

- Lodgify checkout URL → `book_direct`
- `airbnb.com/rooms` → `view_airbnb` (reviews CTA) or `read_reviews_airbnb` (reviews section)
- `facebook.com` → `book_tour_facebook` or `message_facebook` (by text content)
- `trails.html` → `trail_guide`
- `tours.html` → `guided_tours`
- `google.com/maps` or `streetviewpixels` → `street_view`

### `section_viewed`

Fired once per section per page load when 30% of the section enters the viewport. Uses a dedicated IntersectionObserver (separate from the existing scroll-reveal observer). Fires once then unobserves, so each section generates at most one event per page load.

**Properties:**

| Property | Values |
|----------|--------|
| `section` | `trails` · `retreat` · `amenities` · `gallery` · `tours` · `awards` · `location` · `reviews` · `book` · `hero_cta` (trails/tours pages) |
| `page` | `index` · `trails` · `tours` |

**Implementation notes:**
- `index.html` sections already have IDs — observer targets `section[id]` elements, derives section name from `id` attribute, skips `home`.
- `trails.html` and `tours.html` sections have no IDs. Add `data-ph-section` attribute to the hero and bottom CTA sections on those pages only. Visiting the page is the primary signal; bottom-CTA reach is the secondary one.

---

## Dashboard: "Hatfield McCoy Basecamp"

Replaces "My App Dashboard". 5 insights.

### 1. Page traffic breakdown
- Type: Trend (line)
- Event: `$pageview`
- Breakdown: `$pathname`
- Period: 30 days
- Purpose: home vs `/trails.html` vs `/tours.html` traffic over time

### 2. Booking CTA clicks
- Type: Trend (line, bold number)
- Event: `cta_clicked` filtered to `label = book_direct`
- Period: 30 days
- Purpose: primary conversion metric — the number to check each week

### 3. All CTA clicks by type
- Type: Bar chart (value)
- Event: `cta_clicked`
- Breakdown: `label`
- Period: 30 days
- Purpose: what are visitors actually reaching for — book direct vs Airbnb vs Facebook

### 4. Section engagement funnel
- Type: Funnel (ordered, 14-day window)
- Steps:
  1. `$pageview`
  2. `section_viewed` where `section = reviews`
  3. `section_viewed` where `section = book`
  4. `cta_clicked` where `label = book_direct`
- Purpose: core drop-off analysis — what % of visitors get convinced and book

### 5. Traffic sources
- Type: Table
- Event: `$pageview`
- Breakdown: `$referring_domain`
- Period: 14 days
- Purpose: direct vs Google vs Airbnb vs Facebook origin

---

## Files changed

| File | Change |
|------|--------|
| `main.js` | Add `cta_clicked` delegated listener + `section_viewed` IntersectionObserver |
| `trails.html` | Add `data-ph-section` to hero and bottom CTA `<section>` elements |
| `tours.html` | Add `data-ph-section` to hero and bottom CTA `<section>` elements |
| PostHog (via MCP) | Rename dashboard, delete 6 default insights, create 5 new insights |

---

## Out of scope

- Gallery image hover/click tracking
- Mobile menu open tracking
- Scroll percentage milestones
- User identification (site has no login)
- `person_profiles` setting change (leave as `identified_only`)
