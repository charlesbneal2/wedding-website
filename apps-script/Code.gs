// Backend for the wedding site forms. Paste into Extensions → Apps Script in the
// "Wedding Responses" Google Sheet. This copy is for version control only.
// Tabs "Addresses" and "RSVPs" need header rows (SPEC.md §6.1).

const TABS = {
  address: { sheet: 'Addresses', fields: ['name','email','phone','address1','address2','city','state','zip','country','guests','note'], required: ['name','email','address1','city','state','zip'] },
  rsvp:    { sheet: 'RSVPs',     fields: ['name','email','attending','party','guestNames','dietary','note'],                              required: ['name','email','attending'] },
};

function doPost(e) {
  const p = e.parameter;
  if (p.website) return json({ ok: true });             // honeypot: bots fill the hidden field
  const tab = TABS[p.form];
  if (!tab || tab.required.some(f => !p[f])) return json({ ok: false, error: 'bad request' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);                                  // avoid row collisions on simultaneous submits
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(tab.sheet);
    sheet.appendRow([new Date(), ...tab.fields.map(f => safe(p[f]))]);
  } finally {
    lock.releaseLock();
  }
  // Optional email alert: MailApp.sendEmail('charlesbneal2@gmail.com', `New ${p.form}: ${p.name}`, JSON.stringify(p, null, 2));
  return json({ ok: true });
}

function safe(v) {                                      // stop "=..." input becoming a sheet formula
  v = String(v || '').slice(0, 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
