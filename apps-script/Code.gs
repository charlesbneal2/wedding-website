// Paste into a new Apps Script project and run setupWeddingResponses() as owner.
// Authorize Sheets; setup creates the named spreadsheet and stores SPREADSHEET_ID
// in Script Properties. To reuse an existing sheet, set that property first.
// Never clear the property to retry setup: reruns reuse it and preserve data.
// Deploy as Me / Anyone; use its /exec URL for an approved browser-to-sheet test
// before launch. Keep design-preview submissions disabled.
// Local tests: node --test apps-script\Code.test.cjs (no Google services called).
const SPREADSHEET_TITLE = 'trisaandcharleswedding_savethedate_address';

const TABS = {
  address: {
    sheet: 'Addresses',
    fields: ['name','email','phone','address1','address2','city','state','zip','country','guests','note'],
    required: ['name','email','address1','city','state','zip','country'],
    headers: ['Timestamp','Name','Email','Phone','Address 1','Address 2','City','State','ZIP','Country','Guests','Note'],
  },
  rsvp: {
    sheet: 'RSVPs',
    fields: ['name','email','attending','party','guestNames','dietary','note'],
    required: ['name','email','attending'],
    headers: ['Timestamp','Name','Email','Attending','Party','Guest Names','Dietary','Note'],
  },
};

// Timestamp is first. Phone/Guests/Note remain optional compatibility columns;
// the selected preview only collects Name, Email, Address 1/2, City, State, ZIP, Country.
function setupWeddingResponses() {
  const lock = LockService.getScriptLock();
  let acquired = false;
  try {
    lock.waitLock(10000);
    acquired = true;
    const properties = PropertiesService.getScriptProperties();
    let id = (properties.getProperty('SPREADSHEET_ID') || '').trim();
    let spreadsheet;
    if (id) {
      spreadsheet = SpreadsheetApp.openById(id);
    } else {
      spreadsheet = SpreadsheetApp.create(SPREADSHEET_TITLE);
      id = spreadsheet.getId();
      // Save immediately so a later header/setup failure can safely be retried.
      properties.setProperty('SPREADSHEET_ID', id);
    }
    if (!spreadsheet) throw new Error('Configured spreadsheet is unavailable; check SPREADSHEET_ID and owner access.');
    // Check ALL existing tabs before writing any headers or creating missing tabs.
    for (const tab of Object.values(TABS)) {
      const sheet = spreadsheet.getSheetByName(tab.sheet);
      if (sheet && sheet.getLastRow() > 0) checkHeaders(sheet, tab);
    }
    for (const tab of Object.values(TABS)) {
      const sheet = spreadsheet.getSheetByName(tab.sheet) || spreadsheet.insertSheet(tab.sheet);
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, tab.headers.length).setValues([tab.headers]);
      }
    }
    SpreadsheetApp.flush();
    return { spreadsheetId: id, title: spreadsheet.getName() };
  } finally {
    if (acquired) lock.releaseLock();
  }
}

function checkHeaders(sheet, tab) {
  const headers = sheet.getRange(1, 1, 1, tab.headers.length).getValues()[0];
  if (sheet.getLastColumn() !== tab.headers.length ||
      headers.some((value, index) => value !== tab.headers[index])) {
    throw new Error('Header mismatch in ' + tab.sheet + '; existing cells were not overwritten. Restore the specified column order before retrying.');
  }
}

// Reject oversize input rather than silently losing envelope or guest details.
const LIMITS = {
  name: 200, email: 254, phone: 80, address1: 300, address2: 300,
  city: 100, state: 100, zip: 32, country: 100, guests: 2,
  attending: 30, party: 2, guestNames: 2000, dietary: 500, note: 2000,
};

function doPost(e) {
  const result = validate(e);
  if (!result.ok) return json(result);
  const { tab, values } = result;

  let lock;
  let acquired = false;
  let stage = 'configuration';
  try {
    const id = (PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '').trim();
    if (!id) throw new Error('Spreadsheet ID not configured; run setupWeddingResponses');
    stage = 'lock acquisition';
    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    acquired = true;
    stage = 'spreadsheet access';
    const spreadsheet = SpreadsheetApp.openById(id);
    if (!spreadsheet) throw new Error('Spreadsheet unavailable');
    stage = 'sheet lookup';
    const sheet = spreadsheet.getSheetByName(tab.sheet);
    if (!sheet) throw new Error('Required sheet missing');
    stage = 'header validation';
    checkHeaders(sheet, tab);
    stage = 'row append';
    sheet.appendRow([new Date(), ...tab.fields.map(f => safe(values[f]))]);
    stage = 'flush';
    SpreadsheetApp.flush(); // Commit pending changes before acknowledging and releasing the lock.
  } catch (error) {
    logStorageError(stage);
    return json({ ok: false, error: 'Unable to confirm your submission was saved. Please try again or contact us.' });
  } finally {
    if (acquired) {
      try {
        lock.releaseLock();
      } catch (error) {
        // A release failure must not mask a write error or expose an HTML exception.
        logStorageError('lock release');
      }
    }
  }
  return json({ ok: true });
}

function validate(e) {
  const p = e && e.parameter;
  const invalid = { ok: false, error: 'Invalid form submission.' };
  if (!p || typeof p !== 'object' || Array.isArray(p)) return invalid;
  if (!Object.prototype.hasOwnProperty.call(p, 'form') ||
      typeof p.form !== 'string' ||
      !Object.prototype.hasOwnProperty.call(TABS, p.form)) return invalid;
  const tab = TABS[p.form];
  const values = {};
  const errors = {};
  const fields = ['form', 'website', ...tab.fields];
  if (e.parameters && (typeof e.parameters !== 'object' || Array.isArray(e.parameters))) return invalid;
  for (const field of fields) {
    const present = Object.prototype.hasOwnProperty.call(p, field);
    if (present && typeof p[field] !== 'string') return invalid;
    // Apps Script's parameter exposes only the first value; reject ambiguous duplicates.
    if (e.parameters && Object.prototype.hasOwnProperty.call(e.parameters, field)) {
      const entries = e.parameters[field];
      if (!Array.isArray(entries) || entries.length !== 1 || !present || entries[0] !== p[field]) return invalid;
    }
    values[field] = present ? p[field].trim() : '';
    const multiline = field === 'note' || field === 'guestNames';
    const controls = multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/;
    if ((LIMITS[field] && p[field] && p[field].length > LIMITS[field]) ||
        (present && controls.test(p[field]))) errors[field] = 'Invalid or too long.';
  }
  if (p.website) return { ok: false, error: 'Submission rejected.' };
  for (const field of tab.required) {
    if (!values[field]) errors[field] = 'Required.';
  }
  // Match the native email input's basic syntax, not mailbox existence/deliverability.
  if (values.email && !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (p.form === 'address') {
    const country = values.country.toLowerCase().replace(/[.\s]/g, '');
    if (['us', 'usa', 'unitedstates', 'unitedstatesofamerica'].includes(country)) {
      values.country = 'United States';
      if (!/^\d{5}(?:-\d{4})?$/.test(values.zip)) errors.zip = 'Enter a five-digit ZIP or ZIP+4.';
    }
    // International state/postal text remains unrestricted beyond required/length checks.
    // This checks format only; it does not verify a real postal destination.
    if (values.guests && !validCount(values.guests, 1)) errors.guests = 'Enter a whole number from 1 to 10.';
  } else {
    if (!['Joyfully accepts', 'Regretfully declines'].includes(values.attending)) errors.attending = 'Choose an attendance option.';
    const accepts = values.attending === 'Joyfully accepts';
    if ((accepts && !values.party) || (values.party && !validCount(values.party, accepts ? 1 : 0))) {
      errors.party = accepts ? 'Enter a whole number from 1 to 10.' : 'Enter a whole number from 0 to 10.';
    }
  }
  return Object.keys(errors).length
    ? { ok: false, error: 'Please check the form fields.', fields: errors }
    : { ok: true, tab, values };
}

function validCount(value, min) {
  return /^\d+$/.test(value) && Number(value) >= min && Number(value) <= 10;
}

function safe(value) {
  // Protect every guest-supplied cell, including optional and multiline text.
  return /^\s*[=+\-@]/.test(value) ? "'" + value : value;
}

function logStorageError(stage) {
  // Service exception messages can contain cell values: log only the technical stage.
  console.error('Wedding form storage failure: ' + stage);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
