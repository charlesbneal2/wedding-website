# Trisa & Charles Wedding Website: Design Spec

**Domain:** `trisaandcharleswedding.com`
**Couple:** Trisa Vo & Charles Neal
**Event:** Saturday, June 26, 2027 · 5:00 PM · Kim Son Restaurant, 10603 Bellaire Blvd, Houston, TX 77072
**RSVP by:** Wednesday, May 26, 2027
**Dress code:** Cocktail attire
**Repo:** `github.com/charlesbneal2/wedding-website`

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
        │  form submit (fetch POST)
        ▼
 Google Apps Script web app ──► Google Sheet: tabs "Addresses" and "RSVPs"
        │
        └─► (optional) email notification to the couple
```

| Concern | Choice | Why |
|---|---|---|
| Site | Plain HTML + CSS + about 40 lines of JS. No framework, no build step | One page, rare edits, nothing to upgrade or break before 2027 |
| Hosting | GitHub Pages | Free, HTTPS, custom domain, deploys on `git push` |
| Form backend | Google Apps Script → Google Sheet | Free, no server to run, both of you can see and edit the data, exports to CSV for the stationer or labels |
| DNS | Your current registrar, pointed at GitHub Pages | No domain transfer needed |

### Alternatives considered

- **Google Form embed.** No code, but it looks generic and would clash with the invitation styling. Keep it as an emergency fallback.
- **Formspree, Basin or Netlify Forms.** Free tiers cap submissions (often 50 a month), and the data sits in a vendor dashboard instead of a spreadsheet.
- **Cloudflare Pages + D1, or Supabase.** A real database, but more code and you'd have to build an admin view. Overkill for about 150 households.
- **Zola, The Knot or Joy.** Polished and free, but you can't match the invitation design, the apex domain doesn't work cleanly, and the vendor holds your data.

## 3. Visual Design: Matching the Invitation

The invitation suite (`assets/invitation.jpeg` once added) sets the theme:

- an embossed fuchsia gatefold with die-cut flower edges and tone-on-tone floral embossing
- an ivory insert card with gold-foil copperplate script names
- a wine-colored RSVP card with gold foil
- a blush envelope with a mauve floral liner (used for color only)
- bilingual English and Vietnamese text
- the motto *strength · belief · determination* in gold script

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
| `--mauve` | `#7D5B60` | Liner line art | Vietnamese subtitles, captions |

**Contrast rule:** body text is always `--wine` on `--ivory`, or `--ivory` on `--wine`/`--peony`. Light gold on ivory fails WCAG contrast, so use gold on ivory only for large script text and never for form labels or paragraphs. Foil can't be reproduced on screen, so add a subtle gold gradient (`linear-gradient(#D9B866, #B08A36)` with `background-clip: text`) on the hero names only.

### 3.3 Typography

| Role | Card equivalent | Web font (Google Fonts) |
|---|---|---|
| Names, motto | Gold copperplate script | **Pinyon Script** (closest to the foil), fallback Great Vibes |
| Section headings ("RSVP", "Dress Code") | Bold italic serif in gold | **Playfair Display**, 700 italic |
| Body text, date line | Typewriter-style serif | **IBM Plex Mono** 400/500, or Courier Prime if its Vietnamese rendering looks right |

**Vietnamese diacritics:** confirm that every chosen font renders *Trân trọng kính mời*, *Cùng với gia đình* and *Thứ Bảy* correctly, with no fallback-font glyphs, before you commit to it. Load only the weights you use, with `&display=swap`. Use the script font only for names and the motto, never for paragraphs or form text, because it's hard to read.

### 3.4 Bilingual text

Mirror the invitation: English first, with Vietnamese on the next line, smaller and in `--mauve`/italic. Apply this to the hero lines, section headings and thank-you messages (form labels are English only), for example:

```
Together with their families
Cùng với gia đình
```

Write it inline in the HTML. No i18n library and no language toggle. Claude drafts the Vietnamese from the invitation's wording, and **Trisa and family proofread it before launch**.

### 3.5 Motifs (inline SVG and CSS, no image files)

- **Embossed flowers:** one 5-petal flower outline as an inline SVG, tiled at low opacity in `--peony-deep` over `--peony`. That gives the tone-on-tone emboss look.
- **Die-cut edge:** a scalloped SVG divider at the top of each ivory card, echoing the flower-shaped die cut.
- **Gold rules:** 1 px `--gold` lines with a small centered ✦ between sections, like the foil accents.

### 3.6 Layout

Mobile-first, designed at 390 px wide. Desktop centers the content cards at a maximum width of about 720 px, with the peony background filling both sides. Every page has a small top nav (Home · Save the Date · RSVP) and the shared footer.

**Home (`/`)**

| # | Section | Background | Content | Photo |
|---|---|---|---|---|
| 1 | **Hero** | Photo, then an ivory card | Full-width photo, then an ivory card: "Together with their families / Cùng với gia đình", **Trisa Vo & Charles Neal** in gold script, "invite you to share in their wedding celebration / Trân trọng kính mời đến dự lễ cưới", "SATURDAY, JUNE 26, 2027 · 5:00 PM", and the current call-to-action button (Save the Date or RSVP) | **#48** (window, both smiling, greenery) |
| 2 | **The Day** | Ivory card | Kim Son Restaurant, 10603 Bellaire Blvd, Houston, TX 77072, Google Maps link, 5:00 PM, **Dress Code: Cocktail Attire** | **#82** (ring), small and round-cropped |
| 3 | **Us** (gallery) | Peony with embossed flowers | CSS grid, 2 columns on mobile and 3 on desktop, all `loading="lazy"`, rounded corners, thin ivory border like prints | **#5, #7, #81, #63** |
| 4 | Travel & Stay, Registry, FAQ | Ivory cards | Added later (§8) | none |
| 5 | **Footer** | Blush | *strength · belief · determination* in gold-deep script, charlesbneal2@gmail.com, "Photos by Yashar's Photos" | none |

**Save the Date (`/save-the-date/`)**

| # | Section | Content | Photo |
|---|---|---|---|
| 1 | Header | "Save the Date / Xin hãy dành ngày", names in gold script, "June 26, 2027 · Houston, Texas" | **#24** (close-up) |
| 2 | Form | Wine card styled like the RSVP card, with the address form (§4.1) | none |
| 3 | Footer | Shared footer, plus a link to home to "see more" | none |

**RSVP (`/rsvp/`)**

| # | Section | Content | Photo |
|---|---|---|---|
| 1 | Header | "RSVP", names, "Saturday, June 26, 2027 · 5:00 PM · Kim Son Restaurant", "Dress Code: Cocktail Attire", "Kindly reply by May 26, 2027 / Vui lòng hồi âm trước ngày 26 tháng 5 năm 2027" (Vietnamese to be proofread) | **#5** (sofa portrait) |
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

The address form lives on `/save-the-date/` and the RSVP form on `/rsvp/`. Both forms post to the same Apps Script URL. A hidden `form` field (`address` or `rsvp`) picks which tab of the sheet the row goes to.

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

Success message: *"Thank you! Watch your mailbox for the invitation. 💌 / Cảm ơn bạn!"*

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

**Known ceiling:** anyone can RSVP with any party size, because there's no guest-list lookup. Reconcile against your invite list in the sheet (§6). Add name lookup only if uninvited +1s become a real problem.

### 4.3 Front-end behavior (shared `script.js`)

1. Use native HTML validation (`required`, `type="email"`, `min`/`max`). No validation library.
2. On submit, call `fetch(APPS_SCRIPT_URL, { method: 'POST', body: new FormData(form) })`. A FormData request is a "simple" request, so there's no CORS preflight.
3. Disable the button and show "Sending…" while the request runs, which prevents double submits.
4. On success, replace the form with the thank-you message.
5. On failure, show *"Something went wrong. Please try again or email us at charlesbneal2@gmail.com."* Leave the form filled in so nothing is lost.

### 4.4 Backend: `apps-script/Code.gs`

```js
const TABS = {
  address: ['name','email','phone','address1','address2','city','state','zip','country','guests','note'],
  rsvp:    ['name','email','attending','party','guestNames','dietary','note'],
};

function doPost(e) {
  const p = e.parameter;
  if (p.website) return json({ ok: true });            // honeypot: bots fill the hidden field
  const fields = TABS[p.form];
  if (!fields || !p.name) return json({ ok: false, error: 'bad request' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);                                 // avoid row collisions on simultaneous submits
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(p.form === 'rsvp' ? 'RSVPs' : 'Addresses');
    sheet.appendRow([new Date(), ...fields.map(f => String(p[f] || '').slice(0, 500))]);
  } finally {
    lock.releaseLock();
  }
  // Optional: MailApp.sendEmail('you@example.com', `New ${p.form}: ${p.name}`, JSON.stringify(p, null, 2));
  return json({ ok: true });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
```

The form `name` attributes must match the `TABS` arrays exactly.

### 4.5 Spam and duplicates

- The honeypot stops most bots. Add Cloudflare Turnstile only if spam actually shows up.
- Expect duplicates (double submits, or both partners filling it in). Dedupe by hand in the sheet before exporting.

## 5. Repo Layout

```
index.html                # home
save-the-date/index.html  # address form
rsvp/index.html           # RSVP form
style.css
script.js                 # form handler, shared by both forms
CNAME                     # contains: trisaandcharleswedding.com
assets/
  img/                    # web-sized photos (committed)
  engagement/             # full-size originals (gitignored)
apps-script/Code.gs       # copy of the backend, for version control only
SPEC.md
```

`.gitignore` should contain:

```
assets/engagement/
*:Zone.Identifier
```

The `:Zone.Identifier` files are Windows download markers created when files are copied into WSL. They're safe to delete.

## 6. Setup and Deployment

### 6.1 Google Sheet and Apps Script (once)

1. Create a Google Sheet named **Wedding Responses** with two tabs:
   - `Addresses`, with headers: `Timestamp, Name, Email, Phone, Address 1, Address 2, City, State, ZIP, Country, Guests, Note`
   - `RSVPs`, with headers: `Timestamp, Name, Email, Attending, Party, Guest Names, Dietary, Note`
2. Open **Extensions → Apps Script**, paste in `Code.gs`, and save.
3. Choose **Deploy → New deployment → Web app**. Set Execute as **Me** and Who has access to **Anyone**.
4. Authorize it, then copy the `/exec` URL into `APPS_SCRIPT_URL` in `script.js`.
5. Share the sheet with Trisa as an editor.
6. To update the script later, use **Deploy → Manage deployments → Edit → New version**. This keeps the same URL. Making a "New deployment" creates a new URL and breaks the forms.

### 6.2 GitHub Pages (once)

1. Commit the site files, including `CNAME`.
2. In the repo, go to **Settings → Pages → Source: Deploy from a branch → `master` / root**.
   - The repo is currently **private**. Make it public first (**Settings → General → Danger Zone → Change visibility**), because a free GitHub account only serves Pages from public repos. That's OK: guest data lives in the Google Sheet, not the repo. **Never commit exported address or RSVP CSVs.**
3. Under **Settings → Pages → Custom domain**, enter `trisaandcharleswedding.com`.
4. In your account's **Settings → Pages → Verified domains**, verify the domain with the TXT record GitHub gives you. This prevents domain takeover.
5. Once DNS resolves, tick **Enforce HTTPS**. The certificate can take up to about an hour.

### 6.3 DNS records in Squarespace

Go to **Squarespace → Domains → trisaandcharleswedding.com → DNS → DNS Settings**. Delete the default Squarespace preset records (they point the domain at a Squarespace parking page), then add these as **Custom Records**:

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
| CNAME | `www` | `charlesbneal2.github.io` |
| TXT | `_github-pages-challenge-charlesbneal2` | *(value from 6.2 step 4)* |

Also remove any domain forwarding set up under **Domains → Forwarding**.

### 6.4 Verify the QR code (critical)

- The RSVP card's QR code encodes **`https://trisaandcharleswedding.com/`**, the bare apex domain over HTTPS. So:
  - The apex A/AAAA records and **Enforce HTTPS** (§6.2–6.3) are required. If HTTPS is broken, every scan fails.
  - Home is the RSVP landing page in phase 2. Its hero button must say **RSVP** and link to `/rsvp/` before invitations are mailed (§7).
  - Never move or redirect home away from `/`.
- Test the URL on cellular data, on both iPhone and Android.
- Submit one test entry through each form, confirm the row lands in the right tab, then delete it.

## 7. Day-to-Day Management

| Task | How |
|---|---|
| Edit text or add a section | Edit `index.html`, then `git commit && git push`. It's live in about a minute |
| Edit without a terminal | Use the github.com web editor and commit to `master` |
| Open RSVPs (phase 2) | In `rsvp/index.html`, remove `hidden` from `#rsvp-form-wrap` and add `hidden` to the `.notice` div. In `index.html`, point the hero button at `/rsvp/` and change its text to "RSVP". Push |
| Close save-the-date | In `save-the-date/index.html`, swap the form for "Address collection is closed. Contact us directly." Leave the page up, since old links still point to it |
| See responses | Open the sheet. Turn on **Tools → Notification settings** for email alerts, or uncomment the `MailApp` line |
| Track who hasn't responded | Add an `Invitees` tab with your guest list and a column using `=COUNTIF(Addresses!B:B, "*"&A2&"*")>0` (or point it at `RSVPs!B:B`), or check people off by hand |
| Export addresses | Dedupe, then **File → Download → CSV** for just that tab. Stationers and Avery templates accept CSV |
| Headcount for Kim Son | `=SUMIF(RSVPs!D:D, "Joyfully accepts", RSVPs!E:E)` after deduping |

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
| Google Sheet + Apps Script | $0 (quota of about 20k requests a day) |
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
| Hosting | Make the repo public and host on GitHub Pages (free) |
| RSVP deadline | May 26, 2027 |
| Vietnamese text | Claude drafts it; Trisa and family proofread |
| Envelope liner | Colors only. No toile pattern on the site |
| Photos | Web use OK. Credit "Photos by Yashar's Photos" |
| Contact email | charlesbneal2@gmail.com, shown in the footer and the form error message as a plain `mailto:` link |
