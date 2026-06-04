// CNC Dashboard — Live Data API
// Google Apps Script — deploy once, runs forever.
//
// DEPLOYMENT STEPS (takes ~5 minutes):
//   1. Go to https://script.google.com → click "New project"
//   2. Delete the placeholder code, paste this entire file
//   3. Click the floppy disk icon to save (name it "CNC Dashboard Data")
//   4. Click Deploy > New deployment
//   5. Click the gear icon next to "Select type" → choose "Web app"
//   6. Description: "CNC Dashboard Data v1"
//      Execute as: Me (rodrigo.vittori@theknowingagency.com)
//      Who has access: Anyone with Google Account
//   7. Click Deploy → copy the URL that appears
//   8. Open index.html, find APPS_SCRIPT_URL, replace null with the URL in quotes
//   9. Save, commit, push.
//
// TO RESTRICT TO TKA ACCOUNTS ONLY (after confirming it works):
//   Redeploy → change "Who has access" to "Anyone within theknowingagency.com"
//
// SOURCE FILE (TKA Drive — COPY only, never modify Brittany's originals):
//   BDM_Memberships_Yearly_Sponsorships_COPY
//   Sheet ID: 1iVrq8je5yf1q0_jrqUCtbWIv7UekEzPZsVSoLz24thQ
//
// TAB NAMES (verified against actual sheet — Apr 2026 CSV export):
//   Sponsorships: '2026 Tracking - Sponsorships'
//   Events:       '2026 Tracking - Events'
//   Memberships:  No clean tracking tab exists yet.
//                 Dashboard uses baked-in data until a structured tab is created.
//                 To add live memberships, create a tab named '2026 Tracking - Memberships'
//                 with columns: Association, BDM, Annual Cost, Month of Renewal, Status, Notes
//
// KNOWN DATA QUALITY NOTES (in Brittany's sheet — do not "fix" here, flag to leadership):
//   - Some BDM cells contain "?" or informal names (e.g. "Molly?", "Flo Terry")
//   - Some events list two BDMs in one cell (newline-separated) — script takes the first
//   - Some org names have typos (e.g. "ABV Indianna-Kentucky", "ACG Kentucky")
//   - Event dates use M-D-YY format and sometimes ranges (e.g. "2-4/25-26") — script takes start date

const SHEET_ID = '1iVrq8je5yf1q0_jrqUCtbWIv7UekEzPZsVSoLz24thQ';

const SPON_TAB = '2026 Tracking - Sponsorships';
const EVT_TAB  = '2026 Tracking - Events';
const MEM_TAB  = '2026 Tracking - Memberships'; // create this tab to enable live memberships

const BDM_ID_MAP = {
  'Ed Lundberg':      'ed',
  'Haley McHugh':     'haley',
  'Molly Dyer':       'molly',
  'Jason Sherrer':    'jason',
  'Matt Katula':      'matt',
  'Shawn Lyons':      'shawn',
  'Mitch Oakes':      'mitch',
  'Erik Prather':     'erik',
  'Marty McLeary':    'marty',
  'Tyler Prazma':     'tyler',
  'Zach Haake':       'zach',
  'Cari-Ellen Edgin': 'cari',
  'Michael Cox':      'michael',
  'Ryan Cox':         'ryan',
};

function doGet() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);

    const sponsorships = parseSponsorships(ss);
    const events       = parseEvents(ss);
    const memberships  = parseMemberships(ss); // returns null if tab doesn't exist

    const payload = {
      refreshed:    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMM d, yyyy'),
      memberships,  // null = dashboard keeps baked-in data
      sponsorships,
      events,
    };

    return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(e) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── SPONSORSHIPS ────────────────────────────────────────────────────
// Tab has a title row ("Charged Year-to-Date...") before the actual headers.
// Also has summary rows (TOTAL, Budgeted, Variance) and section labels to skip.
function parseSponsorships(ss) {
  const sheet = ss.getSheetByName(SPON_TAB);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();

  // Find actual header row (contains 'Association Name')
  let headerIdx = -1;
  for (let i = 0; i < Math.min(6, values.length); i++) {
    if (String(values[i][0]).trim() === 'Association Name') { headerIdx = i; break; }
  }
  if (headerIdx < 0) return [];

  const headers = values[headerIdx].map(h => String(h).trim());
  const results = [];

  for (let i = headerIdx + 1; i < values.length; i++) {
    const row   = values[i];
    const col0  = String(row[0] || '').trim();

    // Skip blanks, section labels, and summary rows
    if (!col0 ||
        col0 === 'Association Name' ||
        col0 === 'Anticipated through EOY' ||
        col0 === 'Other' ||
        col0 === 'Year Round Sponsorships') continue;

    const obj = {};
    headers.forEach((h, idx) => { if (h) obj[h] = row[idx]; });

    const cost = num(obj['Annual Cost']);
    if (!cost) continue; // skips TOTAL / Budgeted / Variance rows (they have no $ in col0)

    results.push({
      assoc:  col0 === '?' ? 'Sponsorship (to confirm)' : col0,
      bdm:    bdmId(str(obj['BDM'])),
      cost:   cost,
      month:  parseMonth(obj['Month of Renewal']),
      status: 'charged',
      note:   str(obj['Notes']),
    });
  }

  return results;
}

// ── EVENTS ──────────────────────────────────────────────────────────
// Headers: Date | Name of Event | BDM | Organization
// Dates in M-D-YY or M-D/D-YY (range) format.
// Some BDM cells have two names separated by newline — take first.
function parseEvents(ss) {
  const sheet = ss.getSheetByName(EVT_TAB);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(h => String(h).trim());
  const results = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const obj = {};
    headers.forEach((h, idx) => { if (h) obj[h] = row[idx]; });

    const dateStr = str(obj['Date']);
    const name    = str(obj['Name of Event']);
    if (!dateStr || !name) continue;

    // Multi-BDM cell: take first name only
    const bdmRaw = str(obj['BDM']).split('\n')[0].trim();

    results.push({
      date: parseEventDate(dateStr),
      name: name,
      bdm:  bdmId(bdmRaw),
      org:  str(obj['Organization']),
      type: str(obj['Type'] || ''),
    });
  }

  return results.filter(e => e.date && e.name);
}

// ── MEMBERSHIPS ─────────────────────────────────────────────────────
// Returns null if the tab doesn't exist yet.
// Expected columns when tab is created: Association | BDM | Annual Cost | Month of Renewal | Status | Notes
function parseMemberships(ss) {
  const sheet = ss.getSheetByName(MEM_TAB);
  if (!sheet) return null;
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;

  const headers = values[0].map(h => String(h).trim());
  const results = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const obj = {};
    headers.forEach((h, idx) => { if (h) obj[h] = row[idx]; });

    const assoc = str(obj['Association']);
    const cost  = num(obj['Annual Cost']);
    if (!assoc || !cost) continue;

    const statusRaw = str(obj['Status']).toLowerCase();
    results.push({
      assoc:  assoc,
      bdm:    bdmId(str(obj['BDM'])),
      cost:   cost,
      month:  parseMonth(obj['Month of Renewal']),
      status: statusRaw.includes('charged') ? 'charged' : 'anticipated',
      note:   str(obj['Notes']),
    });
  }

  return results.length ? results : null;
}

// ── HELPERS ─────────────────────────────────────────────────────────

function str(v) { return v == null ? '' : String(v).trim(); }

function num(v) { return parseFloat(String(v || 0).replace(/[$,\s]/g, '')) || 0; }

function bdmId(v) {
  const s = str(v);
  if (!s) return null;
  if (BDM_ID_MAP[s]) return BDM_ID_MAP[s];
  // Partial match on first + last name
  for (const [full, id] of Object.entries(BDM_ID_MAP)) {
    const parts = full.toLowerCase().split(' ');
    if (parts.some(p => s.toLowerCase().startsWith(p) && p.length > 2)) return id;
  }
  return null;
}

function parseMonth(v) {
  if (!v) return 0;
  if (v instanceof Date) return v.getMonth() + 1;
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const s = String(v).toLowerCase().trim().substring(0, 3);
  const idx = months.indexOf(s);
  if (idx >= 0) return idx + 1;
  const n = parseInt(v);
  return (n >= 1 && n <= 12) ? n : 0;
}

// Parses M-D-YY and M-D/D-YY (date range — takes start date)
function parseEventDate(v) {
  if (!v) return '';
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const s = String(v).trim();
  // Remove range suffix: "2-4/25-26" → "2-4-26"
  const clean = s.replace(/\/\d+/, '');
  const parts = clean.split('-');
  if (parts.length >= 3) {
    const m = parseInt(parts[0]);
    const d = parseInt(parts[1]);
    const y = parseInt(parts[2]) + 2000; // 26 → 2026
    if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
      return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    }
  }
  return '';
}
