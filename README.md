# wedding-website

Static HTML/CSS/JavaScript; no package installation or framework build is needed.

The selected Save the Date is `/save-the-date/`: curtain entrance A, no Replay
button, three covering photographs, and a cream mailing form with berry text.
Superseded preview/comparison pages have been removed.

[`DESIGNSPEC.md`](DESIGNSPEC.md) consolidates the settled page designs, fonts,
colors, transitions, decision history, and required mobile/desktop acceptance.
Both mobile and desktop must pass before a visual change is accepted.

## Local setup

### 1. Prerequisites

Install **Git** and **Python 3**, and make sure `git --version` and
`python --version` work in your terminal. You also need GitHub access to this
private repository.

### 2. Clone and launch

Run these commands in PowerShell or your terminal:

```powershell
git clone https://github.com/charlesbneal2/wedding-website.git
cd wedding-website
python -m http.server 8000 --bind 127.0.0.1
```

If you already cloned the repository, skip the clone command and open a terminal
in its root directory. On systems where Python is named `python3`, substitute
`python3` for `python`.

Keep the terminal running, then open:

| Page | Local URL |
|---|---|
| Save the Date | http://localhost:8000/save-the-date/ |
| Mailing address form | http://localhost:8000/save-the-date/#address |
| Home | http://localhost:8000/ |
| RSVP | http://localhost:8000/rsvp/ |

Edit the HTML, CSS, or JavaScript files and refresh the browser to see changes.
Press **Ctrl+C** in the terminal to stop the server.

### 3. Common setup issues

- **Repository not found:** sign in with a GitHub account that has access to the
  private repository.
- **Python not found:** install Python 3 and ensure it is available on your
  terminal's PATH, then reopen the terminal.
- **Port 8000 is already in use:** use
  `python -m http.server 8001 --bind 127.0.0.1` and open the same URLs on port 8001.
- **Missing styles or images:** start the server from the repository root,
  not inside `save-the-date`. Do not open `index.html` directly; asset paths
  require an HTTP server.

The local server previews the site only. Form submission remains disabled until
the Supabase table exists (`supabase/schema.sql`); see Deployment below.

## Deployment

`DEPLOYMENT.md` contains the rollout plan; `SPEC.md` section 6 contains the exact
GitHub Pages, Supabase, Squarespace DNS, and optional registrar-transfer
instructions.

`charlesbneal2/wedding-website` is the single source of truth; the personal fork
has been deleted. Push approved changes to `master` on `origin`.
The plan uses a curated GitHub Actions Pages artifact rather than publishing
the entire working tree. Pages administration and plan eligibility must be
verified for this repository and its owner before publication.
Keep the domain registered with Squarespace initially and point its web DNS to
Pages. Registration transfer is optional and requires a separate registrar.

The database schema is `supabase/schema.sql`; run it once in the Supabase SQL
Editor. `script.js` holds the project URL and publishable key (public by design).
Keep the secret key in the gitignored `.env`. A live browser-to-database save
must be verified before sharing with guests.

No live website deployment, domain transfer, or DNS change has been performed.
