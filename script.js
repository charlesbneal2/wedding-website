// Paste the Apps Script web app "/exec" URL here (SPEC.md §6.1 step 4).
const APPS_SCRIPT_URL = 'PASTE_APPS_SCRIPT_URL_HERE';

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
  const backendConfigured = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(APPS_SCRIPT_URL);
  btn.disabled = !backendConfigured;
  if (backendStatus) backendStatus.hidden = backendConfigured;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!backendConfigured) {
      error.hidden = false;
      return;
    }
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    error.hidden = true;
    try {
      const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: new FormData(form) });
      if (!res.ok) throw new Error(`Submission failed (${res.status})`);
      if ((await res.json()).ok !== true) throw new Error('Submission was not saved');
      form.hidden = true;
      thanks.hidden = false;
      thanks.scrollIntoView({ block: 'center' });
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
