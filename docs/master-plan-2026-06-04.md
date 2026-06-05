---
type: reference
last-updated: 2026-06-04
org: The Knowing Agency
client: CNC Foundations
tags: [cnc, dashboard, plan, tka-priority]
summary: Master execution plan for CNC dashboard — all pending changes as of Jun 4, 2026. Phases execute consecutively. Each phase is self-contained.
---

# CNC Dashboard + Emails — Master Plan (Jun 4, 2026)

> Single source of truth. Read this at the start of every session before touching code.
> Dashboard file: `01-THE-KNOWING-AGENCY/projects/cnc-dashboard/index.html` (1,840 lines)
> Live URL (pending push): https://rodrigovittori.github.io/cnc-dashboard
> Git remote: https://github.com/rodrigovittori/cnc-dashboard.git

---

## Phase 0 — Discovery Results (DONE — Do Not Repeat)

**Sources read:** index.html (1,840 lines), HANDOFF.md, apps-script-data.gs, dashboard-redesign-plan.md

**Current state:**
- Data: baked-in constants (BDMS, MEMBERSHIPS_2026, SPONSORSHIPS_2026, EVENTS_2026) — NOT live-fetched
- `APPS_SCRIPT_URL = null` at line 757 — never deployed
- Login: `admin / CNC_preview_26` (line 1824)
- All 6 pages already exist in nav and have init functions
- GitHub push NOT yet done — site is not live

**Already-fixed issues (do NOT re-fix):**
- Memberships title: already says "All 2026 Memberships" (line 645)
- Spon label: renders as full "Sponsorship" (line 1131)
- Expense Overview nav: `nav-expense` exists at line 461
- 3-tier sort in cards (status > events > spend): already implemented at lines 1204–1208

**Confirmed bugs (fix in Phase 2):**
- Survey URL: demo form `1FAIpQLSdOSlYk5vL2yWtuOhP3F5oTYrVt0_WsMtD7cPTHDUDiEQkOiw` at lines 708 and 741
- ddTabSwitch (lines 1434–1439): queries `#${panelId} .dd-tab-content` but content divs are siblings, not children — causes tab overlap on switch
- Rankings tab: may have a separate sort inside initStatus() — verify at lines 1182–1400

**Key function registry:**
| Function | Line |
|----------|------|
| `initExpense()` | 992 |
| `sbTab()` | 1175 |
| `initStatus()` | 1182 |
| `ddSort()` | 1401 |
| `renderDDTiles()` | 1408 |
| `ddTabSwitch()` | 1434 |
| `initDrilldown()` | 1454 |
| `evtSortBy()` | 1585 |
| `renderEventsTable()` | 1614 |
| `initEvents()` | 1636 |
| `initMemberships()` | 1658 |
| `loadLiveData()` | 1768 |
| `showPage()` | 1799 |
| `doLogin()` | 1821 |

**Anti-patterns (never do these):**
- Do NOT modify any Google Sheets, Google Docs, or Drive files
- Do NOT hardcode dollar amounts in markup or JS strings
- Do NOT use `innerHTML` without `esc()` wrapping
- Do NOT touch Brittany's original spreadsheet

---

## Phase 1 — Email: Airtable Reply to Christene

**Trigger:** Reply to thread "End-of-Day Summary - May 28" (thread ID: 19e717f7ddb9bfd2)

**Context:** Christene replied twice May 29. First said "prefer GHL." Then followed up same day: "I completely recant — trust you 100%. Let's go with Airtable. Let me know cost and what you need." Never got a reply.

**Action:** Send one reply that closes both messages.

**Draft (send as-is or adjust tone):**
```
Hi Christene,

Thank you — that means a lot, and I'll run with it.

Airtable's Team plan runs $20/user/month billed annually (about $60/month
for the two of us plus Brittany). There's also a free tier that covers up
to 1,000 records if we want to start there and upgrade once the data grows.

To move forward I just need: (1) your go-ahead to create the account under
a TKA email, and (2) billing approval when we're ready to upgrade.

I'll set it up and have a base ready to show you shortly.

Best,
Rodrigo
```

**Verification:** Thread shows as read, no pending reply.

---

## Phase 2 — Critical Bug Fixes

Read index.html before starting. Make all changes in a single editing session. Push once at the end.

### Fix 2A — Replace Survey URL (lines 708 and 741)

**What:** Replace demo form with Brittany's real BDM survey.

**Old form ID:** `1FAIpQLSdOSlYk5vL2yWtuOhP3F5oTYrVt0_WsMtD7cPTHDUDiEQkOiw`
**New form URL:** `https://docs.google.com/forms/d/e/1FAIpQLSel6rxTnH8X0lZHk-UkdonzIlyzVt1v2i7giM08HqBAXkYHrw/viewform`
**New form ID:** `1FAIpQLSel6rxTnH8X0lZHk-UkdonzIlyzVt1v2i7giM08HqBAXkYHrw`

**Line 708 — CTA button:** Replace href with new viewform URL
**Line 741 — iframe src:** Replace form ID in embedded src

Pattern to copy (from line 741, update form ID only):
```html
<iframe src="https://docs.google.com/forms/d/e/1FAIpQLSel6rxTnH8X0lZHk-UkdonzIlyzVt1v2i7giM08HqBAXkYHrw/viewform?embedded=true" width="100%" height="820" frameborder="0" style="border:1px solid var(--border);border-radius:3px;display:block;">Loading…</iframe>
```

**Verification:** Grep for old form ID — zero results.

---

### Fix 2B — Zero Out $23,151 Memberships Variance

**What:** The $23,151 variance is a placeholder in the hardcoded MEMBERSHIPS_2026 array (lines 774–796). Find the entry or entries with inflated Actual vs Budgeted values that sum to ~$23,151 variance and set Actual = Budgeted for each placeholder row.

**How:**
1. Read lines 774–796 — identify MEMBERSHIPS_2026 array entries
2. For each row: if Actual - Budgeted contributes to the $23,151 total, set `actual: [same value as budgeted]`
3. Do NOT hardcode a new dollar amount — match actual to budgeted (variance = 0)

**Verification:** After change, `initMemberships()` should compute total variance of $0 or near-zero for placeholder rows. Grep MEMBERSHIPS_2026 — no entry should have `actual` dramatically different from `budgeted`.

---

### Fix 2C — ddTabSwitch Tab Overlap Bug (lines 1434–1439)

**What:** Tab content divs are siblings of `#dd-evt-tabs`, not children — so `querySelectorAll('#dd-evt-tabs .dd-tab-content')` finds nothing, leaving old tab visible when switching.

**Current code (lines 1434–1439):**
```javascript
function ddTabSwitch(btn, tabId, panelId) {
    document.querySelectorAll(`#${panelId} .dd-tab`).forEach(t => t.classList.remove('active'));
    document.querySelectorAll(`#${panelId} .dd-tab-content`).forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    $id(tabId).classList.add('active');
}
```

**Fix — replace with:**
```javascript
function ddTabSwitch(btn, tabId) {
    const panel = btn.closest('.drilldown-panel');
    panel.querySelectorAll('.dd-tab').forEach(t => t.classList.remove('active'));
    panel.querySelectorAll('.dd-tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    $id(tabId).classList.add('active');
}
```

**Also update all callers:** Search for `ddTabSwitch(this,` — remove the third argument from every call.
Example: `onclick="ddTabSwitch(this,'dd-tab-2026','dd-evt-tabs')"` → `onclick="ddTabSwitch(this,'dd-tab-2026')"`

**Verification:** Grep `ddTabSwitch` — no call should have three arguments. Switch tabs in drilldown view — content changes without overlap.

---

### Fix 2D — Rankings Tab Tiebreaker (verify + fix if needed)

**What:** Rankings tab inside BDM Status Board may have a separate sort that doesn't handle ties.

**Where:** Inside `initStatus()` (lines 1182–1400). Search for a second `.sort(` call that sorts by events only without a tiebreaker.

**If found — fix pattern:**
```javascript
// Before (events-only sort):
.sort((a, b) => b.evts - a.evts)
// After (events + spend tiebreaker):
.sort((a, b) => b.evts - a.evts || a.total - b.total)
```

**If not found:** Skip — cards sort already handles it.

**Verification:** Check initStatus() for more than one `.sort(` call. If only one (line 1204), this is done.

---

### Fix 2E — Push to GitHub

After all fixes above are committed:
```
git add index.html
git commit -m "Fix survey URL, zero variance, fix ddTabSwitch tab overlap"
git push origin master
```

If first push: set up GitHub Pages in repo settings → Source: Deploy from branch → master → / (root).

**Verification:** `https://rodrigovittori.github.io/cnc-dashboard` loads and login works.

---

## Phase 3 — Google Apps Script Deploy (Manual — 10 Min)

**Not code. Rodrigo does this manually.**

1. Open `apps-script-data.gs` in this repo
2. Go to script.google.com → New project
3. Paste the full contents of apps-script-data.gs
4. Deploy → New deployment → Web app
   - Execute as: Me
   - Who has access: Anyone
5. Copy the deployed web app URL
6. Paste into index.html line 757:
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_ID/exec';
   ```
7. Commit + push

**Source IDs already in apps-script-data.gs:**
- BDM Memberships 2026: `1iVrq8je5yf1q0_jrqUCtbWIv7UekEzPZsVSoLz24thQ`
- CNC BDM Report 2025: `18haHWoecqRSBo_ga3jQtW9N6xS1urEMoU_s0yykXqQg`
- Form Responses: TBD (get sheet ID from Google Form responses destination)

**Verification:** After deploy, login to dashboard → open browser console → no fetch errors → data loads from live sheets instead of hardcoded constants.

---

## Phase 4 — UI Review Fixes (Jun 3, 2026 Design Changes)

Read index.html before starting. These are visual/UX improvements — no data wiring changes.

### 4A — Expense Overview

1. **Section divider:** Add a horizontal rule with year label between 2026 live data section and 2025 historical charts. Pattern: `<div class="section-divider"><span>2025 Historical</span></div>` — add CSS for `.section-divider` with centered label.

2. **Line chart title:** Locate the chart title for the 2025 historical line chart inside `initExpense()` and rename to: `"2025 FULL-YEAR ACTUAL EXPENSES VS BUDGET - ADVERTISING"`

3. **Line chart conditional coloring:** Actual line segments turn red where actual value exceeds the budget line. In Chart.js v4 this requires a segment coloring callback. Pattern:
   ```javascript
   segment: {
     borderColor: ctx => ctx.p1.parsed.y > budgetAtIndex(ctx.p1DataIndex) ? '#C4242D' : '#000000'
   }
   ```
   Where `budgetAtIndex(i)` returns the budget value for that data point.

4. **Over-budget KPI cards:** All 4 KPI cards (not just Combined Spend) apply red class when value exceeds budget. Find the conditional class logic in `initExpense()` and extend it to all 4 cards.

5. **KPI card normalization:** Check CSS for `.kpi-card` — ensure all 4 have identical padding and style. No hardcoded inline styles on individual cards.

6. **No hardcoded dollar strings in titles:** Grep for any title strings inside `initExpense()` that contain literal `$` + number. Replace with `${fmt$(computedVar)}` pattern.

---

### 4B — BDM Status Board

1. **Top panel tabs — verify current state:** Read `initStatus()` (lines 1182–1400) and check if the 4 tabs (Status Distribution, Rankings, Spend Analytics, Activity) already exist. If yes, skip to next item. If not, they need to be built — see `dashboard-redesign-plan.md` lines 265–270 for full spec.

2. **Color reference block:** If a standalone color legend/key block exists on BDM cards (not in Tab 1 donut legend), remove it.

3. **Headshot placeholder:** Each BDM card should have a rectangle placeholder on the right side (grey box, no image). Add if missing.

4. **Fire + crown emoji:** BDM with most YTD events → append 🔥 to name. BDM with best $/event ratio → append 👑. Computed in `initStatus()`, never hardcoded.

---

### 4C — BDM Drilldown

1. **Sort controls above tiles:** Verify `ddSort()` at line 1401 is wired to actual sort buttons above the tile grid. If buttons exist but don't trigger ddSort, wire them. If buttons are missing, add them: A-Z | By Status | By Events | By Spend.

2. **KPI row 2026 only:** Read `initDrilldown()` (line 1454) — remove any 2025 Activity Spend KPI card if present.

3. **Event status pills:** Verify `pillHtml()` at line 1441 handles all 6 labels: Held (green) | Upcoming (blue) | Scheduled (grey) | Not Approved (red) | Dismissed (amber) | Cancelled (dark red) | NO DATA (off-white). Add missing labels.

4. **Empty state:** Inside `initDrilldown()`, if a BDM has zero events, render: `<p class="empty-state">No events recorded for this period.</p>` instead of an empty table.

5. **Calendar placeholder:** Ensure a placeholder card exists for upcoming events with "Calendar integration coming soon" or similar neutral text.

---

### 4D — Events Tracker

1. **List/Calendar toggle:** Verify `evtView()` at line 1578 is wired to a toggle button. If button missing, add at top-right of Events Tracker page: `<button onclick="evtView('list')">List</button> <button onclick="evtView('calendar')">Calendar</button>`. Calendar view = placeholder panel only.

2. **Expenses column:** Add an "Expenses" column to the events table in `renderEventsTable()` (line 1614). Value: `—` for all rows (no per-event cost data yet). Header should be sortable (wire to `evtSortBy()`).

3. **Multi-level sort:** `evtSortBy()` currently sets a primary sort. Add a `secondarySort` variable that stores the previous primary. `renderEventsTable()` should apply primary then secondary. Default: Date descending.

---

### 4E — Memberships

1. **Conditional row color:** In `initMemberships()` (line 1658), when rendering each row, compare `actual` to `budgeted`. If `actual > budgeted`: apply class `over-budget` (red text on total). If `actual <= budgeted`: apply class `on-budget` (green/blue). Never a hardcoded class name — computed: `actual > budgeted ? 'over-budget' : 'on-budget'`.

2. **Rename "Anticipated EOY":** Search `initMemberships()` for the string "Anticipated EOY" and change to "Projected EOY Variance". Formula stays the same: `(actual / monthsElapsed) * 12 - fullYearBudget`.

3. **Title strings from computed vars:** Search `initMemberships()` for any section header containing a hardcoded `$` amount. Replace with template literal using computed variable.

---

### Phase 4 Verification

- [ ] Grep `innerHTML` — all instances use `esc()` on user-sourced data
- [ ] Grep for hardcoded dollar amounts in JS strings — zero results
- [ ] All 6 pages load without console errors
- [ ] Commit: `UI review fixes: expense divider, status board tabs, drilldown empty states, events sort, memberships conditional color`
- [ ] Push to GitHub

---

## Phase 5 — Auth Upgrade (Prerequisite for Domain Launch)

**Trigger:** Before pointing foundationfirstmarketing.com domain at dashboard.

**What:** Replace `doLogin()` at line 1821 (hardcoded `admin / CNC_preview_26`) with a proper auth flow.

**Minimum viable auth for this context:**
- Role-based: Admin (Christene), Manager (Brittany), BDM (read-only, filtered to own data)
- Session cookie (not localStorage) with expiry
- Credentials NOT in the HTML file — move to a backend check via Apps Script or a simple Vercel serverless function

**Pattern to follow:** Apps Script web app (already deployed in Phase 3) can handle a `?action=login` endpoint.
- POST username + password to Apps Script
- Apps Script validates against a sheet or hardcoded allowed list
- Returns a session token (UUID)
- Dashboard stores token in sessionStorage, verifies on each page load

**Verification:**
- [ ] Old hardcoded `admin / CNC_preview_26` removed from index.html
- [ ] Login fails with wrong credentials
- [ ] Session expires after browser close
- [ ] Three roles tested: admin, manager, bdm

---

## Phase 6 — Domain Setup (foundationfirstmarketing.com)

**Prerequisite:** Phase 5 (auth) complete. DNS registrar identified (not GHL).

**Option A — GitHub Pages (fastest):**
1. Add `CNAME` file to repo root: `dashboard.foundationfirstmarketing.com`
2. In GitHub repo → Settings → Pages → Custom domain → enter same
3. DNS registrar: add `CNAME` record: `dashboard` → `rodrigovittori.github.io`
4. Enable "Enforce HTTPS"

**Option B — Vercel (recommended for production):**
1. Import GitHub repo to Vercel (free tier)
2. Vercel project → Settings → Domains → add `dashboard.foundationfirstmarketing.com`
3. DNS registrar: `CNAME` → `cname.vercel-dns.com`

**Open question:** Who controls the DNS registrar for foundationfirstmarketing.com? (GHL confirmed: no. Registrar unknown — ask Christene or check WHOIS.)

**Verification:** `https://dashboard.foundationfirstmarketing.com` loads, login works, HTTPS active.

---

## Execution Order (This Session)

1. Phase 1 — Email (5 min, do first while at desktop)
2. Phase 2 — Bug fixes + push (30–45 min)
3. Phase 3 — Apps Script deploy (10 min manual, do immediately after Phase 2)
4. Phase 4 — UI review fixes (60–90 min)
5. Phase 5 — Auth upgrade (schedule for next session or this evening)
6. Phase 6 — Domain (after auth is done)

---

## Carry Forward (Not This Session)

- Form Responses sheet ID: ask Rodrigo — needed for Phase 3 to complete Apps Script wiring
- Brittany 1:1 scheduling: Thursday recurring, 6–8:30 AM PT — pending confirmation
- Airtable account setup: pending Christene's billing approval reply
- /handoff skill build: tonight, separate from dashboard work

## Known Bugs (do not push fixes without review)

### Mobile layout — chart legends cut off
- Observed: Jun 5, 2026 — mobile Chrome on Android
- Symptom: Chart.js legends render to the right of charts by default; on mobile viewport this causes horizontal overflow and legends are clipped off-screen. Visible on Spend by Type donut chart and BDM revenue bar chart.
- Fix needed: force legend `position: 'bottom'` on mobile breakpoints; audit all Chart.js instances for overflow; ensure chart wrapper divs don't exceed viewport width.
- Priority: low — cosmetic, desktop unaffected.

---

## Pending Placeholders / Features to Add (post-meeting)

### Budget Reconciliation tab
- Source: Brittany feedback — "We may want to add a step to reconcile event expenses with the budget. The reconciled budget will always be one month behind — reconcile April in May, May in June."
- What to build: a new page or tab on Expense Overview showing actual vs. budgeted per category, one month offset. Month selector: view April reconciliation in May, etc.
- Placeholder first: card saying "Monthly Budget Reconciliation — coming once Airtable is connected. Compares actual charges vs. budget from the previous month."
- Depends on: Airtable setup with structured expense entry per month.

### Elephant Status (Relationship Rating)
- Source: Voice notes + CNC discovery calls — Tom's concept, 1–5 scale, warmth of GC relationships. 5 = active jobs together. 1 = cold/elephant in the room.
- What to build: a field on each BDM's association list inside the Drilldown page. "Relationship Rating: 1–5 — Not captured yet."
- Placeholder first: add a "Relationship Rating" row to the memberships panel in BDM Drilldown with value "Not captured — coming with Airtable CRM layer."
- Depends on: Airtable CRM layer + BDM input workflow. Cannot be automated — BDM must rate manually.
- Strategic note: this is the core of the relationship intelligence model. If Christene confirms that direction in today's meeting, this becomes the first field to design in Airtable.

---

## Anti-Patterns Reminder

- Never hardcode dollar amounts
- Never innerHTML without esc()
- Never modify Brittany's original spreadsheet
- Never add Claude co-author lines to git commits
