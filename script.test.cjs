const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const source = readFileSync(join(__dirname, 'script.js'), 'utf8');

function addressPage(response, hostname = 'trisaandcharleswedding.com') {
  const button = { disabled: true, textContent: 'Send my address' };
  const error = { hidden: true };
  const status = { hidden: false };
  const back = { addEventListener(name, callback) { this.click = callback; } };
  const nameInput = { focusCalls: [], focus(options) { this.focusCalls.push(options); } };
  const announcement = {
    focusCalls: [],
    focus(options) { this.focusCalls.push(options); },
  };
  const scrollCalls = [];
  const thanks = {
    hidden: true,
    style: {},
    focusCalls: [],
    scrollCalls: [],
    querySelector(selector) { return selector === '[data-address-back]' ? back : null; },
    focus(options) { this.focusCalls.push(options); },
    scrollIntoView(options) { this.scrollCalls.push(options); },
  };
  const values = {
    name: 'Example Guest', email: 'guest@example.test', website: '',
    address1: '123 Example Street', address2: '', city: 'Houston',
    state: 'TX', zip: '77001', country: 'United States',
  };
  const form = {
    dataset: { form: 'address' },
    hidden: false,
    offsetHeight: 1200,
    resetCalls: 0,
    scrollCalls: [],
    values,
    reset() {
      this.resetCalls++;
      for (const name of Object.keys(values)) values[name] = name === 'country' ? 'United States' : '';
    },
    scrollIntoView(options) { this.scrollCalls.push(options); },
    parentElement: { querySelector(selector) { return selector === '.thanks' ? thanks : null; } },
    querySelector(selector) {
      return selector === '[name="name"]' ? nameInput : selector === 'button[type=submit]' ? button :
        selector === '.error' ? error : status;
    },
    addEventListener(name, callback) { this.submit = callback; },
  };
  const requests = [];
  const failures = [];
  const regionOptions = vm.runInNewContext(`${source}\naddressRegionOptions;`, {
    window: { location: { hostname }, scrollTo(options) { scrollCalls.push(options); } },
    document: {
      querySelector(selector) { return selector === '.entrance-hero' ? announcement : null; },
      querySelectorAll() { return [form]; },
    },
    FormData: class {
      constructor(form) { this.values = form.values; }
      get(name) { return this.values[name] ?? null; }
    },
    fetch: async (...args) => { requests.push(args); return response(); },
    console: { error(...args) { failures.push(args); } },
  });
  return {
    button, error, status, form, thanks, back, nameInput, announcement, scrollCalls, requests, failures, regionOptions,
    submit: () => form.submit({ preventDefault() {} }),
  };
}

test('a saved address replaces the whole form with a focused thank-you panel', async () => {
  const page = addressPage(() => ({ status: 201 }));
  await page.submit();
  assert.equal(page.button.textContent, 'Sent!');
  assert.equal(page.button.disabled, true);
  assert.equal(page.form.hidden, true);
  assert.equal(page.thanks.hidden, false);
  assert.equal(page.thanks.style.minHeight, 'max(1200px, 100dvh)');
  assert.equal(page.thanks.focusCalls.length, 1);
  assert.equal(page.thanks.focusCalls[0].preventScroll, true);
  assert.equal(page.thanks.scrollCalls.length, 1);
  assert.equal(page.thanks.scrollCalls[0].block, 'center');
  assert.equal(page.thanks.scrollCalls[0].behavior, 'instant');
  assert.equal(page.error.hidden, true);
  assert.equal(page.failures.length, 0);
  assert.equal(page.requests.length, 1);
});

test('a failed save keeps the form and input visible until a successful retry', async () => {
  let status = 500;
  const page = addressPage(() => ({ status }));
  const before = { ...page.form.values };
  await page.submit();
  assert.equal(page.button.textContent, 'Send my address');
  assert.equal(page.button.disabled, false);
  assert.equal(page.error.hidden, false);
  assert.equal(page.form.hidden, false);
  assert.equal(page.thanks.hidden, true);
  assert.equal(page.thanks.focusCalls.length, 0);
  assert.deepEqual(page.form.values, before);
  assert.equal(page.failures.length, 1);
  status = 201;
  await page.submit();
  assert.equal(page.button.textContent, 'Sent!');
  assert.equal(page.form.hidden, true);
  assert.equal(page.thanks.hidden, false);
  assert.equal(page.error.hidden, true);
  assert.equal(page.requests.length, 2);
});

test('pending and saved addresses cannot be sent again', async () => {
  let resolveResponse;
  const response = new Promise(resolve => { resolveResponse = resolve; });
  const page = addressPage(() => response);
  const first = page.submit();
  assert.equal(page.button.disabled, true);
  assert.equal(page.form.hidden, false);
  assert.equal(page.thanks.hidden, true);
  await page.submit();
  assert.equal(page.requests.length, 1);
  resolveResponse({ status: 201 });
  await first;
  await page.submit();
  assert.equal(page.button.textContent, 'Sent!');
  assert.equal(page.form.hidden, true);
  assert.equal(page.thanks.hidden, false);
  assert.equal(page.requests.length, 1);
});

test('a network failure never displays the thank-you panel or clears the form', async () => {
  const page = addressPage(() => { throw new Error('Network unavailable'); });
  const before = { ...page.form.values };
  await page.submit();
  assert.equal(page.form.hidden, false);
  assert.equal(page.thanks.hidden, true);
  assert.equal(page.error.hidden, false);
  assert.equal(page.button.disabled, false);
  assert.deepEqual(page.form.values, before);
  assert.equal(page.failures.length, 1);
});

test('returning from confirmation opens the announcement and resets the form without resending', async () => {
  const page = addressPage(() => ({ status: 201 }));
  await page.submit();
  page.back.click();
  assert.equal(page.thanks.hidden, true);
  assert.equal(page.thanks.style.minHeight, '');
  assert.equal(page.form.hidden, false);
  assert.equal(page.form.resetCalls, 1);
  assert.equal(page.form.values.name, '');
  assert.equal(page.form.values.address1, '');
  assert.equal(page.form.values.country, 'United States');
  assert.equal(page.error.hidden, true);
  assert.equal(page.button.disabled, false);
  assert.equal(page.button.textContent, 'Send my address');
  assert.equal(page.nameInput.focusCalls.length, 0);
  assert.equal(page.announcement.focusCalls.length, 1);
  assert.equal(page.announcement.focusCalls[0].preventScroll, true);
  assert.equal(page.scrollCalls[0].top, 0);
  assert.equal(page.scrollCalls[0].behavior, 'instant');
  assert.equal(page.requests.length, 1);
  page.form.values.name = 'Another Guest';
  await page.submit();
  assert.equal(page.requests.length, 2);
  assert.equal(JSON.parse(page.requests[1][1].body).name, 'Another Guest');
  assert.equal(page.thanks.hidden, false);
  assert.equal(page.form.hidden, true);
});

test('local loopback addresses use normal database saving, error handling, and reset', async () => {
  for (const hostname of ['localhost', '127.0.0.1', '[::1]']) {
    let status = 500;
    const page = addressPage(() => ({ status }), hostname);
    assert.equal(page.button.disabled, false);
    assert.equal(page.status.hidden, true);
    await page.submit();
    assert.equal(page.requests.length, 1);
    assert.equal(page.failures.length, 1);
    assert.equal(page.form.hidden, false);
    assert.equal(page.thanks.hidden, true);
    assert.equal(page.error.hidden, false);
    status = 201;
    await page.submit();
    assert.equal(page.requests.length, 2);
    assert.match(page.requests[1][0], /^https:\/\/[^/]+\.supabase\.co\/rest\/v1\/addresses$/);
    assert.equal(page.requests[1][1].method, 'POST');
    assert.equal(JSON.parse(page.requests[1][1].body).name, 'Example Guest');
    assert.equal(page.form.hidden, true);
    assert.equal(page.thanks.hidden, false);
    assert.equal(page.thanks.focusCalls.length, 1);
    assert.equal(page.button.disabled, true);
    await page.submit();
    assert.equal(page.requests.length, 2);
    page.back.click();
    assert.equal(page.form.hidden, false);
    assert.equal(page.thanks.hidden, true);
    assert.equal(page.button.disabled, false);
    page.form.values.name = 'Another Guest';
    await page.submit();
    assert.equal(page.thanks.hidden, false);
    assert.equal(page.requests.length, 3);
    assert.equal(JSON.parse(page.requests[2][1].body).name, 'Another Guest');
  }
});

test('non-loopback hosts cannot accidentally bypass database saving', async () => {
  for (const hostname of ['localhost.example.com', '127.0.0.1.example.com', 'preview.example.com']) {
    const page = addressPage(() => ({ status: 201 }), hostname);
    await page.submit();
    assert.equal(page.requests.length, 1);
    assert.equal(page.status.hidden, true);
    assert.equal(page.thanks.hidden, false);
  }
});

test('US state suggestions match names and abbreviations without changing their two-letter values', () => {
  const page = addressPage(() => ({ status: 201 }));
  const codes = (country, query) => Array.from(page.regionOptions(country, query), ([code]) => code);
  assert.deepEqual(codes('United States', ' Tex '), ['TX']);
  assert.deepEqual(codes('U.S.A.', 'tx'), ['TX']);
  assert.deepEqual(codes('US', 'new '), ['NH', 'NJ', 'NM', 'NY']);
  assert.deepEqual(codes('United States of America', 'district'), ['DC']);
  assert.deepEqual(codes('United States', 'not a state'), []);
});

test('region suggestions follow the country and leave unsupported countries unrestricted', () => {
  const page = addressPage(() => ({ status: 201 }));
  const codes = (country, query) => Array.from(page.regionOptions(country, query), ([code]) => code);
  assert.deepEqual(codes(' canada ', 'Ontario'), ['ON']);
  assert.deepEqual(codes('CA', 'bc'), ['BC']);
  assert.deepEqual(codes('Australia', 'New South'), ['NSW']);
  assert.deepEqual(codes('AUS', 'vic'), ['VIC']);
  assert.deepEqual(codes('Canada', 'Texas'), []);
  assert.deepEqual(codes('United Kingdom', 'London'), []);
});

test('international addresses without a region remain compatible with the database', async () => {
  const page = addressPage(() => ({ status: 201 }));
  page.form.values.country = 'Singapore';
  page.form.values.state = '';
  await page.submit();
  assert.equal(JSON.parse(page.requests[0][1].body).state, 'N/A');
  assert.equal(page.thanks.hidden, false);
  page.back.click();
  page.form.values.country = 'France';
  page.form.values.state = 'Brittany';
  await page.submit();
  assert.equal(JSON.parse(page.requests[1][1].body).state, 'Brittany');
});
