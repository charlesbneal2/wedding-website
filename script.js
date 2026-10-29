// Supabase project URL and publishable key (SPEC.md §6.1). Both are safe to
// ship in the browser: row-level security lets this key only INSERT addresses.
// Never put the secret key here.
const SUPABASE_URL = 'https://bbzhzmtewslqanvovhcn.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_oGLRYHaUHs3eHIsOBHZR9A_Eve850Zz';
// Form name -> table. RSVPs stay disabled until their table exists.
const TABLES = { address: 'addresses' };
const ADDRESS_FIELDS = ['name', 'email', 'address1', 'address2', 'city', 'state', 'zip', 'country'];

const addressLink = document.querySelector('.save-date-scroll');
if (addressLink) {
  const cover = document.querySelector('.save-date-cover');
  const updateAddressLink = () => {
    const coverHeight = cover.offsetHeight;
    const coverStart = cover.parentElement.getBoundingClientRect().top + window.scrollY;
    // Let a tall portrait scroll fully into view before its bottom edge pins.
    const photoTop = `${Math.min(0, window.innerHeight - coverHeight)}px`;
    if (cover.style.getPropertyValue('--save-date-photo-top') !== photoTop) {
      cover.style.setProperty('--save-date-photo-top', photoTop);
    }
    if (cover.hasAttribute('data-scroll-blur')) {
      const blur = `${(Math.min(1, Math.max(0, (window.scrollY - coverStart) / coverHeight)) * 14).toFixed(2)}px`;
      if (cover.style.getPropertyValue('--save-date-photo-blur') !== blur) {
        cover.style.setProperty('--save-date-photo-blur', blur);
      }
    }
    const hidden = window.scrollY >= coverStart + coverHeight * .2 &&
      document.activeElement !== addressLink;
    if (addressLink.hidden !== hidden) addressLink.hidden = hidden;
  };
  window.addEventListener('scroll', updateAddressLink, { passive: true });
  window.addEventListener('resize', updateAddressLink);
  window.addEventListener('load', updateAddressLink);
  addressLink.addEventListener('blur', updateAddressLink);
  updateAddressLink();
}

const bannerToggle = document.querySelector('.banner-toggle');
if (bannerToggle) {
  const banner = bannerToggle.closest('.wedding-banner');
  bannerToggle.hidden = false;
  bannerToggle.addEventListener('click', () => {
    const paused = banner.classList.toggle('is-paused');
    bannerToggle.setAttribute('aria-pressed', String(paused));
    bannerToggle.setAttribute('aria-label', paused ? 'Play date banner' : 'Pause date banner');
    bannerToggle.textContent = paused ? 'Play' : 'Pause';
  });
}

document.querySelectorAll('form[data-form]').forEach(form => {
  const btn = form.querySelector('button[type=submit]');
  const error = form.querySelector('.error');
  const backendStatus = form.querySelector('[data-backend-status]');
  const table = TABLES[form.dataset.form];
  const backendConfigured = Boolean(table && SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
  btn.disabled = !backendConfigured;
  if (backendStatus) backendStatus.hidden = backendConfigured;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!backendConfigured) {
      error.hidden = false;
      return;
    }
    if (btn.disabled) return;
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    error.hidden = true;
    try {
      const data = new FormData(form);
      // Bots fill the hidden honeypot: pretend success, store nothing.
      if (!data.get('website')) {
        const row = Object.fromEntries(ADDRESS_FIELDS.map(f => [f, String(data.get(f) ?? '').trim()]));
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(row),
        });
        if (res.status !== 201) throw new Error(`Submission failed (${res.status})`);
      }
      if (form.dataset.form === 'address') {
        btn.textContent = 'Sent!';
      } else {
        const thanks = form.parentElement.querySelector('.thanks');
        form.hidden = true;
        thanks.hidden = false;
        thanks.scrollIntoView({ block: 'center' });
      }
    } catch (failure) {
      console.error('Form submission failed:', failure);
      error.hidden = false; // form stays filled in
      btn.disabled = false;
      btn.textContent = label;
    }
  });
});

// RSVP: only ask for party details when attending.
const rsvp = document.querySelector('form[data-form=rsvp]');
if (rsvp) {
  const details = rsvp.querySelector('.if-attending');
  const party = rsvp.querySelector('#party');
  rsvp.addEventListener('change', e => {
    if (e.target.name !== 'attending') return;
    const yes = e.target.value === 'Joyfully accepts';
    details.hidden = !yes;
    party.disabled = !yes;
    party.required = yes;
  });
}

// Street-address autocomplete (Google Places API New). The key is public by
// design: it is restricted to this site's referrers and to the Places API.
// Failures are silent; guests can always type the address by hand.
const PLACES_API_KEY = 'AIzaSyC5nkQ34e-0lBW90y-JlG6o5GYn9sWHRJ4';
const placesStreet = document.querySelector('#address1');
if (placesStreet && PLACES_API_KEY) {
  const PLACES = 'https://places.googleapis.com/v1';
  const list = document.createElement('ul');
  list.id = 'address1-suggestions';
  list.className = 'suggestions';
  list.role = 'listbox';
  list.hidden = true;
  placesStreet.after(list);
  placesStreet.parentElement.classList.add('has-suggestions');
  Object.entries({ role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false',
    'aria-controls': list.id, autocomplete: 'off' }).forEach(([k, v]) => placesStreet.setAttribute(k, v));

  let session = crypto.randomUUID();
  let timer;
  let latest = 0;
  let active = -1;
  let items = [];

  const close = () => {
    list.hidden = true;
    placesStreet.setAttribute('aria-expanded', 'false');
    placesStreet.removeAttribute('aria-activedescendant');
    active = -1;
  };
  const highlight = index => {
    active = index;
    items.forEach((li, i) => li.setAttribute('aria-selected', String(i === index)));
    if (index >= 0) placesStreet.setAttribute('aria-activedescendant', items[index].id);
    else placesStreet.removeAttribute('aria-activedescendant');
  };
  const setValue = (id, value) => { document.querySelector(id).value = value; };

  async function choose(placeId) {
    close();
    try {
      const res = await fetch(`${PLACES}/places/${placeId}?sessionToken=${session}`, {
        headers: { 'X-Goog-Api-Key': PLACES_API_KEY, 'X-Goog-FieldMask': 'addressComponents' },
      });
      if (!res.ok) return;
      const components = (await res.json()).addressComponents || [];
      const part = (type, short) => {
        const c = components.find(c => c.types.includes(type));
        return c ? (short ? c.shortText : c.longText) : '';
      };
      const country = part('country');
      const us = country === 'United States';
      setValue('#address1', [part('street_number'), part('route')].filter(Boolean).join(' ') || placesStreet.value);
      setValue('#address2', part('subpremise'));
      setValue('#city', part('locality') || part('postal_town') || part('sublocality_level_1') || part('administrative_area_level_2'));
      setValue('#state', part('administrative_area_level_1', us));
      setValue('#zip', part('postal_code'));
      setValue('#country', country);
    } catch {} finally {
      session = crypto.randomUUID(); // a selection ends the billing session
    }
  }

  async function suggest() {
    const input = placesStreet.value.trim();
    const mine = ++latest;
    if (input.length < 3) return close();
    try {
      const res = await fetch(`${PLACES}/places:autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': PLACES_API_KEY },
        body: JSON.stringify({ input, sessionToken: session, includedPrimaryTypes: ['street_address', 'premise', 'subpremise'] }),
      });
      if (!res.ok || mine !== latest) return;
      const predictions = ((await res.json()).suggestions || []).map(s => s.placePrediction).filter(Boolean);
      list.replaceChildren(...predictions.map((p, i) => {
        const li = document.createElement('li');
        li.id = `address1-option-${i}`;
        li.role = 'option';
        li.textContent = p.text.text;
        // mousedown fires before the input's blur closes the list
        li.addEventListener('mousedown', e => { e.preventDefault(); choose(p.placeId); });
        return li;
      }));
      items = [...list.children];
      active = -1;
      list.hidden = !items.length;
      placesStreet.setAttribute('aria-expanded', String(items.length > 0));
    } catch {}
  }

  placesStreet.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(suggest, 250); });
  placesStreet.addEventListener('blur', close);
  placesStreet.addEventListener('keydown', e => {
    if (list.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); highlight((active + 1) % items.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight((active - 1 + items.length) % items.length); }
    else if (e.key === 'Escape') close();
    else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault(); // don't submit the form
      items[active].dispatchEvent(new MouseEvent('mousedown'));
    }
  });
}
