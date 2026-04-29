# PostHog Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `cta_clicked` and `section_viewed` custom events to all three pages, then rebuild the PostHog dashboard with 5 rental-business-specific insights.

**Architecture:** All JS tracking lives in `main.js` (already shared across all pages via `<script src="main.js">`). CTA tracking uses a single delegated click listener on `document`. Section tracking uses a dedicated `IntersectionObserver`. Two HTML files get `data-ph-section` attributes on their bottom CTA sections. PostHog dashboard is rebuilt via MCP tool calls.

**Tech Stack:** Vanilla JS, PostHog JS snippet (already installed), PostHog MCP server for dashboard management.

---

## Files

| File | Change |
|------|--------|
| `main.js` | Add CTA delegated listener + section IntersectionObserver |
| `trails.html` | Add `data-ph-section="cta_bar"` to `<section class="cta-section">` |
| `tours.html` | Add `data-ph-section="cta_bar"` to `<section class="cta-section">` |
| PostHog (MCP) | Rename dashboard, delete 6 default insights, create 5 new insights |

**Important:** `main.js` already declares `const page = ...` at line 46 (used for nav active link detection). All new analytics code must use `phPage` instead of `page` to avoid a duplicate-declaration error.

---

## Task 1: Add CTA click tracking to main.js

**Files:**
- Modify: `main.js` (append after line 52)

There is no test framework on this static site. Verification is done using PostHog's Live Events view: open `https://us.posthog.com/project/401171/activity/explore`, then trigger the action on the local site.

- [ ] **Step 1: Enable PostHog debug mode temporarily**

Add this line immediately after the `posthog.init(...)` call (line 7 of `main.js`):

```js
posthog.debug(); // remove before final commit
```

Open the site locally (e.g. `open index.html` or via Cloudflare Pages preview). Open browser console — you should see PostHog debug output for every event. This confirms PostHog is initialised before testing the new tracking.

- [ ] **Step 2: Append CTA tracking code to main.js**

Add the following block at the end of `main.js`, after the existing nav active-link code:

```js
// Analytics — page identifier (distinct from the nav `page` var above)
const phPage = (function () {
  const p = window.location.pathname;
  if (p.includes('trails')) return 'trails';
  if (p.includes('tours')) return 'tours';
  return 'index';
}());

// CTA click tracking
function _phCTALabel(a) {
  const href = a.href || '';
  const text = (a.textContent || '').trim().toLowerCase();
  if (href.includes('lodgify.com')) return 'book_direct';
  if (href.includes('airbnb.com')) return text.includes('review') ? 'read_reviews_airbnb' : 'view_airbnb';
  if (href.includes('facebook.com')) return text.includes('book') ? 'book_tour_facebook' : 'message_facebook';
  if (href.includes('trails.html')) return 'trail_guide';
  if (href.includes('tours.html')) return 'guided_tours';
  if (href.includes('google.com/maps') || href.includes('streetviewpixels')) return 'street_view';
  return null;
}

function _phCTALocation(a) {
  if (a.closest('.nav-mobile')) return 'nav_mobile';
  if (a.closest('nav')) return 'nav';
  if (a.closest('footer')) return 'footer';
  if (a.closest('.cta-section')) return 'cta_bar';
  const s = a.closest('section[id], section[data-ph-section]');
  if (s) return s.id || s.dataset.phSection || 'unknown';
  return 'unknown';
}

document.addEventListener('click', function (e) {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const label = _phCTALabel(a);
  if (!label) return;
  posthog.capture('cta_clicked', {
    label: label,
    page: phPage,
    location: _phCTALocation(a),
  });
});
```

- [ ] **Step 3: Verify CTA tracking in console**

With debug mode still on, open `index.html` in a browser and click:
1. The "Check Availability" button in the hero
2. The "Book Now" nav link
3. The "Book a Tour" tours-section button

In the browser console, confirm you see PostHog debug output like:
```
[PostHog] capture cta_clicked {label: "book_direct", page: "index", location: "home"}
[PostHog] capture cta_clicked {label: "book_direct", page: "index", location: "nav"}
[PostHog] capture cta_clicked {label: "book_tour_facebook", page: "index", location: "tours"}
```

Also open `tours.html` and click "Book a Tour on Facebook" — expect `label: "book_tour_facebook"`, `page: "tours"`.

- [ ] **Step 4: Remove debug line**

Delete the `posthog.debug();` line added in Step 1.

- [ ] **Step 5: Commit**

```bash
git add main.js
git commit -m "feat: add cta_clicked event tracking to all pages"
```

---

## Task 2: Add section_viewed tracking to main.js

**Files:**
- Modify: `main.js` (append after the CTA block from Task 1)

- [ ] **Step 1: Append section observer code to main.js**

Add immediately after the CTA tracking block (end of `main.js`):

```js
// Section visibility tracking
const _phSectionObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const section = el.id || el.dataset.phSection;
    if (!section) return;
    posthog.capture('section_viewed', { section: section, page: phPage });
    _phSectionObserver.unobserve(el);
  });
}, { threshold: 0.3 });

document.querySelectorAll('section[id]:not(#home), section[data-ph-section]').forEach(function (el) {
  _phSectionObserver.observe(el);
});
```

**How it works:** The observer fires when 30% of a `<section>` is visible. It fires once then stops watching that element (`unobserve`). On `index.html` it targets all `section[id]` elements except `#home` (the hero — always visible). On `trails.html` and `tours.html` it targets `section[data-ph-section]` elements added in Task 3.

- [ ] **Step 2: Add debug mode temporarily and verify**

Add `posthog.debug();` after `posthog.init(...)` again. Open `index.html` and scroll slowly through the page. Confirm you see console output like:

```
[PostHog] capture section_viewed {section: "trails", page: "index"}
[PostHog] capture section_viewed {section: "retreat", page: "index"}
[PostHog] capture section_viewed {section: "reviews", page: "index"}
[PostHog] capture section_viewed {section: "book", page: "index"}
```

Also confirm: scrolling back up and down does NOT fire a second event for the same section.

- [ ] **Step 3: Remove debug line**

Delete the `posthog.debug();` line.

- [ ] **Step 4: Commit**

```bash
git add main.js
git commit -m "feat: add section_viewed IntersectionObserver tracking"
```

---

## Task 3: Add data-ph-section to trails.html and tours.html

**Files:**
- Modify: `trails.html` (one attribute addition)
- Modify: `tours.html` (one attribute addition)

This enables the `_phSectionObserver` from Task 2 to fire on the bottom CTA sections of these pages, telling us whether a visitor scrolled all the way through the content.

- [ ] **Step 1: Add data-ph-section to trails.html CTA section**

Find the bottom CTA section in `trails.html` (line ~272). It currently reads:

```html
<section class="cta-section">
```

Change it to:

```html
<section class="cta-section" data-ph-section="cta_bar">
```

- [ ] **Step 2: Add data-ph-section to tours.html CTA section**

Find the bottom CTA section in `tours.html` (line ~188). It currently reads:

```html
<section class="cta-section">
```

Change it to:

```html
<section class="cta-section" data-ph-section="cta_bar">
```

- [ ] **Step 3: Verify section_viewed fires on trails and tours**

Add `posthog.debug();` temporarily, open `trails.html`, scroll to the bottom. Confirm:
```
[PostHog] capture section_viewed {section: "cta_bar", page: "trails"}
```

Do the same on `tours.html` — expect `page: "tours"`.

- [ ] **Step 4: Remove debug line and commit**

Delete `posthog.debug();`, then:

```bash
git add trails.html tours.html main.js
git commit -m "feat: add section tracking to trails and tours pages"
```

---

## Task 4: Rebuild PostHog Dashboard via MCP

**No files changed** — all changes are in PostHog via MCP tool calls.

Current state: dashboard id `1519824` named "My App Dashboard" with 6 generic insights (ids: 8238020, 8238021, 8238022, 8238023, 8238024, 8238025).

- [ ] **Step 1: Rename the dashboard**

Use `mcp__posthog__dashboard-update` with:
```
id: 1519824
name: "Hatfield McCoy Basecamp"
description: "Booking funnel, CTA clicks, page traffic, and traffic sources for the rental property."
```

- [ ] **Step 2: Delete the 6 default insights**

Call `mcp__posthog__insight-delete` once for each of these IDs: `8238020`, `8238021`, `8238022`, `8238023`, `8238024`, `8238025`.

- [ ] **Step 3: Create Insight 1 — Page traffic breakdown**

Use `mcp__posthog__insight-create` with:
```
name: "Page traffic breakdown"
description: "Pageviews by page (home, trails, tours) over 30 days"
query: TrendsQuery
  series: [{ kind: EventsNode, event: "$pageview", custom_name: "Pageviews", math: "total" }]
  breakdownFilter: { breakdown: "$pathname", breakdown_type: "event" }
  dateRange: { date_from: "-30d" }
  trendsFilter: { display: "ActionsBar" }
dashboards: [1519824]
```

- [ ] **Step 4: Create Insight 2 — Booking CTA clicks**

Use `mcp__posthog__insight-create` with:
```
name: "Booking CTA clicks"
description: "Trend of book_direct CTA clicks over 30 days — primary conversion metric"
query: TrendsQuery
  series: [{
    kind: EventsNode,
    event: "cta_clicked",
    custom_name: "Book Direct clicks",
    math: "total",
    properties: [{ key: "label", value: "book_direct", operator: "exact", type: "event" }]
  }]
  dateRange: { date_from: "-30d" }
  trendsFilter: { display: "BoldNumber" }
dashboards: [1519824]
```

- [ ] **Step 5: Create Insight 3 — All CTA clicks by type**

Use `mcp__posthog__insight-create` with:
```
name: "CTA clicks by type"
description: "All CTA clicks broken down by label — which actions visitors take"
query: TrendsQuery
  series: [{ kind: EventsNode, event: "cta_clicked", custom_name: "CTA clicks", math: "total" }]
  breakdownFilter: { breakdown: "label", breakdown_type: "event" }
  dateRange: { date_from: "-30d" }
  trendsFilter: { display: "ActionsBarValue" }
dashboards: [1519824]
```

- [ ] **Step 6: Create Insight 4 — Section engagement funnel**

Use `mcp__posthog__insight-create` with:
```
name: "Section engagement funnel"
description: "Visitor drop-off: pageview → saw reviews → saw book section → clicked Book Now"
query: FunnelsQuery
  series: [
    { kind: EventsNode, event: "$pageview", custom_name: "Landed on site" },
    { kind: EventsNode, event: "section_viewed", custom_name: "Saw Reviews section",
      properties: [{ key: "section", value: "reviews", operator: "exact", type: "event" }] },
    { kind: EventsNode, event: "section_viewed", custom_name: "Reached Book section",
      properties: [{ key: "section", value: "book", operator: "exact", type: "event" }] },
    { kind: EventsNode, event: "cta_clicked", custom_name: "Clicked Book Now",
      properties: [{ key: "label", value: "book_direct", operator: "exact", type: "event" }] },
  ]
  funnelsFilter: { funnelWindowInterval: 14, funnelWindowIntervalUnit: "day", funnelOrderType: "ordered" }
  dateRange: { date_from: "-30d" }
dashboards: [1519824]
```

- [ ] **Step 7: Create Insight 5 — Traffic sources**

Use `mcp__posthog__insight-create` with:
```
name: "Traffic sources"
description: "Where visitors are coming from — direct, Google, Airbnb, Facebook"
query: TrendsQuery
  series: [{ kind: EventsNode, event: "$pageview", custom_name: "Pageviews", math: "total" }]
  breakdownFilter: { breakdown: "$referring_domain", breakdown_type: "event" }
  dateRange: { date_from: "-14d" }
  trendsFilter: { display: "ActionsTable" }
dashboards: [1519824]
```

- [ ] **Step 8: Verify dashboard**

Use `mcp__posthog__dashboard-get` with id `1519824` and confirm:
- Name is "Hatfield McCoy Basecamp"
- 5 tiles are present
- No tiles from the old default insights remain

---

## Verification Checklist (post all tasks)

- [ ] Open `index.html`, click every CTA type — confirm events appear in PostHog Activity (`https://us.posthog.com/project/401171/activity/explore`)
- [ ] Scroll through all three pages — confirm `section_viewed` events fire with correct `section` and `page` values
- [ ] Open PostHog dashboard 1519824 — confirm 5 insights are present and named correctly
- [ ] Confirm no `posthog.debug()` lines remain in `main.js`
