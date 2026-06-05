---
type: reference
last-updated: 2026-06-02
org: The Knowing Agency
client: CNC Foundations
tags: [cnc, dashboard, plan, redesign, tka-priority]
summary: Phased plan for CNC dashboard redesign — new expense overview, BDM drilldown, and status board pages. No online files modified. Awaiting real sheet IDs from user.
---

# CNC Dashboard Redesign Plan

> Single source of truth for the dashboard rebuild. Phases execute consecutively in new sessions.
> The dashboard is a single-file GitHub Pages site: `01-THE-KNOWING-AGENCY/projects/cnc-dashboard/index.html`

---

## Files Awaiting Drive Links

Before Phase 3 (implementation) can begin, the following files must be copied to TKA Drive.
User copies them manually; returns the new spreadsheet ID(s) to replace placeholders in the code.

| File | Original Owner | Tabs Needed | What It Powers |
|------|---------------|-------------|---------------|
| Brittany's 2026 Tracking Spreadsheet | Brittany Dixon | Memberships 2026, Sponsorships 2026, Events, Association Contacts | All financial + event data in dashboard |
| Google Form Responses sheet | TKA / Google Forms | Form Responses 1 | Survey submission table |

**Current placeholder IDs in `index.html` `SHEETS` object (lines 722–726):**
```
events:      17edvipl3HGNqhxxnP5cfV2HdsiMl3tduuahyZL38URs  ← placeholder
memberships: 11Uoo0y0rG9mObSmzHFrI7bMqzBfu34TU8Hw6kZ-I5Zs  ← placeholder
responses:   1TCGl8X4P2zdq72bGW8nFZcvudgwKpy1w4iP2Pv-jd9I  ← placeholder
```

**Brittany's real spreadsheet ID (not yet wired in):**
`11-xuMti4uFSSQdVLu4Jh1XniGvC_cd5JfFrHjhIZ-Tk`

Once user shares TKA Drive copy link → extract ID → update SHEETS object.
A single copied spreadsheet can serve all tabs via `&sheet=TabName` in the gviz/tq URL.

---

## Current Dashboard Audit

**Pages (sidebar):** Overview, Events Tracker, Memberships, Post-Event Survey
**Data sources:** 3 Google Sheets (all placeholder IDs — data does not load yet)
**Tech stack:** Single HTML file, Montserrat + Open Sans fonts, vanilla JS, Google Sheets gviz/tq JSON API
**Login:** admin / CNC_preview_26
**Deployed:** GitHub Pages

**What works well (keep):**
- Login flow and app shell
- CSS design system (CNC red, dark header, card layout, heatmap classes)
- `fetchSheet()` + `esc()` XSS protection pattern
- Events Tracker table structure
- Post-Event Survey page and embedded form

**What is missing or needs redesign:**
- No financial data (budget vs actual, totals, variances)
- No individual BDM view
- No BDM status board (at-a-glance health per BDM)
- Filters exist visually but are not wired to data
- Donut chart and bar charts in Overview are hardcoded — not data-driven
- Renewal pipeline shows all zeros

---

## New Page Architecture (6 Pages)

| # | Page | Replaces / New | Primary Data Source |
|---|------|---------------|-------------------|
| 1 | Expense Overview | Replaces current Overview | Memberships 2026 + Sponsorships 2026 tabs |
| 2 | BDM Drilldown | New | All tabs (filtered by BDM) |
| 3 | BDM Status Board | New | Events + Memberships tabs |
| 4 | Events Tracker | Keep + enhance | Events tab |
| 5 | Memberships | Keep + enhance | Memberships 2026 tab |
| 6 | Post-Event Survey | Keep as-is | Form Responses 1 tab |

---

## Phase 0 — Completed (Documentation Discovery)

**Sources consulted:**
- `index.html` — full read (953 lines)
- `HANDOFF.md` — dashboard state + sheet IDs
- `cnc-event-process-map.md` — data fields available per stage
- Session context: Brittany spreadsheet structure confirmed (tabs: Memberships 2026, Sponsorships 2026, Events, Association Contacts)
- Known data: $19,297 actual memberships vs $16,945 budget; $14,964 sponsorships; 28 events Jan–Jun 2026; 12 BDMs

**Allowed APIs (confirmed):**
- Google Sheets gviz/tq: `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:json&sheet={TabName}&headers=1`
- Response format: `json.table.cols` (headers) + `json.table.rows` (data)
- Parse: `text.substring(47).slice(0, -2)` to strip gviz wrapper
- XSS: `esc()` helper already implemented — must use on all interpolated values

**Column names from Brittany's spreadsheet (confirmed from May session read):**
- Memberships 2026: BDM, Association, Annual Cost, Budgeted, Actual, Variance, Renewal Month, Status
- Sponsorships 2026: BDM, Event/Association, Amount, Budgeted, Actual, Date
- Events tab: BDM, Organization, Event Date, Type, Territory (28 rows Jan–Jun 2026)
- Association Contacts: 19 entries

**Anti-patterns to avoid:**
- Do NOT modify any Google Sheets, Google Docs, or Drive files
- Do NOT hardcode dollar amounts — always read from fetched data
- Do NOT use `innerHTML` without `esc()` wrapping

---

## Phase 1 — Brittany Email (Quick — Do First)

**Objective:** Draft and save email to Brittany asking for a Friday Jun 6 working session if no word from Christene by EOD Thursday.

**Output:** Append to `99-LOGS/email-drafts-2026-06-02.md`

**Draft:**

---
To: Brittany Dixon
Subject: Working session this week — checking in

Hi Brittany,

I wanted to check in about the Thursday meeting — given Christene is out this week, I wasn't sure if it was still on your calendar or if we should adjust.

If it works for you, I'd love to set up a direct working session on Friday instead. I have several things I'd like to walk through with you, including the dashboard, the BDM table in the automation doc, and a few questions from reviewing your notes this week.

Happy to work around your schedule — just let me know what time works best.

Best,
Rodrigo
---

**Save as file:** `99-LOGS/brittany-comment5-reply-draft.md` — see Phase 1B below.

---

## Phase 1B — Brittany Comment #5 Reply (Save as File)

**Objective:** Save the draft reply to Brittany comment #5 so it can be sent tomorrow.

**File:** `99-LOGS/brittany-comment5-reply-draft.md`

**Content:**
Comment #5 was about the BDM Event Source table — specifically who the BDMs are and their territories.

Draft reply:
> "We have the full territory mapping for most BDMs already. I wanted to confirm two things before finalizing the table: Could you confirm Brian's last name and territory (I have him listed as 'new hire Jun 2026 — TBD'), and whether Cari-Ellen Edgin is still active? She has limited event activity in Virginia per our records. Once confirmed I'll update the BDM table in the doc."

---

## Phase 2 — Dashboard Data Architecture Design

**Objective:** Define exactly what data each new page needs and how to fetch it from the real spreadsheet. No code written yet.

**Skill to invoke:** `code-mode` (for technical precision)

### Page 1: Expense Overview

KPI row (4 scorecards):
- Total Spend YTD = SUM(Memberships Actual) + SUM(Sponsorships Actual)
- Budget YTD = SUM(Memberships Budgeted) + SUM(Sponsorships Budgeted)
- Variance = Total Spend - Budget (color: red if over, green if under)
- Events Count = COUNT(Events tab rows)

Charts (all data-driven):
- Category breakdown donut: Memberships vs Sponsorships vs Event-only spend
- Monthly spend bar chart: group Events tab by month → sum costs per month
- BDM spend ranking table: one row per BDM, columns: Memberships $, Sponsorships $, Total, Budget, Variance

Filters (functional, not cosmetic):
- BDM selector → filters all charts and table
- Month selector → filters events and monthly chart
- Category selector → Memberships / Sponsorships / Events

### Page 2: BDM Drilldown

Selector: 12-tile BDM picker at top (replace or augment sidebar)

For selected BDM:
- KPI row: YTD spend, Event count, Membership count, Last event date
- Monthly spend table: Jan–Jun columns, membership + sponsorship rows, total row
- Delta badge: current month vs previous month ($ and %)
- Events list: filtered to this BDM — date, name, org, type, cost
- Memberships list: filtered to this BDM — association, cost, renewal month

### Page 3: BDM Status Board

12-card grid (one card per BDM):
- BDM name + territory
- Upcoming events count (next 30 days)
- Survey pending count
- Last activity date
- Status badge: Green (active), Yellow (survey pending >5 days), Red (no event in 60+ days)

Cards click → navigate to BDM Drilldown for that BDM

### Page 4: Events Tracker (enhanced)

Keep current table. Add:
- Upcoming alert flag: events within 5 business days highlighted in red
- Sort by date (ascending, default)
- Functional filter pills wired to JS filter

### Page 5: Memberships (enhanced)

Keep current. Add:
- Budget column (Budgeted vs Actual per row)
- Variance column with red/green color
- Renewal pipeline: show $ amounts (not just count)

### Page 6: Post-Event Survey

Keep exactly as-is. No changes needed.

---

## Phase 3 — Dashboard Implementation

**Prerequisite:** User has provided TKA Drive copy links → sheet ID(s) confirmed.

**Skill to invoke:** `frontend-design:frontend-design` for layout + `code-mode` for data wiring

**Scope of changes to `index.html`:**

1. Update `SHEETS` object with real sheet IDs (lines 722–726)
2. Add new `SHEETS` entries:
   - `sponsorships` → Sponsorships 2026 tab
   - `contacts` → Association Contacts tab
3. Add new sidebar items: BDM Drilldown, BDM Status Board
4. Add new page divs: `page-expense`, `page-bdm`, `page-status`
5. Rewrite `renderOverview()` to be data-driven (remove hardcoded donut + bar values)
6. Add `renderExpense()` function — reads memberships + sponsorships, renders KPIs + charts
7. Add `renderBDMDrilldown(bdmName)` function — filters all data by BDM
8. Add `renderStatusBoard()` function — 12-card grid
9. Wire filter pills to actual filter logic
10. Update `loadAllData()` to fetch sponsorships + contacts tabs

**CSS additions needed:**
- BDM picker tile grid
- Status card grid (12 tiles)
- Delta badge (up/down arrow + $ + %)
- Progress bar for budget vs actual

**Commit message after implementation:**
`Redesign dashboard: expense overview, BDM drilldown, status board, real sheet IDs`

---

## UI Review — Jun 3, 2026 (all changes pending implementation)

### Cross-cutting rules
- No conditional logic hardcoded — all color, label, and value decisions computed from data at render time
- No dollar amounts hardcoded in markup or strings — always pulled from computed variables
- Remove all code comments referencing Claude before next push
- Google Apps Script web app to replace baked-in data constants (separate task, same session)

### Expense Overview
1. Add visual section divider between 2026 live data and 2025 historical charts with clear year labels
2. Rename line chart title to: "2025 FULL-YEAR ACTUAL EXPENSES VS BUDGET - ADVERTISING"
3. Line chart: actual line is black by default; segments turn red where actual exceeds budget line
4. All over-budget KPI card numbers turn red (conditional class, not hardcoded) — currently only Combined Spend does this
5. Normalize all 4 KPI cards to identical style and padding
6. All table/section title strings built from computed totals — zero hardcoded dollar amounts

### BDM Status Board
1. Top wide panel with 4 switchable tabs above the 12 cards:
   - Tab 1 Status Distribution: donut chart left (Active/Building/Light/Quiet counts), names grouped by status right
   - Tab 2 Rankings: F1-style podium (gold/silver/bronze, top 3 by YTD events) left; full timing-sheet ranked list right with position, name, YTD events, gap to leader; add small "last 30 days" secondary count next to each name
   - Tab 3 Spend Analytics: avg spend per BDM + avg cost per event left; right panel shows Most Efficient (green callout, lowest $/event) + Highest Spend (amber callout) + compact ranked table (name, total spend, events, $/event)
   - Tab 4 Activity: last-30-days summary (total events, active BDM count, most recent event date) left; ranked list by last event date right, color-coded green (active last 7 days) / amber (8-30 days) / red (30+ days quiet)
2. Color reference block removed from individual cards; lives only in Tab 1 pie legend
3. 12 BDM cards sort order: Status tier (Active first) > YTD events count (desc) > total spend (asc, lower = more efficient = higher rank)
4. Headshot placeholder rectangle on right side of each card
5. Fire emoji on BDM with most YTD events; crown emoji on BDM with best $/event ratio (can coexist on same person)
6. Tab default: Tab 1

### BDM Drilldown
1. Page name stays "BDM Drilldown"
2. Add sort controls above BDM selector tiles: A-Z | By Status | By Events | By Spend
3. KPI row shows 2026 data only — remove the 2025 Activity Spend KPI card
4. Events panel becomes tabbed: 2026 tab (event list + status pill tags) | 2025 tab (category spend breakdown only — no individual event records available)
5. Event status pills — shown as-is, never inferred from date. All possible labels:
   - Held (green) | Upcoming (blue) | Scheduled (grey) | Not Approved (red) | Dismissed (amber) | Cancelled (dark red) | NO DATA (off-white/light grey)
6. Empty state for BDMs with no events: "No events recorded for this period" — neutral icon, no broken table
7. Calendar placeholder card for upcoming events (UI shell only, real data later)
8. Only show year tabs for years with actual data — no fabricated tabs

### Events Tracker
1. Add List View / Calendar View toggle at top right (calendar view is placeholder UI for now)
2. Add Expenses column with dash placeholders (no per-event cost data yet)
3. All column headers sortable: Date | Event Name | Organization | BDM | Type | Expenses
4. Multi-level sort: clicking a column makes it primary; previous primary becomes secondary sort (remembered)
5. Within any primary sort group, secondary sort applies automatically
6. Default sort: Date descending (most recent first)

### Memberships
1. Conditional color on total charged vs budget: below budget = green/blue (CNC palette); above budget = red — computed in JS, never a hardcoded class
2. "Anticipated EOY" renamed to "Projected EOY Variance" — formula: (actual / months elapsed) * 12 - full-year budget
3. All table title strings (e.g. section headers showing totals) built from computed variables

### Post-Event Survey
No changes.

---

## Next Session — Pending Tasks (Jun 3, 2026 EOD)

### Must Do
1. **Google Apps Script** — deploy `apps-script-data.gs` as a web app from rodrigo.vittori@theknowingagency.com. Paste the deployed URL into `APPS_SCRIPT_URL` in index.html. Test live data fetch on login. Commit + push.
2. **Post-Event Survey submissions table** — add a responses table to the survey page. Requires: (a) get the Form Responses Google Sheet ID, (b) add that sheet to the Apps Script proxy as a 4th data source, (c) build the table UI on the survey page.
3. **Reconnect form to final files** — confirm the Google Form is writing to the TKA copy of the responses sheet, not Brittany's original. Update if needed.

### Quick Fixes (small, do next session)
4. **Rankings tiebreaker** — BDM Status Board > Rankings tab sorts by YTD events only. When two BDMs tie on events, the one defined first in the BDMS array wins. Fix: `sort((a,b) => b.evts - a.evts || a.total - b.total)` — same event count → lower spend ranks higher. One line change in `initStatus()` around line 1282.
5. **Expense Overview nav button** — add a top-nav button for Expense Overview to match the existing "BDM View" and "Status Board" quick-access buttons in the top bar.
6. **BDM Drilldown tab overlap bug** — switching between "2026 Events" and "2025 Spend" tabs causes content to overlap. Root cause: `ddTabSwitch` queries `#dd-evt-tabs .dd-tab-content` but the content divs are siblings of the tab bar, not children. Fix: replace the `panelId` parameter with `btn.closest('.drilldown-panel')` — same pattern as `sbTab`. Update all `onclick` callers to drop the third argument.
7. **BDM Drilldown panel restructure** — mixing 2026 events with 2025 spend in one tabbed panel is confusing. Proposed layout: Row 1 `grid-2` (events list left | calendar placeholder right, both same height via `align-items:stretch`). Row 2 full-width expenses panel with tabs: Memberships 2026 | Sponsorships 2026 | 2025 Historical Spend. Calendar height to auto-match events list height via flex stretch.
8. **Memberships table title wrong year** — section header reads "ALL 2024 MEMBERSHIPS", should be "ALL 2026 MEMBERSHIPS". Search for that string in `initMemberships()` and update.
9. **Spend by Type donut legend truncation** — "Sponsorship" label renders as "Spon" in the legend. Check the legend rendering in `initExpense()` — likely a container width issue, add `white-space:nowrap` or widen the flex container.

### Source file IDs for Apps Script
- BDM Memberships 2026: `1iVrq8je5yf1q0_jrqUCtbWIv7UekEzPZsVSoLz24thQ`
- CNC BDM Report 2025: `18haHWoecqRSBo_ga3jQtW9N6xS1urEMoU_s0yykXqQg`
- Form Responses sheet: TBD — get from Rodrigo next session

---

## Phase 4 — Deploy and Verify

1. `git add index.html`
2. `git commit -m "[message above]"`
3. `git push origin master` → triggers GitHub Pages deploy
4. Verify at live URL (from HANDOFF.md)
5. Login with admin / CNC_preview_26
6. Confirm all 6 pages load with real data

---

## Phase 5 — Pre-Logoff Checklist (Every Session)

- [ ] Save this plan file to flash drive
- [ ] Save print-list.md files to flash drive
- [ ] Confirm EOD log saved to Drive
- [ ] Run `/rodrigo-eod-handoff` skill

---

## Skills Map

| Phase | Skill to Use | Purpose |
|-------|-------------|---------|
| 1 | (inline) | Draft email — no skill needed |
| 2 | `code-mode` | Technical data architecture precision |
| 3 | `frontend-design:frontend-design` | Layout and visual design decisions |
| 3 | `code-mode` | JS data wiring |
| 4 | `verify` | Confirm live dashboard works after deploy |

---

## Session Handoff Notes

- Do NOT edit Brittany's original spreadsheet or any Google Doc/Drive file
- The gviz/tq API only works on publicly shared sheets — confirm TKA copies are shared "Anyone with link can view"
- Dashboard GitHub repo is in `01-THE-KNOWING-AGENCY/projects/cnc-dashboard/` — it is a separate git repo from the vault
- BDM list (12): Ed Lundberg, Haley McHugh, Molly Dyer, Jason Sherrer, Matt Katula, Shawn Lyons, Mitch Oakes, Erik Prather, Marty McLeary, Tyler Prazma, Zach Haake, Cari-Ellen Edgin (Brian TBD)
- Ryan Cox = BDM Manager, not a field BDM — exclude from BDM tiles
