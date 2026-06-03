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
//   Note: users will need to be signed into their TKA Google account to load data.
//
// SOURCE FILES (TKA Drive copies — never modify Brittany's originals):
//   BDM Memberships 2026: https://docs.google.com/spreadsheets/d/1iVrq8je5yf1q0_jrqUCtbWIv7UekEzPZsVSoLz24thQ
//   CNC BDM Report 2025:  https://docs.google.com/spreadsheets/d/18haHWoecqRSBo_ga3jQtW9N6xS1urEMoU_s0yykXqQg
//
// COLUMN NAMES TO VERIFY (open the sheet and confirm these match exactly):
//   Memberships 2026 tab: BDM, Association, Annual Cost, Budgeted, Actual, Variance, Renewal Month, Status, Notes
//   Sponsorships 2026 tab: BDM, Event/Association, Amount, Budgeted, Actual, Date
//   Events tab: BDM, Organization, Event Date, Type, Territory
//   If column names differ, update the property lookups in getRows() calls below.

const MEMBERSHIP_SHEET_ID = '1iVrq8je5yf1q0_jrqUCtbWIv7UekEzPZsVSoLz24thQ';

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
    const ss = SpreadsheetApp.openById(MEMBERSHIP_SHEET_ID);

    const memRows  = getRows(ss, 'Memberships 2026');
    const sponRows = getRows(ss, 'Sponsorships 2026');
    const evtRows  = getRows(ss, 'Events');

    const memberships = memRows.map(r => ({
      assoc:  str(r['Association']),
      bdm:    bdmId(r['BDM']),
      cost:   num(r['Actual'] !== '' && r['Actual'] != null ? r['Actual'] : r['Annual Cost']),
      month:  parseMonth(r['Renewal Month']),
      status: str(r['Status']).toLowerCase().includes('charged') ? 'charged' : 'anticipated',
      note:   str(r['Notes']),
    })).filter(m => m.assoc && m.cost > 0);

    const sponsorships = sponRows.map(r => ({
      assoc:  str(r['Event/Association']),
      bdm:    bdmId(r['BDM']),
      cost:   num(r['Actual'] !== '' && r['Actual'] != null ? r['Actual'] : r['Amount']),
      month:  parseMonth(r['Date']),
      status: 'charged',
    })).filter(s => s.assoc && s.cost > 0);

    // NOTE: The Events tab uses "Organization" as the event/meeting name field.
    // If Brittany's sheet has a separate "Event Name" column, update r['Organization'] below.
    const events = evtRows.map(r => ({
      date: fmtDate(r['Event Date']),
      name: str(r['Organization']),
      bdm:  bdmId(r['BDM']),
      org:  str(r['Territory']),
      type: str(r['Type']),
    })).filter(e => e.date && e.name);

    const payload = {
      refreshed:    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMM d, yyyy'),
      memberships,
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

function getRows(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => String(h).trim());
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = row[i]; });
    return obj;
  }).filter(r => headers.some(h => r[h] !== '' && r[h] != null));
}

function str(v)   { return v == null ? '' : String(v).trim(); }
function num(v)   { return parseFloat(String(v || 0).replace(/[$,\s]/g, '')) || 0; }
function bdmId(v) {
  const s = str(v);
  return BDM_ID_MAP[s] || (s ? s.toLowerCase().split(' ')[0] : null);
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

function fmtDate(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v).substring(0, 10);
}
