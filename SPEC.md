# Trisa & Charles Wedding Website: Functional and Technical Reference

**Current design:** [`DESIGNSPEC.md`](DESIGNSPEC.md) is authoritative for the
active pages, fonts, motion, and mobile/desktop acceptance. Earlier full-site
layouts, RSVP presentation, and visual proposals below are historical or future
requirements, not instructions to replace the approved current UI.

**Domain:** `trisaandcharleswedding.com`
**Couple:** Trisa Vo & Charles Neal
**Event:** Saturday, June 26, 2027 · 5:00 PM · Kim Son Restaurant, 10603 Bellaire Blvd, Houston, TX 77072
**RSVP by:** Wednesday, May 26, 2027
**Dress code:** Cocktail attire
**Repo:** `github.com/charlesbneal2/wedding-website`, the single source of truth.
The personal fork has been deleted.

## 1. Goals

1. **Collect mailing addresses now** with a virtual save-the-date form, so the formal invitations can be addressed.
2. **Take RSVPs by about April 2027.** The printed RSVP card already says *"kindly confirm your attendance at trisaandcharleswedding.com"* and carries a QR code. RSVP is required before the invitations are mailed. It is not optional.
3. **Share wedding info**: date, time, venue, dress code, and later hotels, registry and FAQ.
4. **Never break the QR code.** The URL it encodes must work from the day invitations are mailed until after the wedding.
5. **Look like the invitation.** Scanning the card should feel like opening it again (see §3).

### Two phases, three pages

| Phase | Dates | How guests arrive | Landing page |
|---|---|---|---|
| **1. Save the date** | Now through about March 2027 | A link you text, email or post: `trisaandcharleswedding.com/save-the-date` | `/save-the-date/`, the address form |
| **2. RSVP** | About April through late May 2027 | QR code on the mailed RSVP card, which opens `https://trisaandcharleswedding.com/` | `/` (home), whose hero button reads **RSVP** and links to `/rsvp/` |

| Page | Purpose |
|---|---|
| `/` (home) | Hero, The Day, gallery. Its main button points to whichever form is current: "Save the Date" in phase 1, "RSVP" in phase 2 |
| `/save-the-date/` | A short page meant to be opened from a text message: photo, names and date, then the address form. Its thank-you message links to home |
| `/rsvp/` | Photo, names, date, time and dress code, then the RSVP form. Until RSVPs open it shows *"RSVPs open in April. Watch your mailbox!"* in place of the form |

All three pages share `style.css` and `script.js`. The header and footer markup is copied into each page. For three pages that's simpler than adding a build step or templating.

Out of scope: guest logins, a photo lightbox library, a CMS.

## 2. Architecture

```
 Guest phone (link now, QR code later)
        │
        ▼
 trisaandcharleswedding.com ──► GitHub Pages (static HTML/CSS/JS, free, HTTPS)
        │
        │  form submit (fetch POST, publishable key)
        ▼
 Supabase REST API ──► Postgres tables (insert-only for the public)
```

| Concern | Choice | Why |
|---|---|---|
| Site | Plain HTML + CSS + about 40 lines of JS. No framework, no build step | One page, rare edits, nothing to upgrade or break before 2027 |
| Hosting | GitHub Pages, curated GitHub Actions release | Static hosting, HTTPS and custom domain; publish only approved site files |
| Form backend | Supabase (Postgres + REST), called from the browser | Free tier, no server to run, a real database with a Table Editor both of you can use, CSV export for the stationer or labels |
| DNS | Your current registrar, pointed at GitHub Pages | No domain transfer needed |

### Alternatives considered

- **Google Form embed.** No code, but it looks generic and would clash with the invitation styling. Keep it as an emergency fallback.
- **Formspree, Basin or Netlify Forms.** Free tiers cap submissions (often 50 a month), and the data sits in a vendor dashboard instead of a spreadsheet.
- **Google Sheet + Apps Script.** Used first, then replaced: a database was preferred over a spreadsheet for storing responses.
- **Cloudflare Pages + D1.** A real database, but you'd build the admin view yourself. Supabase includes one.
- **Zola, The Knot or Joy.** Polished and free, but you can't match the invitation design, the apex domain doesn't work cleanly, and the vendor holds your data.

## 3. Visual Design: Matching the Invitation

The invitation suite (`assets/invitation.jpeg` once added) sets the theme:

- an embossed fuchsia gatefold with die-cut flower edges and tone-on-tone floral embossing
- an ivory insert card with gold-foil copperplate script names
- a wine-colored RSVP card with gold foil
- a blush envelope with a mauve floral liner (used for color only)
- English-only text
- a single-color lotus emblem

### 3.1 Core concept: the page is the invitation

The page background is the **fuchsia pocket**, with faint embossed flowers. The content sits on **ivory cards** with a thin gold rule, like the insert. The form section uses the **wine RSVP card** look. The footer is **blush**, like the envelope.

### 3.2 Palette

These values are sampled from the photo. Before launch, hold the real card next to the screen and adjust.

| Token | Hex | Source | Use |
|---|---|---|---|
| `--peony` | `#C4245A` | Fuchsia gatefold | Page background, buttons |
| `--peony-deep` | `#A81D4C` | Embossed shadow | Tone-on-tone flower motif, button hover |
| `--wine` | `#6B1A35` | RSVP card | Form section background, body text on ivory |
| `--blush` | `#F2C7CD` | Envelope | Footer, input focus ring |
| `--ivory` | `#FBF7F0` | Insert card | Content cards, inputs |
| `--gold` | `#C9A24C` | Foil | Script names and headings **on wine or peony only**, thin rules |
| `--gold-deep` | `#8E6B22` | Foil, darkened | Gold text on ivory (large display text only) |
| `--mauve` | `#7D5B60` | Liner line art | Captions |

**Contrast rule:** body text is always `--wine` on `--ivory`, or `--ivory` on `--wine`/`--peony`. Light gold on ivory fails WCAG contrast, so use gold on ivory only for large script text and never for form labels or paragraphs. Foil can't be reproduced on screen, so add a subtle gold gradient (`linear-gradient(#D9B866, #B08A36)` with `background-clip: text`) on the hero names only.

### 3.3 Typography

| Role | Card equivalent | Web font (Google Fonts) |
|---|---|---|
| Names and section headings | Flowing invitation calligraphy | **Pinyon Script**, 400, fallback cursive |
| Accent text | Light calligraphic lettering | **Pinyon Script**, 400 |
| Body text, date line, navigation and buttons | Regular, readable invitation serif | **Libre Baskerville**, 400/700, fallback Georgia |

Load only the weights and styles used, with `&display=swap`. Use the display family for headings, and the body family for paragraphs and form text.

### 3.4 Language

All page copy, form labels, headings and thank-you messages are English only. Write the text inline in the HTML; no translation library or language toggle is needed.

### 3.5 Motifs (inline SVG and CSS, no image files)

- **Embossed flowers:** one 5-petal flower outline as an inline SVG, tiled at low opacity in `--peony-deep` over `--peony`. That gives the tone-on-tone emboss look.
- **Die-cut edge:** a scalloped SVG divider at the top of each ivory card, echoing the flower-shaped die cut.
- **Gold rules:** 1 px `--gold` lines with a small centered ✦ between sections, like the foil accents.

### 3.6 Layout

Mobile-first, designed at 390 px wide. Desktop centers the content cards at a maximum width of about 720 px, with the peony background filling both sides. Every page has a small top nav (Home · Save the Date · RSVP) and the shared footer.

**Home (`/`)**

| # | Section | Background | Content | Photo |
|---|---|---|---|---|
| 1 | **Hero** | Photo, then an ivory card | Full-width photo, then an ivory card: "Together with their families", **Trisa Vo & Charles Neal** in display serif, "invite you to share in their wedding celebration", "SATURDAY, JUNE 26, 2027 · 5:00 PM", and the current call-to-action button (Save the Date or RSVP) | **#48** (window, both smiling, greenery) |
| 2 | **The Day** | Ivory card | Kim Son Restaurant, 10603 Bellaire Blvd, Houston, TX 77072, Google Maps link, 5:00 PM, **Dress Code: Cocktail Attire** | **#82** (ring), small and round-cropped |
| 3 | **Us** (gallery) | Peony with embossed flowers | CSS grid, 2 columns on mobile and 3 on desktop, all `loading="lazy"`, rounded corners, thin ivory border like prints | **#5, #7, #81, #63** |
| 4 | Travel & Stay, Registry, FAQ | Ivory cards | Added later (§8) | none |
| 5 | **Footer** | Forest green | Single-color lotus, charlesbneal2@gmail.com, "Photos by Yashar's Photos" | none |

**Save the Date (`/save-the-date/`)**

| # | Section | Content | Photo |
|---|---|---|---|
| 1 | Header | "Save the Date", names in display serif, "June 26, 2027 · Houston, Texas" | **#24** (close-up) |
| 2 | Form | Wine card styled like the RSVP card, with the address form (§4.1) | none |
| 3 | Footer | Shared footer, plus a link to home to "see more" | none |

**RSVP (`/rsvp/`)**

| # | Section | Content | Photo |
|---|---|---|---|
| 1 | Header | "RSVP", names, "Saturday, June 26, 2027 · 5:00 PM · Kim Son Restaurant", "Dress Code: Cocktail Attire", "Kindly reply by May 26, 2027" | **#5** (sofa portrait) |
| 2 | Form | Wine card with the RSVP form (§4.2), or the "RSVPs open in April" notice before then | none |
| 3 | Footer | Shared | none |

Photo numbers refer to the `Yasharsphotos - T&C Engagement-N.jpg` files. All seven are portrait, which works well on phones. On desktop, the hero photo is shown at a maximum height of `80vh` with `object-fit: cover` and `object-position` set so faces aren't cropped.

### 3.7 Photo handling

The originals are 2.6–8.3 MB each (35 MB total). Never serve them directly: on a phone over cellular the page would take a long time to load.

- Keep the originals in `assets/engagement/` and **out of git** (already gitignored, see §5).
- Export web versions to `assets/img/` at 1600 px on the long edge (hero 2000 px), JPEG quality about 80, about 200–400 KB each. Also export an 800 px version of each for `srcset`.
- This machine has no image tools. Do it once with any of:
  - `pip install --user pillow` and a 10-line throwaway script (not committed), or
  - squoosh.app in a browser, or
  - Windows Photos → Resize.
- Strip EXIF metadata (it can include location). Pillow drops it by default when you don't pass `exif=`.
- Use meaningful names: `hero.jpg`, `closeup.jpg`, `ring.jpg`, `sofa.jpg`, `doorway.jpg`, `armchair.jpg`, `piano.jpg`, each with an `-800.jpg` version.
- Write `alt` text for every photo, e.g. "Trisa and Charles smiling through an open window".
- **Usage rights:** confirmed. Credit "Photos by Yashar's Photos" in the footer.

### 3.8 Other design notes

- Open Graph tags (`og:title` = "Trisa & Charles · June 26, 2027", `og:image` = cropped `hero-800.jpg`) so links shared by text show the photo.
- Favicon: a gold "T&C" monogram, or the flower SVG in peony.
- Respect `prefers-reduced-motion`. The only motion is smooth scroll to the form.
- Accessibility: real `<label>`s, visible focus rings in `--blush`, and contrast per §3.2.

## 4. Forms

The address form lives on `/save-the-date/` and the RSVP form on `/rsvp/`. Both forms use the same `script.js`. A hidden `form` field (`address` or `rsvp`) picks the Supabase table via `TABLES`. Only `address` is wired up so far.

### 4.1 Save-the-date (address) form: phase 1

| Field (`name`) | Label | Type | Required | `autocomplete` |
|---|---|---|---|---|
| `name` | Name(s), as you'd like them on the envelope | text | ✅ | `name` |
| `email` | Email | email | ✅ | `email` |
| `phone` | Phone | tel | | `tel` |
| `address1` | Street address | text | ✅ | `address-line1` |
| `address2` | Apt / Unit | text | | `address-line2` |
| `city` | City | text | ✅ | `address-level2` |
| `state` | State / Province | text | ✅ | `address-level1` |
| `zip` | ZIP / Postal code | text | ✅ | `postal-code` |
| `country` | Country (default "United States") | text | ✅ | `country-name` |
| `guests` | Number of people in your household | number 1–10 | | |
| `note` | Note to the couple | textarea | | |
| `website` | (hidden honeypot) | text, visually hidden, `tabindex="-1"` | | `off` |

Success message: *"Thank you! Watch your mailbox for the invitation. 💌"*

### 4.2 RSVP form: phase 2

| Field (`name`) | Label | Type | Required |
|---|---|---|---|
| `name` | Your name | text | ✅ |
| `email` | Email | email | ✅ |
| `attending` | Will you attend? | radio: Joyfully accepts / Regretfully declines | ✅ |
| `party` | Number attending (including you) | number 0–10 | ✅ if accepting |
| `guestNames` | Names of everyone attending | textarea | |
| `dietary` | Dietary restrictions or allergies | text | |
| `note` | Note to the couple | textarea | |
| `website` | (honeypot) | hidden | |

Kim Son typically serves a set banquet menu, so a meal-choice field is left out. Add one only if the restaurant asks for counts per entrée.

**Known ceiling:** anyone can RSVP with any party size, because there's no guest-list lookup. Reconcile against your invite list in the database (§6). Add name lookup only if uninvited +1s become a real problem.

### 4.3 Front-end behavior (shared `script.js`)

1. Use native HTML validation (`required`, `type="email"`, `min`/`max`). No validation library.
2. On submit, `fetch` a JSON `POST` to `{SUPABASE_URL}/rest/v1/{table}` with the `apikey` header and `Prefer: return=minimal`. Success is HTTP `201`; anything else is a failure. A filled honeypot skips the request and shows success.
3. Disable the button and show "Sending…" while the request runs, which prevents double submits.
4. On success, replace the form with the thank-you message.
5. **Address autocomplete (save-the-date only).** Typing in Street address suggests addresses from the Google Places API (New). Picking one fills street, unit, city, state, ZIP and country; every field stays editable and failures are silent, so typing by hand always works. The Google key in `script.js` is public by design, so it must stay restricted in Google Cloud Console to HTTP referrers (`trisaandcharleswedding.com/*`, `www.…/*`, `localhost:8000/*` for testing) and to Places API (New) only, with a daily quota cap and a billing budget alert.
6. On failure, show *"Something went wrong. Please try again or email us at charlesbneal2@gmail.com."* Leave the form filled in so nothing is lost.

### 4.4 Backend: Supabase (`supabase/schema.sql`)

The browser POSTs JSON straight to Supabase's REST API
(`{SUPABASE_URL}/rest/v1/addresses`) with the **publishable** key. There is no
server code. The database enforces everything:

- `addresses` table: `id`, `created_at`, `name`, `email`, `address1`, `address2`,
  `city`, `state`, `zip`, `country`. Required fields are `not null` with length
  `check`s, email gets a basic format check, and a US ZIP must be 5 digits or ZIP+4.
- Row-level security is on. The `anon` role (the publishable key) may only
  `INSERT`. It cannot read, update or delete, so a visitor who copies the key
  from `script.js` still cannot see anyone's address.
- Phone, guest count and note are not collected (see `DESIGNSPEC.md` §7).
- RSVPs get their own table later; `TABLES` in `script.js` maps form name to table.

The **secret** key (in the untracked `.env`) bypasses RLS. Use it only from your
own machine for admin scripts. Never put it in `script.js` or commit it.

### 4.4a Admin page: `/admin/`

A password-protected table of the `addresses` rows where you can edit any cell
(Save per row), delete a row, filter by text and refresh.

- **Login:** Supabase Auth, email + password. Create and manage the two logins in
  the Supabase dashboard (Authentication → Users → Add user; set or reset the
  password there). There is no sign-up form.
- **Protection is in the database**, not the page: row-level security gives the
  `authenticated` role select/update/delete on `addresses` (see `supabase/schema.sql`).
  Without a login the same URL shows only the sign-in form and the API returns no rows.
- **Public signups must stay off** (Authentication → Sign In / Providers → turn off
  "Allow new users to sign up"). If they are on, any visitor could register and read
  every address.
- Edits are still checked by the table constraints (length, email format, US ZIP).
- The page is `noindex` and is published with the rest of the site.

### 4.5 Spam and duplicates

- The honeypot stops most bots. Add Cloudflare Turnstile only if spam actually shows up.
- Expect duplicates (double submits, or both partners filling it in). Dedupe by hand in the Table Editor before exporting.

## 5. Repo Layout

```
index.html                # home
save-the-date/index.html  # address form
rsvp/index.html           # RSVP form
admin/index.html          # password-protected address table (admin.js)
style.css
script.js                 # form handler, shared by both forms
CNAME                     # contains: trisaandcharleswedding.com
assets/
  img/                    # web-sized photos (committed)
  engagement/             # full-size originals (gitignored)
supabase/schema.sql       # database schema; run once in the Supabase SQL Editor
SPEC.md
```

`.gitignore` should contain:

```
assets/engagement/
*:Zone.Identifier
```

The `:Zone.Identifier` files are Windows download markers created when files are copied into WSL. They're safe to delete.

## 6. Setup and Deployment

### 6.1 Supabase (once)

1. In the Supabase dashboard open **SQL Editor → New query**, paste
   `supabase/schema.sql`, and **Run**. It is safe to rerun and never deletes rows.
2. Copy **Project URL** and the **publishable** key (Settings → API Keys) into
   `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` at the top of `script.js`. Both
   are public by design. Keep the **secret** key only in `.env` (gitignored).
3. Create your logins for `/admin/` (Authentication → Users → Add user) and switch off public signups (see §4.4a).
4. Submit one synthetic address from the live page and confirm it appears in
   **Table Editor → addresses** before sharing the link with guests.
5. View/export: Table Editor → addresses → **Export → CSV**.
6. Optional: Supabase free projects pause after about a week of inactivity.
   Sharing the link or opening the dashboard keeps it awake; check it before launch.

### 6.2 GitHub Pages release plan

`DEPLOYMENT.md` records the rollout order. The selected public Save the Date is
curtain A at `/save-the-date/`, without Replay or an A/B picker. Keep home and
RSVP routes intact. The original branch/root publishing idea is superseded by a
curated static artifact so development pages and backend files are not included
in the hosted site.

The original repository is the sole source and intended deployment repository.
The personal fork was deleted. Its rejected Pages activation does not establish
Pages eligibility for the original owner. Verify that owner's repository
permissions and plan before publication. No visibility or billing changes have
been made.

1. Use `charlesbneal2/wedding-website` on `master`; do not recreate the fork.
   Verify administrator access and Pages eligibility for the original owner. GitHub Free
   supports Pages from public repositories; eligible paid plans can support
   private repositories. Do not change visibility or purchase a plan implicitly.
2. The GitHub Actions Pages workflow is `.github/workflows/pages.yml`; it runs on
   every push to `master` and on manual dispatch. Set repository **Settings → Pages → Source → GitHub Actions**.
   No framework or package build is needed.
3. Package only `/`, `/save-the-date/`, `/rsvp/`, their required CSS/JavaScript,
   favicon, and referenced optimized images. Exclude `supabase/`, tests,
   docs, original photos, and guest data. Review/commit the
   intended release before pushing; local untracked files are not published
   automatically.
4. Use GitHub's configure-pages, upload-pages-artifact, and deploy-pages actions.
   Give the deployment job `pages: write` and `id-token: write`, and use the
   `github-pages` environment. Do not upload the entire working directory.
5. In the repository owner's **account Settings → Pages**, add and verify the
   domain using the supplied DNS TXT record. Keep that TXT record afterward.
   Then set repository **Pages → Custom domain** to
   `trisaandcharleswedding.com` before pointing web DNS to Pages.
6. Publish the approved artifact, apply section 6.3, wait for the domain and
   certificate checks, and enable **Enforce HTTPS**. Verify the canonical
   save-the-date URL, home, RSVP, assets, and an actual browser-to-database save.

The existing `CNAME` documents the intended domain but does not establish that
Pages, DNS, domain ownership, or HTTPS is configured. Root-relative asset paths
assume the custom domain's `/`; an unchanged `github.io/wedding-website/`
project URL needs base-path support before it can serve as a preview.

### 6.3 DNS records in Squarespace

Keep the domain registered with Squarespace for the initial launch. Connecting
web hosting does not require transferring the registration or nameservers.
Open the Squarespace domains dashboard, select `trisaandcharleswedding.com`,
then **DNS**. Save the current zone first. Replace only conflicting apex/`www`
web-routing records with the values below; preserve MX, SPF, DKIM, DMARC, and
unrelated records. Reauthenticate in Squarespace if prompted.

| Type | Host | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `charlesbneal2.github.io` *(original repository owner; configure Pages before applying)* |
| TXT | `_github-pages-challenge-charlesbneal2` | *(exact name/value supplied by the owning GitHub account in 6.2 step 5)* |

`www` points to the repository owner's `github.io` hostname, not a URL containing
`/wedding-website`. If ownership changes, replace the owner-specific CNAME/TXT
values with GitHub's actual instructions. Remove only forwarding that conflicts
with the intended website. Do not add wildcard records.

Squarespace advises allowing 24-48 hours for DNS changes to update. Verify
records with PowerShell `Resolve-DnsName`, then verify HTTPS and redirects in a
browser. Keep the domain registration and renewal active.

### 6.4 Verify the QR code (critical)

- The RSVP card's QR code encodes **`https://trisaandcharleswedding.com/`**, the bare apex domain over HTTPS. So:
  - The apex A/AAAA records and **Enforce HTTPS** (§6.2–6.3) are required. If HTTPS is broken, every scan fails.
  - Home is the RSVP landing page in phase 2. Its hero button must say **RSVP** and link to `/rsvp/` before invitations are mailed (§7).
  - Never move or redirect home away from `/`.
- Test the URL on cellular data, on both iPhone and Android.
- Submit one test entry through each form, confirm the row lands in the right tab, then delete it.

### 6.5 Optional registrar transfer away from Squarespace

GitHub Pages hosts the website; it is not a domain registrar. No destination
registrar has been selected. Moving registration is optional and should not be
combined with the initial web-host cutover.

1. Choose the new registrar and preserve all current DNS records.
2. In Squarespace's domains dashboard, select the domain and turn Domain Lock
   off if available. A recent registration, transfer, or registrant-contact
   change may impose a transfer lock; follow the account's displayed eligibility.
3. Choose **Request transfer code**, reauthenticate, and retrieve the
   authorization/EPP code from the registrant's email. Keep that code private.
4. Start the incoming transfer with the chosen registrar and supply the code
   there. Complete its confirmation steps; never commit or post the code.
5. After completion, confirm nameservers, all website/mail DNS, renewal settings,
   and HTTPS. Do not cancel the registration or lose its renewal.

A locked domain can still be pointed to the new website while transfer
eligibility is pending.

### 6.6 Official deployment references

Instructions and DNS values checked October 29, 2026:

- GitHub Pages workflows: `https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages`
- GitHub custom-domain DNS: `https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site`
- GitHub domain verification: `https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages`
- GitHub HTTPS: `https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https`
- Squarespace DNS: `https://support.squarespace.com/hc/en-us/articles/360002101888-Edit-your-domain-s-DNS-records`
- Squarespace transfers: `https://support.squarespace.com/hc/en-us/articles/205812338-Transferring-a-domain-away-from-Squarespace`

## 7. Day-to-Day Management

| Task | How |
|---|---|
| Edit text or add a section | Edit `index.html`, then `git commit && git push`. It's live in about a minute |
| Edit without a terminal | Use the github.com web editor and commit to `master` |
| Open RSVPs (phase 2) | In `rsvp/index.html`, remove `hidden` from `#rsvp-form-wrap` and add `hidden` to the `.notice` div. In `index.html`, point the hero button at `/rsvp/` and change its text to "RSVP". Push |
| Close save-the-date | In `save-the-date/index.html`, swap the form for "Address collection is closed. Contact us directly." Leave the page up, since old links still point to it |
| See responses | Supabase dashboard → Table Editor → `addresses` |
| Track who hasn't responded | Compare the `addresses` export against your guest list, or check people off by hand |
| Export addresses | Dedupe, then Table Editor → **Export → CSV**. Stationers and Avery templates accept CSV |
| Headcount for Kim Son | Once the RSVP table exists: `select sum(party) from rsvps where attending = 'Joyfully accepts'` in the SQL Editor |

## 8. Timeline

| When | Milestone |
|---|---|
| **Nov 2026** | Phase 1 live: home, `/save-the-date/`, and `/rsvp/` showing the "opens in April" notice. Send `trisaandcharleswedding.com/save-the-date` to guests by text, email and social media |
| Nov 2026 – Feb 2027 | Collect addresses. Nudge anyone who hasn't responded in January |
| ~Mar 1, 2027 | Address cutoff. Export and send to the stationer |
| Mar 2027 | Build the RSVP form, set the RSVP deadline, add Travel & Stay, Registry and FAQ. **Test the QR code against the live site** |
| ~Apr 1, 2027 | Open RSVPs (§7), **then** mail the invitations (8–12 weeks out) |
| May 26, 2027 | RSVP deadline. Give Kim Son the final headcount |
| June 26, 2027 | 🎉 |
| After | The domain expires **Sept 28, 2027**. Keep auto-renew on through at least mid-2028. Optionally post wedding photos |

## 9. Costs

| Item | Cost |
|---|---|
| Domain | Already owned (Squarespace, expires Sept 28, 2027; turn auto-renew on) |
| GitHub Pages | $0 |
| Supabase | $0 (free tier) |
| **Total** | **$0 a year beyond domain renewal** |

## 10. Later, Only If Needed

- **Turnstile captcha:** only if spam gets past the honeypot.
- **RSVP name lookup** against the invitee list: only if uninvited +1s become a problem.
- **Password protection:** GitHub Pages can't do it. Keep sensitive details off the site, or move to Cloudflare Pages with Access.

## 11. Decisions

| Question | Answer |
|---|---|
| Venue | Kim Son, Bellaire location: 10603 Bellaire Blvd, Houston, TX 77072 |
| Domain registrar | Squarespace Domains, using Squarespace DNS. Expires Sept 28, 2027 |
| Hosting | GitHub Pages with a curated Actions artifact; verify plan/visibility eligibility before launch |
| RSVP deadline | May 26, 2027 |
| Language | English only |
| Envelope liner | Colors only. No toile pattern on the site |
| Photos | Web use OK. Credit "Photos by Yashar's Photos" |
| Contact email | charlesbneal2@gmail.com, shown in the footer and the form error message as a plain `mailto:` link |
