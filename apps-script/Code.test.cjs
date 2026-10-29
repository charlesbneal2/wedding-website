// Dependency-free local tests. All Google services are synthetic VM stubs.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, 'Code.gs'), 'utf8');
const address = {
  form: 'address', website: '', name: 'Example Nguyễn & O’Example',
  email: 'example@example.com', phone: '+1 555 0100',
  address1: '123 Example Lane', address2: 'Unit 2', city: 'Houston',
  state: 'TX', zip: '01234-5678', country: 'United States',
  guests: '2', note: 'Thank you!\nSee you soon.',
};

function harness(options = {}) {
  const rows = [];
  const events = [];
  const logs = [];
  const step = name => {
    events.push(name);
    if (options.fail === name) throw new Error('Synthetic service failure containing private cell value');
  };
  const context = vm.createContext({
    console: { error: message => logs.push(message) },
    PropertiesService: {
      getScriptProperties() {
        step('properties');
        return { getProperty() { return options.unconfigured ? null : 'synthetic-sheet-id'; } };
      },
    },
    LockService: {
      getScriptLock() {
        step('getLock');
        return {
          waitLock(timeout) { assert.equal(timeout, 10000); step('waitLock'); },
          releaseLock() { step('releaseLock'); },
        };
      },
    },
    SpreadsheetApp: {
      openById(id) {
        assert.equal(id, 'synthetic-sheet-id');
        step('open');
        if (options.noSpreadsheet) return null;
        return {
          getSheetByName(name) {
            step('sheet');
            if (options.noSheet) return null;
            const headers = name === 'Addresses'
              ? ['Timestamp','Name','Email','Phone','Address 1','Address 2','City','State','ZIP','Country','Guests','Note']
              : ['Timestamp','Name','Email','Attending','Party','Guest Names','Dietary','Note'];
            return {
              getLastColumn() { return options.badHeaders ? 1 : headers.length; },
              getRange() { return { getValues() { return [headers]; } }; },
              appendRow(row) { step('append'); rows.push({ sheet: name, cells: Array.from(row) }); },
            };
          },
        };
      },
      flush() { step('flush'); },
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(text) {
        return { text, setMimeType(mime) { this.mime = mime; return this; } };
      },
    },
  });
  vm.runInContext(source, context);
  function post(payload = address, event) {
    const output = context.doPost(event === undefined ? {
      parameter: { ...payload },
      parameters: Object.fromEntries(Object.entries(payload).map(([field, value]) => [field, [value]])),
    } : event);
    assert.equal(output.mime, 'application/json');
    return JSON.parse(output.text);
  }
  return { post, rows, events, logs };
}

function rejected(payload, field) {
  const h = harness();
  const result = h.post(payload);
  assert.equal(result.ok, false);
  assert.equal(typeof result.error, 'string');
  if (field) assert.ok(result.fields[field]);
  assert.deepEqual(h.rows, []);
  assert.deepEqual(h.events, []);
}

test('valid address appends once in existing schema order and flushes before release', () => {
  const h = harness();
  assert.deepEqual(h.post(), { ok: true });
  assert.equal(h.rows.length, 1);
  assert.equal(h.rows[0].sheet, 'Addresses');
  const [timestamp, ...cells] = h.rows[0].cells;
  assert.equal(Object.prototype.toString.call(timestamp), '[object Date]');
  assert.deepEqual(cells, [
    address.name, address.email, "'+1 555 0100", address.address1, address.address2,
    address.city, address.state, address.zip, address.country, address.guests, address.note,
  ]);
  assert.deepEqual(h.events, ['properties', 'getLock', 'waitLock', 'open', 'sheet', 'append', 'flush', 'releaseLock']);
});

test('all required address fields reject missing and whitespace-only input before storage', () => {
  for (const field of ['name', 'email', 'address1', 'city', 'state', 'zip', 'country']) {
    const payload = { ...address };
    delete payload[field];
    rejected(payload, field);
    rejected({ ...address, [field]: ' \t ' }, field);
  }
});

test('email syntax, US ZIP and US aliases are validated without claiming deliverability', () => {
  for (const email of ['not-email', 'a@@example.com', 'a b@example.com', 'a@-example.com']) {
    rejected({ ...address, email }, 'email');
  }
  for (const zip of ['1234', '123456', 'ABCDE', '12345 6789']) rejected({ ...address, zip }, 'zip');
  for (const country of ['US', 'U.S.', 'USA', 'U.S.A.', ' united states ', 'United States of America']) {
    const h = harness();
    assert.equal(h.post({ ...address, country, zip: '01234' }).ok, true);
    assert.equal(h.rows[0].cells[8], '01234');
    assert.equal(h.rows[0].cells[9], 'United States');
    rejected({ ...address, country, zip: 'SW1A 1AA' }, 'zip');
  }
});

test('international postal fields and Unicode punctuation remain usable', () => {
  const h = harness();
  assert.equal(h.post({ ...address, country: 'Canada', state: 'Québec', city: 'Montréal', zip: 'H2X 1Y4' }).ok, true);
  assert.equal(h.rows[0].cells[7], 'Québec');
  assert.equal(h.rows[0].cells[8], 'H2X 1Y4');
  assert.equal(h.rows[0].cells[9], 'Canada');
});

test('optional counts and text bounds reject rather than truncate', () => {
  for (const guests of ['0', '11', '-1', '1.5', '1e1', 'many']) rejected({ ...address, guests }, 'guests');
  for (const guests of ['', '1', '10']) assert.equal(harness().post({ ...address, guests }).ok, true);
  for (const [field, limit] of Object.entries({
    name: 200, email: 254, phone: 80, address1: 300, address2: 300,
    city: 100, state: 100, zip: 32, country: 100, note: 2000,
  })) rejected({ ...address, [field]: 'a'.repeat(limit + 1) }, field);
  const h = harness();
  const note = 'a'.repeat(2000);
  assert.equal(h.post({ ...address, note }).ok, true);
  assert.equal(h.rows[0].cells[11], note);
  rejected({ ...address, address1: 'Example\u0000Lane' }, 'address1');
});

test('every free-text address cell protects formula-like prefixes, including optional fields', () => {
  for (const field of ['name', 'phone', 'address1', 'address2', 'city', 'state', 'country', 'note']) {
    for (const prefix of ['=', '+', '-', '@', ' \n=']) {
      if (prefix.includes('\n') && field !== 'note') continue;
      const h = harness();
      const value = prefix + 'Example';
      assert.equal(h.post({ ...address, [field]: value }).ok, true);
      const fields = ['name', 'email', 'phone', 'address1', 'address2', 'city', 'state', 'zip', 'country', 'guests', 'note'];
      assert.equal(h.rows[0].cells[fields.indexOf(field) + 1], "'" + value.trim());
    }
  }
  const h = harness();
  assert.equal(h.post({ ...address, country: '=Example', zip: '=Example', email: '=Example@example.com' }).ok, true);
  assert.equal(h.rows[0].cells[2], "'=Example@example.com");
  assert.equal(h.rows[0].cells[8], "'=Example");
});

test('malformed, unsupported, duplicate and honeypot submissions never claim success', () => {
  for (const form of ['', 'unknown', '__proto__', 'constructor', 'toString']) rejected({ ...address, form });
  rejected({ ...address, website: 'bot.example' });
  rejected({ ...address, website: '   ' });
  rejected({ ...address, name: ['ambiguous'] });
  for (const event of [null, {}, { parameter: null }, { parameter: [] }, { parameter: 'bad' }]) {
    const h = harness();
    assert.equal(h.post(address, event).ok, false);
    assert.equal(h.rows.length, 0);
  }
  const h = harness();
  assert.equal(h.post(address, { parameter: address, parameters: { name: [address.name, 'Other Example'] } }).ok, false);
  assert.equal(h.rows.length, 0);
});

test('missing configuration, sheet, spreadsheet and service failures return explicit JSON errors', () => {
  for (const options of [
    { unconfigured: true }, { noSheet: true }, { noSpreadsheet: true }, { badHeaders: true },
    ...['properties', 'getLock', 'waitLock', 'open', 'sheet', 'append', 'flush'].map(fail => ({ fail })),
  ]) {
    const h = harness(options);
    const response = h.post();
    assert.equal(response.ok, false);
    assert.match(response.error, /Unable to confirm/);
    assert.equal(h.events.filter(step => step === 'releaseLock').length,
      h.events.includes('waitLock') && options.fail !== 'waitLock' ? 1 : 0);
    assert.equal(h.logs.length, 1);
    assert.doesNotMatch(h.logs.join(''), /private cell|example@|Nguyễn/);
    if (options.fail !== 'flush') assert.equal(h.rows.length, 0);
  }
});

test('release failure cannot mask a confirmed save or replace JSON with an exception', () => {
  const h = harness({ fail: 'releaseLock' });
  assert.equal(h.post().ok, true);
  assert.equal(h.rows.length, 1);
  assert.deepEqual(h.logs, ['Wedding form storage failure: lock release']);
});

test('existing accepting and declining RSVP submissions retain schema and validation', () => {
  const rsvp = {
    form: 'rsvp', name: 'Example Guest', email: 'example@example.com',
    attending: 'Joyfully accepts', party: '2', guestNames: '=Example Guests',
    dietary: '+Example dietary note', note: '@Example',
  };
  const h = harness();
  assert.equal(h.post(rsvp).ok, true);
  assert.equal(h.rows[0].sheet, 'RSVPs');
  assert.deepEqual(h.rows[0].cells.slice(1), [
    rsvp.name, rsvp.email, rsvp.attending, '2',
    "'=Example Guests", "'+Example dietary note", "'@Example",
  ]);
  const decline = { ...rsvp, attending: 'Regretfully declines' };
  delete decline.party; // The current frontend disables party when declining.
  assert.equal(harness().post(decline).ok, true);
  for (const party of ['', '0', '11', '1.5']) rejected({ ...rsvp, party }, 'party');
  rejected({ ...rsvp, attending: 'Maybe' }, 'attending');
  rejected({ ...rsvp, guestNames: 'a'.repeat(2001) }, 'guestNames');
  rejected({ ...rsvp, dietary: 'a'.repeat(501) }, 'dietary');
});

function setupHarness(options = {}) {
  const sheets = new Map(Object.entries(options.sheets || {}));
  const properties = new Map(options.configured ? [['SPREADSHEET_ID', 'synthetic-sheet-id']] : []);
  const events = [];
  let title = options.configured ? 'Existing response document' : '';
  const step = name => {
    events.push(name);
    if (options.fail === name) throw new Error('Synthetic ' + name + ' failure');
  };
  function sheetApi(rows) {
    return {
      getLastRow() { return rows.length; },
      getLastColumn() { return Math.max(0, ...rows.map(row => row.length)); },
      getRange(row, column, rowCount, columnCount) {
        assert.deepEqual([row, column, rowCount], [1, 1, 1]);
        return {
          getValues() { return [Array.from({ length: columnCount }, (_, index) => rows[0]?.[index] ?? '')]; },
          setValues(values) { step('headers'); rows[0] = Array.from(values[0]); },
        };
      },
    };
  }
  const spreadsheet = {
    getId() { return 'synthetic-sheet-id'; },
    getName() { return title; },
    getSheetByName(name) { return sheets.has(name) ? sheetApi(sheets.get(name)) : null; },
    insertSheet(name) {
      step('insert');
      const rows = [];
      sheets.set(name, rows);
      return sheetApi(rows);
    },
  };
  const context = vm.createContext({
    PropertiesService: {
      getScriptProperties() {
        step('properties');
        return {
          getProperty(key) { step('getProperty'); return properties.get(key) ?? null; },
          setProperty(key, value) { step('setProperty'); properties.set(key, value); },
        };
      },
    },
    LockService: {
      getScriptLock() {
        step('getLock');
        return {
          waitLock() { step('waitLock'); },
          releaseLock() { step('releaseLock'); },
        };
      },
    },
    SpreadsheetApp: {
      create(name) { step('create'); title = name; return spreadsheet; },
      openById(id) { step('open'); assert.equal(id, 'synthetic-sheet-id'); return spreadsheet; },
      flush() { step('flush'); },
    },
  });
  vm.runInContext(source, context);
  return { setup: () => context.setupWeddingResponses(), sheets, properties, events };
}

test('setup creates exactly the requested document and original headers; rerun preserves rows and other sheets', () => {
  const h = setupHarness({ sheets: { Sheet1: [], Invitees: [['Synthetic invitee']] } });
  const result = h.setup();
  assert.equal(result.title, 'trisaandcharleswedding_savethedate_address');
  assert.equal(result.spreadsheetId, 'synthetic-sheet-id');
  assert.equal(h.properties.get('SPREADSHEET_ID'), 'synthetic-sheet-id');
  assert.deepEqual(h.sheets.get('Addresses')[0], [
    'Timestamp','Name','Email','Phone','Address 1','Address 2','City','State','ZIP','Country','Guests','Note',
  ]);
  assert.deepEqual(h.sheets.get('RSVPs')[0], ['Timestamp','Name','Email','Attending','Party','Guest Names','Dietary','Note']);
  const syntheticRow = ['Synthetic timestamp', 'Example household'];
  h.sheets.get('Addresses').push(syntheticRow);
  const before = JSON.stringify([...h.sheets]);
  h.setup();
  assert.equal(h.events.filter(event => event === 'create').length, 1);
  assert.equal(h.events.filter(event => event === 'headers').length, 2);
  assert.equal(JSON.stringify([...h.sheets]), before);
  assert.equal(h.events.filter(event => event === 'releaseLock').length, 2);
});

test('setup reuses a configured spreadsheet without changing its title or unrelated sheets', () => {
  const h = setupHarness({ configured: true, sheets: { Invitees: [['Example invitee']] } });
  assert.equal(h.setup().title, 'Existing response document');
  assert.ok(!h.events.includes('create'));
  assert.deepEqual(h.sheets.get('Invitees'), [['Example invitee']]);
});

test('setup refuses mismatched headers before changing any tab or guest data', () => {
  for (const headers of [['Name', 'Email'], ['Timestamp', 'Wrong column'], ['Timestamp', 'Name', 'Extra']]) {
    const h = setupHarness({ configured: true, sheets: { RSVPs: [headers, ['Example data']], Invitees: [['Keep']] } });
    const before = JSON.stringify([...h.sheets]);
    assert.throws(h.setup, /Header mismatch in RSVPs/);
    assert.equal(JSON.stringify([...h.sheets]), before);
    assert.ok(!h.events.includes('create'));
    assert.ok(!h.events.includes('headers'));
    assert.ok(!h.events.includes('insert'));
    assert.equal(h.events.at(-1), 'releaseLock');
  }
});

test('setup failure after creation retains ID so retries cannot create another document', () => {
  const h = setupHarness({ fail: 'headers' });
  assert.throws(h.setup, /headers failure/);
  assert.equal(h.properties.get('SPREADSHEET_ID'), 'synthetic-sheet-id');
  assert.throws(h.setup, /headers failure/);
  assert.equal(h.events.filter(event => event === 'create').length, 1);
  assert.equal(h.events.filter(event => event === 'releaseLock').length, 2);
});

test('setup propagates configuration/service failures, never replaces an inaccessible configured spreadsheet', () => {
  for (const fail of ['getLock', 'waitLock', 'properties', 'getProperty', 'open', 'insert', 'headers', 'flush']) {
    const h = setupHarness({ configured: true, fail });
    assert.throws(h.setup, /Synthetic .* failure/);
    assert.ok(!h.events.includes('create'));
    assert.equal(h.events.filter(event => event === 'releaseLock').length, ['getLock', 'waitLock'].includes(fail) ? 0 : 1);
  }
  for (const fail of ['create', 'setProperty']) {
    const h = setupHarness({ fail });
    assert.throws(h.setup, /Synthetic .* failure/);
    assert.equal(h.events.at(-1), 'releaseLock');
  }
});
