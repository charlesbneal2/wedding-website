// Admin table for the addresses collected by the save-the-date form.
// Access is enforced by Supabase row-level security, not by this page: without a
// signed-in user the database returns no rows. The key below is the public one.
const SUPABASE_URL = 'https://bbzhzmtewslqanvovhcn.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_oGLRYHaUHs3eHIsOBHZR9A_Eve850Zz';
const FIELDS = ['name', 'email', 'address1', 'address2', 'city', 'state', 'zip', 'country'];

const db = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = id => document.getElementById(id);
const loginForm = $('login'), app = $('app'), rows = $('rows'), msg = $('msg');
let data = [];

function say(text, isError = false) {
  msg.textContent = text;
  msg.className = isError ? 'msg err' : 'msg';
}

function show(signedIn) {
  loginForm.hidden = signedIn;
  app.hidden = !signedIn;
}

async function load() {
  say('Loading…');
  const { data: result, error } = await db.from('addresses').select('*').order('created_at', { ascending: false });
  if (error) return say(`Could not load addresses: ${error.message}`, true);
  data = result;
  render();
  say('');
}

function render() {
  const q = $('filter').value.trim().toLowerCase();
  const shown = data.filter(r => !q || FIELDS.some(f => r[f].toLowerCase().includes(q)));
  $('count').textContent = `(${shown.length}${shown.length === data.length ? '' : ` of ${data.length}`})`;
  rows.replaceChildren(...shown.map(rowFor));
}

function rowFor(record) {
  const tr = document.createElement('tr');
  const date = tr.insertCell();
  date.className = 'date';
  date.textContent = new Date(record.created_at).toLocaleString();

  const inputs = {};
  for (const f of FIELDS) {
    const input = document.createElement('input');
    input.value = record[f];
    input.setAttribute('aria-label', f);
    input.addEventListener('input', () => input.classList.toggle('changed', input.value !== record[f]));
    inputs[f] = input;
    tr.insertCell().append(input);
  }

  const actions = tr.insertCell();
  actions.className = 'actions';
  const save = document.createElement('button');
  save.textContent = 'Save';
  save.addEventListener('click', async () => {
    const patch = {};
    for (const f of FIELDS) if (inputs[f].value.trim() !== record[f]) patch[f] = inputs[f].value.trim();
    if (!Object.keys(patch).length) return say('No changes to save.');
    save.disabled = true;
    // .select() makes a silently blocked update (0 rows) show up as an error.
    const { data: updated, error } = await db.from('addresses').update(patch).eq('id', record.id).select();
    save.disabled = false;
    if (error) return say(`Not saved: ${error.message}`, true);
    if (!updated.length) return say('Not saved: no permission, try signing in again.', true);
    Object.assign(record, updated[0]);
    for (const f of FIELDS) { inputs[f].value = record[f]; inputs[f].classList.remove('changed'); }
    say(`Saved ${record.name}.`);
  });

  const del = document.createElement('button');
  del.className = 'danger';
  del.textContent = 'Delete';
  del.addEventListener('click', async () => {
    if (!confirm(`Delete ${record.name} (${record.address1})? This cannot be undone.`)) return;
    del.disabled = true;
    const { data: removed, error } = await db.from('addresses').delete().eq('id', record.id).select();
    if (error || !removed.length) {
      del.disabled = false;
      return say(`Not deleted: ${error ? error.message : 'no permission, try signing in again.'}`, true);
    }
    data = data.filter(r => r.id !== record.id);
    render();
    say(`Deleted ${record.name}.`);
  });

  actions.append(save, del);
  return tr;
}

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const button = loginForm.querySelector('button');
  button.disabled = true;
  $('login-msg').textContent = '';
  const form = new FormData(loginForm);
  const { error } = await db.auth.signInWithPassword({ email: form.get('email'), password: form.get('password') });
  button.disabled = false;
  if (error) return ($('login-msg').textContent = 'Sign in failed. Check your email and password.');
  loginForm.reset();
});

$('logout').addEventListener('click', () => db.auth.signOut());
$('refresh').addEventListener('click', load);
$('filter').addEventListener('input', render);

db.auth.onAuthStateChange((_event, session) => {
  // Token refreshes fire this too; only (re)load when moving from signed out to in.
  const justSignedIn = Boolean(session) && app.hidden;
  show(Boolean(session));
  if (justSignedIn) load();
  else if (!session) { data = []; rows.replaceChildren(); }
});
db.auth.getSession().then(({ data: { session } }) => show(Boolean(session)));
