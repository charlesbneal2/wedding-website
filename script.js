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
  const thanks = form.parentElement.querySelector('.thanks');
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
      thanks.hidden = false;
      if (form.dataset.form === 'address') {
        btn.textContent = 'Sent!';
      } else {
        form.hidden = true;
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
