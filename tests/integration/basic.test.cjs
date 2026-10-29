const assert = require('node:assert/strict');
const { before, after, afterEach, test } = require('node:test');
const { startBrowser } = require('./browser.cjs');

let page;

function installFixtures() {
  const backend = window.testBackend = {
    submissions: [], mode: 'success', edits: [], deletes: [],
    signedIn: !location.search.includes('signed-out'), saveFails: false, reads: 0,
    records: [
      { id: 'guest-1', created_at: '2026-10-29T14:00:00Z', name: 'Example Guest',
        email: 'guest@example.test', address1: '12345 Very Long Example Boulevard Near the Beautiful Gardens and the Historic Town Square Building Number Eight',
        address2: 'Unit 12', city: 'Houston', state: 'TX', zip: '77001', country: 'United States' },
      { id: 'guest-2', created_at: '2026-10-28T15:00:00Z', name: 'Second Guest',
        email: 'second@example.test', address1: '1 Short Street', address2: '',
        city: 'Houston', state: 'TX', zip: '77001', country: 'United States' },
    ],
  };
  window.testErrors = [];
  window.addEventListener('error', event => { if (event.message) window.testErrors.push(event.message); });
  window.addEventListener('unhandledrejection', event => window.testErrors.push(String(event.reason)));
  window.testAssert = (condition, message) => { if (!condition) throw new Error(message); };
  window.fetch = async (input, options) => {
    const url = new URL(input, location.href);
    if (url.pathname === '/rest/v1/addresses') {
      backend.submissions.push(JSON.parse(options.body));
      if (backend.mode === 'pending') return new Promise(resolve => { backend.complete = resolve; });
      return new Response(null, { status: backend.mode === 'failure' ? 500 : 201 });
    }
    if (url.pathname.endsWith('places:autocomplete')) {
      return new Response(JSON.stringify({ suggestions: [
        { placePrediction: { placeId: 'fixture', text: { text: '123 Example Street, Canada' } } },
      ] }));
    }
    if (url.pathname === '/v1/places/fixture') {
      return new Response(JSON.stringify({ addressComponents: [
        { types: ['street_number'], longText: '123', shortText: '123' },
        { types: ['route'], longText: 'Example Street', shortText: 'Example St' },
        { types: ['locality'], longText: 'Toronto', shortText: 'Toronto' },
        { types: ['administrative_area_level_1'], longText: 'Ontario', shortText: 'ON' },
        { types: ['postal_code'], longText: 'M5V 2T6', shortText: 'M5V 2T6' },
        { types: ['country'], longText: 'Canada', shortText: 'CA' },
      ] }));
    }
    throw new Error(`Unexpected API request in an isolated test: ${url}`);
  };
  window.supabase = { createClient: () => ({
    from: () => ({
      select: () => ({ order: async () => {
        backend.reads++;
        return { data: backend.records, error: null };
      } }),
      update: patch => ({ eq: (_, id) => ({ select: async () => {
        if (backend.saveFails) return { data: null, error: { message: 'Fixture save failure' } };
        backend.edits.push(patch);
        const record = backend.records.find(record => record.id === id);
        Object.assign(record, patch);
        return { data: [record], error: null };
      } }) }),
      delete: () => ({ eq: (_, id) => ({ select: async () => {
        const record = backend.records.find(record => record.id === id);
        backend.deletes.push(id);
        backend.records = backend.records.filter(record => record.id !== id);
        return { data: [record], error: null };
      } }) }),
    }),
    auth: {
      onAuthStateChange(callback) {
        backend.authChanged = callback;
        queueMicrotask(() => callback('INITIAL_SESSION', backend.signedIn ? { user: { id: 'admin-fixture' } } : null));
      },
      getSession: async () => ({ data: { session: backend.signedIn ? { user: { id: 'admin-fixture' } } : null } }),
      signOut() { backend.signedIn = false; backend.authChanged('SIGNED_OUT', null); },
    },
  }) };
  window.fillAddress = () => {
    const form = document.querySelector('form[data-form=address]');
    for (const [name, value] of Object.entries({
      name: 'Example Guest', email: 'guest@example.test', address1: '123 Example Street',
      city: 'Houston', state: 'TX', zip: '77001', country: 'United States',
    })) form.elements[name].value = value;
    return form;
  };
}

before(async () => {
  page = await startBrowser();
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `(${installFixtures.toString()})();` });
});
after(async () => { if (page) await page.close(); });
afterEach(async () => {
  if (page) assert.deepEqual(await page.evaluate(() => window.testErrors), []);
});

for (const width of [1440, 390]) {
  test(`address validation, pending save, retry, confirmation and Back at ${width}px`, async () => {
    await page.viewport(width);
    await page.navigate('/save-the-date/#address');
    await page.waitFor(() => document.body.dataset.exited === 'true');
    await page.evaluate(async () => {
      const assert = window.testAssert, backend = window.testBackend;
      const form = document.querySelector('form[data-form=address]');
      const thanks = document.querySelector('.address-thanks');
      form.requestSubmit();
      assert(!backend.submissions.length && thanks.hidden, 'Invalid addresses bypass native validation');
      window.fillAddress();
      backend.mode = 'failure';
      form.requestSubmit();
      await new Promise(resolve => setTimeout(resolve, 30));
      assert(!form.hidden && thanks.hidden && !form.querySelector('.error').hidden &&
        form.elements.name.value === 'Example Guest', 'Failure clears data or shows success');
      backend.mode = 'pending';
      form.requestSubmit();
      assert(!form.hidden && thanks.hidden && form.querySelector('[type=submit]').disabled, 'Pending save shows success');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      assert(backend.submissions.length === 2, 'Pending address can be sent twice');
      backend.complete(new Response(null, { status: 201 }));
      await new Promise(resolve => setTimeout(resolve, 30));
      assert(form.hidden && !thanks.hidden && document.activeElement === thanks, 'Successful save does not focus confirmation');
      const section = document.querySelector('#address').getBoundingClientRect();
      assert(section.top <= 1 && section.bottom >= innerHeight - 1, 'Confirmation exposes the previous photograph');
      const dancers = [...thanks.querySelectorAll('.address-thanks-cat img')];
      await Promise.all(dancers.map(image => image.decode()));
      assert(new DOMMatrix(getComputedStyle(dancers[1].parentElement).transform).a === -1, 'Orange cat is not reflected');
      const dance = thanks.querySelector('.address-thanks-heading').getAnimations()[0];
      assert(dance, 'Shared dance animation is missing');
      dance.pause();
      for (let frame = 0; frame < 4; frame++) {
        dance.currentTime = 560 * frame / 4 + 1;
        await new Promise(resolve => requestAnimationFrame(resolve));
        assert(dancers.every(image => Math.abs(new DOMMatrix(getComputedStyle(image).transform).e +
          frame * image.getBoundingClientRect().width / 4) < 1), 'Dancing cats show different frames');
      }
      document.querySelector('[data-address-back]').click();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      assert(!form.hidden && thanks.hidden && scrollY === 0 &&
        document.activeElement === document.querySelector('.entrance-hero'), 'Back does not return to the opening photo');
      assert(form.elements.name.value === '' && form.elements.country.value === 'United States' &&
        backend.submissions.length === 2, 'Back fails to reset or resends information');
      assert(getComputedStyle(document.querySelector('.curtain-intro')).display === 'none', 'Back replays the curtain');
      assert(document.documentElement.scrollWidth <= innerWidth, 'Form overflows the viewport');
    });
  });

  test(`country-aware state suggestions, keyboard/touch, Places and reset at ${width}px`, async () => {
    await page.viewport(width);
    await page.navigate('/save-the-date/#address');
    await page.waitFor(() => document.body.dataset.exited === 'true');
    await page.evaluate(async () => {
      const assert = window.testAssert;
      const state = document.querySelector('#state'), country = document.querySelector('#country');
      const list = document.querySelector('#state-suggestions');
      const type = value => { state.value = value; state.dispatchEvent(new Event('input', { bubbles: true })); };
      const key = value => state.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
      const setCountry = value => { country.value = value; country.dispatchEvent(new Event('input', { bubbles: true })); };
      state.focus();
      const height = state.form.offsetHeight;
      type('tex');
      assert(list.textContent === 'TX' && !list.hidden && state.form.offsetHeight === height, 'Name suggestions change the layout or show full names');
      key('ArrowDown'); key('Enter');
      assert(state.value === 'TX' && list.hidden && !window.testBackend.submissions.length, 'Keyboard selection submits the form');
      type('new'); key('ArrowUp');
      assert(list.lastChild.getAttribute('aria-selected') === 'true', 'ArrowUp does not select the last result');
      key('ArrowDown');
      assert(list.firstChild.getAttribute('aria-selected') === 'true', 'Arrow navigation does not wrap');
      key('Escape');
      assert(list.hidden && !state.hasAttribute('aria-activedescendant'), 'Escape leaves an active suggestion');
      type('california'); state.blur();
      assert(state.value === 'CA', 'Fully typed state does not normalize');
      setCountry('Canada'); type('ont');
      assert(list.textContent === 'ON' && state.required, 'Canadian province suggestions are incorrect');
      setCountry('Australia'); type('new south');
      assert(list.textContent === 'NSW', 'Australian state suggestions are incorrect');
      setCountry('United Kingdom'); type('Greater London'); state.blur();
      assert(state.value === 'Greater London' && !state.required && list.hidden, 'Other countries cannot use free text');
      const street = document.querySelector('#address1');
      street.value = '123 Example';
      street.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 300));
      street.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
      street.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      await new Promise(resolve => setTimeout(resolve, 30));
      assert(country.value === 'Canada' && state.value === 'ON' && state.required, 'Places does not update region rules');
      const form = window.fillAddress();
      setCountry('Singapore');
      state.value = '';
      form.requestSubmit();
      await new Promise(resolve => setTimeout(resolve, 30));
      assert(window.testBackend.submissions[0].state === 'N/A' && form.hidden, 'International addresses without a region cannot save');
      document.querySelector('[data-address-back]').click();
      await new Promise(resolve => setTimeout(resolve, 30));
      assert(state.required && state.value === '' && country.value === 'United States' &&
        list.hidden && !list.children.length, 'Reset leaves stale region rules');
      state.focus();
      state.scrollIntoView({ block: 'center', behavior: 'instant' });
      type('tex');
    });
    const point = await page.evaluate(() => {
      const box = document.querySelector('#state-suggestions li').getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    });
    if (width <= 600) {
      await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
      await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
      await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
    }
    await page.waitFor(() => document.querySelector('#state').value === 'TX' && document.querySelector('#state-suggestions').hidden);
  });
}

test('mobile reduced motion keeps confirmation cats static', async () => {
  await page.viewport(390, 844, true);
  await page.navigate('/save-the-date/#address');
  await page.waitFor(() => document.body.dataset.exited === 'true');
  await page.evaluate(async () => {
    window.fillAddress().requestSubmit();
    await new Promise(resolve => setTimeout(resolve, 30));
    const thanks = document.querySelector('.address-thanks');
    window.testAssert(!thanks.hidden && thanks.getAnimations({ subtree: true }).length === 0,
      'Reduced motion still animates confirmation');
    window.testAssert(document.documentElement.scrollWidth <= innerWidth, 'Mobile confirmation overflows');
  });
});

test('signed-out admin page shows login without loading addresses', async () => {
  await page.viewport(1440);
  await page.navigate('/admin/?signed-out');
  await page.waitFor(() => !document.querySelector('#login').hidden);
  assert.equal(await page.evaluate(() => document.querySelector('#app').hidden &&
    window.testBackend.reads === 0 && !document.querySelector('#rows').children.length), true);
});

for (const width of [1440, 390]) {
  test(`admin fixed Street width, scrolling, filtering, edits and receipt time at ${width}px`, async () => {
    await page.viewport(width);
    await page.send('Emulation.setTimezoneOverride', { timezoneId: 'America/Chicago' });
    await page.navigate('/admin/');
    await page.waitFor(() => document.querySelectorAll('#rows tr').length === 2);
    const point = await page.evaluate(async () => {
      await document.fonts.ready;
      const input = document.querySelector('.street-cell input'), box = input.getBoundingClientRect();
      window.originalStreetWidth = box.width;
      if (innerWidth > 700) {
        const main = document.querySelector('main').getBoundingClientRect();
        const padding = parseFloat(getComputedStyle(document.body).paddingLeft);
        window.testAssert(Math.abs(main.left - padding) < 1 &&
          Math.abs(main.right - (innerWidth - padding)) < 1, 'Desktop table does not use the available page width');
        const original = input.value;
        input.value = '1234 Example Street Lane';
        window.testAssert(input.scrollWidth <= input.clientWidth + 2, 'Street column cannot show a typical 24-character address');
        input.value = original;
        window.testAssert(input.value.length > 24 && input.maxLength !== 24, 'Street display width truncates stored addresses');
      }
      const date = document.querySelector('td.date');
      window.testAssert(date.textContent === new Date('2026-10-29T14:00:00Z').toLocaleString() &&
        date.title.includes('2026-10-29T14:00:00.000Z'), 'Received is not the original timestamp in local time');
      return { x: box.left + 10, y: box.top + 10 };
    });
    if (width > 700) {
      await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
      await page.evaluate(() => {
        const input = document.querySelector('.street-cell input');
        window.testAssert(Math.abs(input.getBoundingClientRect().width - window.originalStreetWidth) < 1, 'Hover still resizes Street');
        input.focus();
      });
      await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
    } else await page.evaluate(() => document.querySelector('.street-cell input').focus());
    await page.evaluate(async () => {
      const assert = window.testAssert;
      const input = document.querySelector('.street-cell input'), scroll = document.querySelector('.scroll');
      if (innerWidth > 700) {
        assert(Math.abs(input.getBoundingClientRect().width - window.originalStreetWidth) < 1, 'Keyboard focus still resizes Street');
        assert(input.parentElement.nextElementSibling.getBoundingClientRect().left >= input.getBoundingClientRect().right,
          'Street overlaps the next column');
        input.focus();
        input.value += ' Additional Building';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        assert(Math.abs(input.getBoundingClientRect().width - window.originalStreetWidth) < 1 &&
          input.value.endsWith('Additional Building'), 'Editing resizes Street or truncates its value');
        scroll.scrollLeft = 200;
        assert(scroll.scrollLeft > 0 && scroll.tabIndex === 0, 'Table cannot scroll horizontally');
      }
      assert(document.documentElement.scrollWidth <= innerWidth, 'Table breaks the mobile page width');
      const received = document.querySelector('td.date').textContent;
      input.value = '123 Updated Example Street';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      window.testBackend.saveFails = true;
      document.querySelector('.actions button').click();
      await new Promise(resolve => setTimeout(resolve, 30));
      assert(input.classList.contains('changed') && document.querySelector('#msg').textContent.includes('Not saved'),
        'Failed edits do not preserve unsaved changes and report failure');
      window.testBackend.saveFails = false;
      document.querySelector('.actions button').click();
      await new Promise(resolve => setTimeout(resolve, 30));
      assert(window.testBackend.edits.length === 1 && !input.classList.contains('changed') &&
        !('created_at' in window.testBackend.edits[0]) && document.querySelector('td.date').textContent === received,
        'Saving edits changes the Received timestamp or leaves changes unsaved');
      input.blur();
      assert(innerWidth <= 700 || Math.abs(input.getBoundingClientRect().width - window.originalStreetWidth) < 1,
        'Street column changes width after blur');
      const filter = document.querySelector('#filter');
      filter.value = 'Second Guest';
      filter.dispatchEvent(new Event('input', { bubbles: true }));
      assert(document.querySelectorAll('#rows tr').length === 1, 'Filtering is broken');
      window.confirm = () => false;
      document.querySelector('.actions .danger').click();
      assert(!window.testBackend.deletes.length, 'Canceling deletion still deletes a row');
      window.confirm = () => true;
      document.querySelector('.actions .danger').click();
      await new Promise(resolve => setTimeout(resolve, 30));
      assert(window.testBackend.deletes.length === 1 && !document.querySelector('#rows').children.length,
        'Confirmed deletion does not update the table');
    });
  });
}
