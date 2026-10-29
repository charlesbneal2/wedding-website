const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const source = readFileSync(join(__dirname, 'script.js'), 'utf8');

function addressPage(response) {
  const button = { disabled: true, textContent: 'Send my address' };
  const error = { hidden: true };
  const status = { hidden: false };
  const values = {
    name: 'Example Guest', email: 'guest@example.test', website: '',
    address1: '123 Example Street', address2: '', city: 'Houston',
    state: 'TX', zip: '77001', country: 'United States',
  };
  const form = {
    dataset: { form: 'address' },
    hidden: false,
    values,
    parentElement: { querySelector() { return null; } },
    querySelector(selector) {
      return selector === 'button[type=submit]' ? button :
        selector === '.error' ? error : status;
    },
    addEventListener(name, callback) { this.submit = callback; },
  };
  const requests = [];
  const failures = [];
  vm.runInNewContext(source, {
    document: {
      querySelector() { return null; },
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
    button, error, form, requests, failures,
    submit: () => form.submit({ preventDefault() {} }),
  };
}

test('a saved address confirms with Sent! without a thank-you element', async () => {
  const page = addressPage(() => ({ status: 201 }));
  await page.submit();
  assert.equal(page.button.textContent, 'Sent!');
  assert.equal(page.button.disabled, true);
  assert.equal(page.form.hidden, false);
  assert.equal(page.error.hidden, true);
  assert.equal(page.failures.length, 0);
  assert.equal(page.requests.length, 1);
});

test('a failed save preserves input and can retry without a thank-you element', async () => {
  let status = 500;
  const page = addressPage(() => ({ status }));
  const before = { ...page.form.values };
  await page.submit();
  assert.equal(page.button.textContent, 'Send my address');
  assert.equal(page.button.disabled, false);
  assert.equal(page.error.hidden, false);
  assert.equal(page.form.hidden, false);
  assert.deepEqual(page.form.values, before);
  assert.equal(page.failures.length, 1);
  status = 201;
  await page.submit();
  assert.equal(page.button.textContent, 'Sent!');
  assert.equal(page.error.hidden, true);
  assert.equal(page.requests.length, 2);
});

test('pending and saved addresses cannot be sent again', async () => {
  let resolveResponse;
  const response = new Promise(resolve => { resolveResponse = resolve; });
  const page = addressPage(() => response);
  const first = page.submit();
  assert.equal(page.button.disabled, true);
  await page.submit();
  assert.equal(page.requests.length, 1);
  resolveResponse({ status: 201 });
  await first;
  await page.submit();
  assert.equal(page.button.textContent, 'Sent!');
  assert.equal(page.requests.length, 1);
});
