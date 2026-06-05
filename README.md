# CNC Foundations — BDM Operations Dashboard

A browser-based business intelligence dashboard for CNC Foundations' Business Development Manager (BDM) team. Tracks sponsorships, memberships, events, and BDM performance across all territories. Built as a single HTML file, hosted on GitHub Pages, and connected to a live Google Sheets data source via Google Apps Script.

---

## Quick Links

| Resource | URL |
|----------|-----|
| Live Dashboard | `https://[org].github.io/cnc-dashboard` |
| Source Sheet (copy — do not edit originals) | See Apps Script section below |
| Apps Script API | Set in `index.html` → `APPS_SCRIPT_URL` |
| Post-Event Survey | Set in `index.html` → survey href and iframe |

---

## Repository Contents

```
cnc-dashboard/
├── index.html                        # The entire dashboard — single file
├── apps-script-data.gs               # Google Apps Script — live data API
├── README.md                         # This file
└── docs/
    ├── master-plan-2026-06-04.md     # Full execution plan — all phases, decisions, rationale
    └── dashboard-redesign-plan.md    # UI/UX redesign spec — layout, components, data flows
```

The `docs/` folder contains planning and design documents produced during development. They are not required to run the dashboard but provide full context for the decisions behind each phase of the build.

---

## How It Works

The dashboard has two data modes:

**Static mode (default):** On first load, the dashboard renders from baked-in JavaScript constants (`BDMS`, `MEMBERSHIPS_2026`, `SPONSORSHIPS_2026`, `EVENTS_2026`). These are hardcoded arrays defined at the top of `index.html`. This ensures the dashboard always shows something even if the live connection fails.

**Live mode:** When `APPS_SCRIPT_URL` is set (not `null`), the dashboard fetches fresh data from Google Sheets on every page load via the deployed Apps Script web app. Live data overwrites the static constants in-place. If the fetch fails, the dashboard silently falls back to static data and shows a `PREVIEW DATA` badge.

---

## Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Summary KPIs — total spend, events, memberships, top BDMs |
| **BDM Status Board** | All BDMs with cards — 4 tabs: Status Distribution, Rankings, Spend Analytics, Activity |
| **BDM Drilldown** | Per-BDM detail — events, sponsorships, memberships, notes |
| **Events** | Full event table with filters, outcome tracking, and post-event survey |
| **Memberships** | Association membership tracker with renewal calendar |
| **Expense Overview** | 2026 live budget vs. actual + 2025 historical advertising chart |
| **Data Roadmap** | Planned data infrastructure improvements and migration timeline |

---

## Setup and Deployment

### 1. Host on GitHub Pages

1. Create a new GitHub repository (public)
2. Push this folder to the `master` branch
3. Go to **Settings → Pages → Source: Deploy from branch → master → / (root)**
4. Dashboard will be live at `https://[yourusername].github.io/[reponame]`

### 2. Deploy the Google Apps Script

The Apps Script reads from CNC's Google Sheets and serves data as JSON. Deploy it once — it runs indefinitely.

**Steps:**

1. Open `apps-script-data.gs` from this repository
2. Go to [script.google.com](https://script.google.com) → New project
3. Delete the placeholder code and paste the full contents of `apps-script-data.gs`
4. Click **Deploy → New deployment**
5. Click the gear icon → Select type: **Web app**
6. Set the following:
   - **Description:** `CNC Dashboard Data v1`
   - **Execute as:** Me *(use the Google account that owns the source sheet)*
   - **Who has access:** Anyone with Google Account
7. Click **Deploy** and copy the web app URL

**Wire the URL into the dashboard:**

Open `index.html` and find this line near the top of the `<script>` section:

```javascript
const APPS_SCRIPT_URL = null;
```

Replace `null` with the URL from step 7:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

Save, commit, and push.

**Restrict to organization accounts (recommended after confirming it works):**

Redeploy → change **Who has access** to `Anyone within [yourdomain].com`.

---

### 3. Source Sheet Setup

The Apps Script reads from a copy of the BDM tracking spreadsheet. **Never modify Brittany's or the organization's original sheets.** Work only from a designated copy.

The script expects three tabs:

| Tab Name | Status | Required Columns |
|----------|--------|-----------------|
| `2026 Tracking - Sponsorships` | Live | Association Name, BDM, Annual Cost, Month of Renewal, Notes |
| `2026 Tracking - Events` | Live | Date, Name of Event, BDM, Organization, Type |
| `2026 Tracking - Memberships` | Create when ready | Association, BDM, Annual Cost, Month of Renewal, Status, Notes |

**Note on Memberships:** No clean tracking tab existed at time of build. The dashboard uses static data for memberships until a `2026 Tracking - Memberships` tab is created in the sheet with the columns above. Once that tab exists, the live API will pick it up automatically — no code change needed.

**Update the Sheet ID:**

Open `apps-script-data.gs` and update this line with the ID of the designated copy:

```javascript
const SHEET_ID = 'your-sheet-id-here';
```

The Sheet ID is the long string in the Google Sheets URL:
`https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit`

---

### 4. Update the Post-Event Survey

Open `index.html` and search for the post-event survey references. There are two:

1. **CTA button href** — the URL BDMs click to open the form in a new tab
2. **Embedded iframe src** — the form embedded directly in the Events page

Replace both with the organization's actual Google Form URL. The embedded src should end with `?embedded=true`.

---

## Migrating to a Foundation First Account

When transferring ownership to Foundation First Marketing or a new TKA Google account:

### Google Apps Script

1. Open the deployed script at [script.google.com](https://script.google.com) under the current account
2. Go to **Share** and add the new account as owner, or copy the script code to a new project under the new account
3. Redeploy under the new account → new deployment ID will be generated
4. Update `APPS_SCRIPT_URL` in `index.html` with the new URL → commit and push

### Google Sheets (Source Data)

1. In Google Drive, right-click the source sheet → **Share** → add the Foundation First account with Editor access
2. Or: **File → Make a copy** → save to the FF Drive → update `SHEET_ID` in `apps-script-data.gs`
3. Confirm the new account can open the sheet URL before redeploying

### GitHub Repository

1. Transfer the repository: **Settings → Danger Zone → Transfer ownership**
2. The live URL will change from `rodrigovittori.github.io/cnc-dashboard` to `[new-owner].github.io/cnc-dashboard`
3. If a custom domain is set up (e.g. `dashboard.foundationfirstmarketing.com`), update the CNAME file and DNS record at the domain registrar
4. Update `index.html` with any environment-specific references (logo URLs, support email)

### Custom Domain Option (Recommended)

To serve the dashboard at a branded URL:

1. Add a file named `CNAME` to the repository root containing only: `dashboard.foundationfirstmarketing.com`
2. At the domain registrar (wherever `foundationfirstmarketing.com` is registered), add a CNAME DNS record:
   - **Name:** `dashboard`
   - **Value:** `[new-github-username].github.io`
3. In the GitHub repo: **Settings → Pages → Custom domain** → enter the domain
4. HTTPS will be provisioned automatically within ~24 hours

---

## Role-Based Access Design (Planned — Phase 5)

The current dashboard uses a single shared login. The planned Phase 5 auth upgrade introduces role-based access with three clearance levels. This section documents the intended design so developers can implement it correctly.

> Authentication will use Google Apps Script as the login endpoint — no third-party auth service required. Each role receives a session token on login. The token is stored in `sessionStorage` (not localStorage) and checked on every page render.

---

### Role 1 — Administrator (Tom Layne, VP Business Development)

**Full access. Only role that can terminate accounts.**

| Permission | Access |
|------------|--------|
| Complete dashboard — all pages and all data | Yes |
| Full BDM drilldown — all BDMs, all territories | Yes |
| BDM profile management (create, edit, deactivate) | Yes — exclusive to this role |
| Approve or reject events | Yes |
| View all financial data (budget, variance, spend by BDM) | Yes |
| Export all data | Yes |
| Manage user roles and access levels | Yes |

---

### Role 2 — Operations (Brittany Dixon, Account Manager / Tonya)

**See all data. Run operational workflows. Cannot approve events or manage BDM profiles.**

| Permission | Brittany | Tonya |
|------------|----------|-------|
| Full data view — all BDMs, all financials | Yes | Yes |
| BDM Drilldown — read all | Yes | Yes |
| Approve or reject events | No | No |
| Create or deactivate BDM profiles | No | No |
| Send event briefs to BDMs | Yes | Yes |
| Run event scraping / opportunity discovery | Yes | Yes |
| Export event proposals and opportunity reports | Yes | Yes |
| Export data (sponsorships, memberships, events) | Yes | Yes |
| Submit Post-Event Survey on behalf of a BDM | Yes | Yes |

**Note:** Event approval authority rests exclusively with the Administrator role. Brittany can surface opportunities and prepare proposals for review, but final approval routes to Tom.

---

### Role 3 — BDM (Individual Business Development Managers)

**See own performance only. Submit data. Cannot view other BDMs' data or the full dashboard.**

| Permission | Access |
|------------|--------|
| Own BDM profile — performance, events, memberships, sponsorships | Yes |
| Personal schedule and calendar | Yes |
| Submit Post-Event Survey (own events only) | Yes |
| View opportunities — associations, events, memberships available in territory | Yes |
| View upcoming events relevant to their territory | Yes |
| Check membership renewal dates for their assigned associations | Yes |
| Full BDM Status Board (rankings, spend analytics for all BDMs) | No |
| Other BDMs' drilldown or financial data | No |
| Approve events | No |
| Export full data | No |
| Modify another BDM's records | No |

**What BDMs can see on the Opportunities page:**
- Upcoming events in their territory
- Associations available for membership that match their vertical
- Sponsorship opportunities relevant to their region
- Their personal performance trend (vs. their own history, not vs. other BDMs)

---

### Implementation Notes for Phase 5

- Token format: `{ userId, role, name, bdmId, exp }` — signed with a shared secret in Apps Script
- `bdmId` on BDM tokens maps to the `BDM_ID_MAP` in `apps-script-data.gs` — use this to filter data server-side or client-side before render
- All page render functions (`initStatus`, `initDrilldown`, `initEvents`, etc.) should accept a `roleContext` object and filter output accordingly
- The Administrator and Operations roles render the full dashboard; the BDM role renders a filtered single-BDM view
- Role check should happen in `showPage()` before any init function is called

---

## Development Roadmap

All phases below are defined and ready to execute. Phases are independent unless noted.

### Phase 1 — Email: Airtable Reply (Complete)
Reply to Christene's May 29 thread confirming Airtable direction and cost structure.

### Phase 2 — Critical Bug Fixes

| Fix | Description | Status |
|-----|-------------|--------|
| 2A | Replace placeholder survey URL with Brittany's real BDM form | Pending |
| 2B | Zero out $23,151 memberships budget variance (placeholder data artifact) | Complete |
| 2C | Fix `ddTabSwitch` — tab content overlap in BDM Drilldown | Complete |
| 2D | Rankings tiebreaker — verify/fix sort in `initStatus()` | Complete |
| 2E | Push to GitHub Pages and confirm live URL | Pending |

### Phase 3 — Google Apps Script Deploy
Deploy `apps-script-data.gs` as a web app, wire the URL into `index.html`, confirm live data loads.

**Source sheet ID:** `1iVrq8je5yf1q0_jrqUCtbWIv7UekEzPZsVSoLz24thQ`
**Estimated time:** 10 minutes (manual — no code changes required)

### Phase 4 — UI Polish

| Item | Description |
|------|-------------|
| 4A-1 | Expense page: section divider between 2026 live and 2025 historical sections |
| 4A-2 | Expense page: rename line chart to `2025 FULL-YEAR ACTUAL EXPENSES VS BUDGET - ADVERTISING` |
| 4A-3 | Expense page: red line segments where actual exceeds budget (Chart.js segment callback) |
| 4A-4 | Expense page: all 4 KPI cards go red when over budget (not just Combined Spend) |
| 4A-5 | Expense page: normalize KPI card CSS — no inline styles |
| 4B-1 | Status Board: verify 4-tab panel exists (Status Distribution, Rankings, Spend Analytics, Activity) |
| 4B-2 | Status Board: remove standalone color legend block if present |
| 4B-3 | Status Board: add headshot placeholder rectangle to BDM cards |
| 4B-4 | Status Board: fire emoji (most events) and crown emoji (best $/event ratio) — computed, never hardcoded |
| 4C-1 | Drilldown: verify sort controls wired to `ddSort()` — add if missing: A-Z, By Status, By Events, By Spend |
| 4D | Events: event outcome tracking card positioned above events table |
| 4E | Memberships: verify live data wiring once sheet tab is created |
| 4F | Mobile: chart legends overflow viewport on mobile Chrome — fix with `position: 'bottom'` on mobile breakpoints |

### Phase 5 — Authentication Upgrade
Implement role-based access as documented in the Role-Based Access Design section above. Replace the single shared login with Apps Script login endpoint, session tokens, and three-role permission model.

### Phase 6 — Custom Domain
Set up `dashboard.foundationfirstmarketing.com` or equivalent via CNAME + GitHub Pages custom domain. See Migration section above.

### Phase 7 — Airtable Migration (Q3 2026 Target)
Replace Google Sheets as the data source with Airtable. Planned 7-table data model:

| Table | Purpose |
|-------|---------|
| BDMs | BDM profiles, territory, contact info |
| Events | All CNC events — past and upcoming |
| Sponsorships | Annual sponsorship records by BDM |
| Memberships | Association memberships by BDM |
| Associations | Master association list |
| Budget | Annual budget targets by category and BDM |
| Event Outcomes | Post-event survey responses |

The Apps Script layer will be replaced by direct Airtable API calls. Data structure in `index.html` will remain compatible — only the fetch layer changes.

---

## Known Bugs

| Bug | Location | Priority |
|-----|----------|----------|
| Mobile chart legends cut off on Chrome Android | All chart pages | Low |
| Survey URL is placeholder | `index.html` lines 708, 741 | High |

---

## Data Quality Notes

These issues exist in the source spreadsheet. Do not attempt to fix them in code — flag to leadership when relevant.

- Some BDM cells contain `?` or informal names (e.g. `Molly?`, `Flo Terry`)
- Some events list two BDMs in one cell, newline-separated — script takes the first name only
- Some organization names have typos (e.g. `ABV Indianna-Kentucky`, `ACG Kentucky`)
- Event dates use `M-D-YY` format and sometimes ranges (e.g. `2-4/25-26`) — script takes the start date
- Ryan Cox is listed in the BDM map for data integrity but is excluded from public-facing rankings and BDM cards

---

## Rules for Developers

- Do not modify any Google Sheets, Google Docs, or Drive files — read only, via the Apps Script
- Do not hardcode dollar amounts in markup or JavaScript strings — always compute from data
- Do not use `innerHTML` without the `esc()` helper — XSS prevention
- Do not touch Brittany's original spreadsheet — work from the designated copy only
- Do not store session tokens in `localStorage` — use `sessionStorage` only
- All BDM name-to-ID mapping lives in `BDM_ID_MAP` in `apps-script-data.gs` — keep both files in sync when adding BDMs
