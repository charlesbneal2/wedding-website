// Paste the Apps Script web app "/exec" URL here (SPEC.md §6.1 step 4).
const APPS_SCRIPT_URL = 'PASTE_APPS_SCRIPT_URL_HERE';

document.querySelectorAll('form[data-form]').forEach(form => {
  const btn = form.querySelector('button[type=submit]');
  const error = form.querySelector('.error');
  const thanks = form.parentElement.querySelector('.thanks');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    error.hidden = true;
    try {
      const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: new FormData(form) });
      if (!(await res.json()).ok) throw new Error('rejected');
      form.hidden = true;
      thanks.hidden = false;
      thanks.scrollIntoView({ block: 'center' });
    } catch {
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
