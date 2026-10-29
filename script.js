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
  const thanks = form.parentElement.querySelector('.thanks');
  const initialLabel = btn.textContent;
  const table = TABLES[form.dataset.form];
  const backendConfigured = Boolean(table && SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
  btn.disabled = !backendConfigured;
  if (backendStatus) backendStatus.hidden = backendConfigured;

  if (form.dataset.form === 'address') {
    const announcement = document.querySelector('.entrance-hero');
    thanks.querySelector('[data-address-back]').addEventListener('click', () => {
      form.reset();
      thanks.hidden = true;
      thanks.style.minHeight = '';
      form.hidden = false;
      error.hidden = true;
      btn.textContent = initialLabel;
      btn.disabled = !backendConfigured;
      announcement.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }

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
        // The database requires nonempty state text, including countries without regions.
        if (!row.state && !addressRegionOptions(row.country).length) row.state = 'N/A';
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
    } catch (failure) {
      console.error('Form submission failed:', failure);
      error.hidden = false; // form stays filled in
      btn.disabled = false;
      btn.textContent = label;
      return;
    }
    if (form.dataset.form === 'address') {
      btn.textContent = 'Sent!';
      thanks.style.minHeight = `max(${form.offsetHeight}px, 100dvh)`;
      form.hidden = true;
      thanks.hidden = false;
      thanks.focus({ preventScroll: true });
      thanks.scrollIntoView({ block: 'center', behavior: 'instant' });
    } else {
      form.hidden = true;
      thanks.hidden = false;
      thanks.scrollIntoView({ block: 'center' });
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

function createAddressSuggestions(input) {
  const list = document.createElement('ul');
  list.id = `${input.id}-suggestions`;
  list.className = 'suggestions';
  list.role = 'listbox';
  list.hidden = true;
  input.after(list);
  input.parentElement.classList.add('has-suggestions');
  Object.entries({ role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false',
    'aria-controls': list.id, autocomplete: 'off' }).forEach(([key, value]) => input.setAttribute(key, value));

  let items = [];
  let active = -1;
  let choose;
  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  };
  const clear = () => {
    close();
    items = [];
    list.replaceChildren();
  };
  const highlight = index => {
    active = index;
    items.forEach((item, i) => item.setAttribute('aria-selected', String(i === index)));
    input.setAttribute('aria-activedescendant', items[index].id);
    items[index].scrollIntoView({ block: 'nearest', behavior: 'instant' });
  };
  const show = (options, onChoose) => {
    clear();
    choose = index => {
      close();
      onChoose(options[index].value);
    };
    list.replaceChildren(...options.map((option, index) => {
      const item = document.createElement('li');
      item.id = `${input.id}-option-${index}`;
      item.role = 'option';
      item.textContent = option.label;
      item.setAttribute('aria-selected', 'false');
      if (option.name) item.setAttribute('aria-label', option.name);
      item.addEventListener('mousedown', event => {
        event.preventDefault();
        choose(index);
      });
      return item;
    }));
    items = [...list.children];
    list.hidden = !items.length;
    input.setAttribute('aria-expanded', String(items.length > 0));
  };
  input.form.addEventListener('reset', clear);
  input.addEventListener('blur', close);
  input.addEventListener('keydown', event => {
    if (list.hidden) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); highlight((active + 1) % items.length); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); highlight(active <= 0 ? items.length - 1 : active - 1); }
    else if (event.key === 'Escape') close();
    else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      choose(active);
    }
  });
  return { close, clear, show };
}

const ADDRESS_REGIONS = {
  US: [
    ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
    ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
    ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
    ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
    ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
    ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
    ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
    ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
    ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
    ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
    ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
    ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
    ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
  ],
  CA: [
    ['AB', 'Alberta'], ['BC', 'British Columbia'], ['MB', 'Manitoba'],
    ['NB', 'New Brunswick'], ['NL', 'Newfoundland and Labrador'], ['NT', 'Northwest Territories'],
    ['NS', 'Nova Scotia'], ['NU', 'Nunavut'], ['ON', 'Ontario'], ['PE', 'Prince Edward Island'],
    ['QC', 'Quebec'], ['SK', 'Saskatchewan'], ['YT', 'Yukon'],
  ],
  AU: [
    ['ACT', 'Australian Capital Territory'], ['NSW', 'New South Wales'], ['NT', 'Northern Territory'],
    ['QLD', 'Queensland'], ['SA', 'South Australia'], ['TAS', 'Tasmania'],
    ['VIC', 'Victoria'], ['WA', 'Western Australia'],
  ],
};

function addressRegionOptions(country, query = '') {
  const countries = {
    us: 'US', usa: 'US', unitedstates: 'US', unitedstatesofamerica: 'US',
    ca: 'CA', can: 'CA', canada: 'CA',
    au: 'AU', aus: 'AU', australia: 'AU',
  };
  const code = countries[country.toLowerCase().replace(/[.\s]/g, '')];
  const search = query.trim().toLowerCase();
  return (ADDRESS_REGIONS[code] || []).filter(([abbreviation, name]) =>
    abbreviation.toLowerCase().startsWith(search) || name.toLowerCase().startsWith(search));
}

const regionInput = document.querySelector('#state');
const countryInput = document.querySelector('#country');
if (regionInput && countryInput) {
  const suggestions = createAddressSuggestions(regionInput);
  const normalize = () => {
    const value = regionInput.value.trim().toLowerCase();
    const match = addressRegionOptions(countryInput.value, value)
      .find(([abbreviation, name]) => abbreviation.toLowerCase() === value || name.toLowerCase() === value);
    if (match) regionInput.value = match[0];
  };
  const updateCountry = () => {
    suggestions.clear();
    regionInput.required = addressRegionOptions(countryInput.value).length > 0;
    regionInput.labels[0].textContent = regionInput.required ? 'State / Province' : 'State / Province (optional)';
    normalize();
  };
  const suggest = () => {
    const query = regionInput.value.trim();
    if (!query) return suggestions.clear();
    suggestions.show(addressRegionOptions(countryInput.value, query).map(([abbreviation, name]) => ({
      value: abbreviation, label: abbreviation, name: `${name} (${abbreviation})`,
    })), value => { regionInput.value = value; });
  };
  regionInput.addEventListener('input', suggest);
  regionInput.addEventListener('focus', suggest);
  regionInput.addEventListener('blur', normalize);
  countryInput.addEventListener('input', updateCountry);
  countryInput.addEventListener('change', updateCountry);
  regionInput.form.addEventListener('reset', () => queueMicrotask(updateCountry));
  updateCountry();
}

// Street-address autocomplete (Google Places API New). The key is public by
// design: it is restricted to this site's referrers and to the Places API.
// Failures are silent; guests can always type the address by hand.
const PLACES_API_KEY = 'AIzaSyC5nkQ34e-0lBW90y-JlG6o5GYn9sWHRJ4';
const placesStreet = document.querySelector('#address1');
if (placesStreet && PLACES_API_KEY) {
  const PLACES = 'https://places.googleapis.com/v1';
  const suggestions = createAddressSuggestions(placesStreet);

  let session = crypto.randomUUID();
  let timer;
  let latest = 0;
  placesStreet.form.addEventListener('reset', () => {
    clearTimeout(timer);
    latest++;
    session = crypto.randomUUID();
  });
  const setValue = (id, value) => { document.querySelector(id).value = value; };

  async function choose(placeId) {
    suggestions.close();
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
      countryInput.dispatchEvent(new Event('change', { bubbles: true }));
    } catch {} finally {
      session = crypto.randomUUID(); // a selection ends the billing session
    }
  }

  async function suggest() {
    const input = placesStreet.value.trim();
    const mine = ++latest;
    if (input.length < 3) return suggestions.close();
    try {
      const res = await fetch(`${PLACES}/places:autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': PLACES_API_KEY },
        body: JSON.stringify({ input, sessionToken: session, includedPrimaryTypes: ['street_address', 'premise', 'subpremise'] }),
      });
      if (!res.ok || mine !== latest) return;
      const predictions = ((await res.json()).suggestions || []).map(s => s.placePrediction).filter(Boolean);
      suggestions.show(predictions.map(prediction => ({
        value: prediction.placeId, label: prediction.text.text,
      })), choose);
    } catch {}
  }

  placesStreet.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(suggest, 250); });
}
