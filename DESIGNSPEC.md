# Trisa & Charles: Approved Design and Handoff

## 1. Authority, scope, and priorities

This is the consolidated source of truth for the current design, its decision
history, and visual acceptance. It supersedes earlier layout, typography, and
motion proposals in `SPEC.md` and the former lowercase design spec.
`SPEC.md` remains the functional/backend reference; `DEPLOYMENT.md` records
hosting, domain, and launch work. Historical ideas are not instructions to
restore removed features.

The primary guest task is to view the Save the Date and share a mailing address
for a formal invitation. The wedding is June 26, 2027, in Houston, Texas.
The full wedding website and RSVP experience are intentionally not public yet:
their current routes are simple photographic holding pages.

**Mobile and desktop acceptance are equally important and both are required.**
A desktop screenshot is not approval for mobile, and a working phone layout is
not approval for desktop. Check the actual entrance, scrolling, photo framing,
form interaction, and keyboard behavior, not just a static first screen.

Preserve the warm engagement photography, restrained cream/olive/berry palette,
legible serif text, and romantic script names. Do not revive discarded
experiments or add navigation, decoration, or motion without a clear purpose.

## 2. Current pages and exact copy

| Route | Current contents |
|---|---|
| `/` | One original armchair photograph and the work-in-progress message below |
| `/save-the-date/` | Selected automatic curtain entrance A, three stacked photographs, and the cream mailing-address form |
| `/save-the-date/#address` | Opens directly at the form, then clears the fragment so refresh restarts the entrance |
| `/rsvp/` | Its existing sofa photograph and only the message "RSVP opens soon" |
| `/save-the-date/mangosteen-preview.html` | Separate animation experiment; not part of the selected guest experience and never submits addresses |

### Home

Visible copy is exactly:

> The full wedding website is a work in progress. Thank you for understanding

Reference the original `assets\img\armchair.jpg`, with
`assets\img\armchair-800.jpg` as its responsive variant. This is the photograph
of Charles in the armchair beside Trisa reclining on the sofa, matching the
user's reference. Do not use the screenshot of that photograph as an asset.

### RSVP

Visible copy is exactly:

> RSVP opens soon

Retain `assets\img\sofa.jpg` and its `sofa-800.jpg` responsive variant.
Use the same typography and holding-page layout as home.
The previous event details, reply deadline, opening-month notice, and hidden
RSVP form were removed from the current page; they are not merely hidden.
A complete RSVP interface is future work, not part of this approved release.

### Shared holding-page treatment

- One photograph followed by one centered message; no header, navigation,
  footer, credits block, extra buttons, or additional content.
- Preserve the entire photograph at its natural 3:4 ratio, without stretching,
  blur, overlays, or viewport-cover cropping.
- Center the content, with a maximum width of 480px and responsive outer
  padding from 24px to 48px.
- Use a 6px cream photo border, 18px corner radius, and 24px photo/message gap.
- Keep the pale textured background. These pages have no entrance animation.

## 3. Typography: settled fonts and weights

| Use | Font | Weight and treatment |
|---|---|---|
| Home and RSVP messages | Libre Baskerville | 400, 16px, centered; both pages must match |
| Save the Date curtain headline | Marcellus | 400, uppercase, tight `-.055em` tracking |
| Couple's names on the first photograph | Pinyon Script | 400; keep the script character |
| Date on the first photograph | Marcellus | 400, white and top-centered; Saturday above the date on mobile, one line on desktop; quick slide-in matching SAVE THE DATE |
| Curtain introduction, Houston location, and photo CTA | Libre Baskerville | 400; supporting copy, not another decorative face |
| Mailing Address heading and form introduction | Libre Baskerville | 700; uppercase presentation |
| Form labels and entered input text | Libre Baskerville | 700; consistent with the heading and easier to read |
| Submit button and status/error copy | Libre Baskerville | 400; button uses uppercase presentation |
| Tofu and Miso greeting bubbles | Press Start 2P | 400; small pixel-game lettering |

The form heading must not revert to Marcellus or a script font while inputs
remain in Libre Baskerville. That mismatch was explicitly rejected.

Fonts are loaded from Google Fonts by each page as needed. Home and RSVP load
Libre Baskerville 400; Save the Date loads Libre Baskerville 400/700,
Marcellus, Pinyon Script, and Press Start 2P for cat greetings.
Preserve usable fallbacks: Georgia/serif for body
text, Times New Roman/serif for Marcellus, and Brush Script MT/cursive for names.
Do not make readable content depend on an external font loading successfully.

## 4. Color, texture, and shapes

| Role | Value | Current application |
|---|---|---|
| Holding-page background | `#e8e9df` | Home and RSVP |
| Cream paper | `#f5f0e7` | Curtains and holding-photo borders |
| Form paper | `#fffaf0` | Solid cream mailing-address section |
| Berry | `#80505d` | Form headings, labels, and entered text |
| Purple | `#57223b` | Send-address button default background and border |
| Pink-magenta | `#b54d66` | Accent fruit behind the mailing form and in its preview |
| Olive ink | `#3d4936` | Holding-page copy and submit-button hover |
| White | `#ffffff` | Copy over the first Save the Date photograph |

The submit button turns green on hover and retains light text. It must remain
readable in its disabled state, not become faint. Keyboard focus is visible
without requiring hover. Keep the existing pill shape for buttons.

Focused address inputs thicken their existing border from 1px to 2px in berry,
without an additional outer outline. Compensate with padding so field dimensions
and text alignment do not jump. Buttons retain their visible keyboard-focus outline.

The address section and input boxes have square corners; the rounded cream
photo frames belong to the holding pages, not the Save the Date gallery.
Use the existing subtle paper grain, not new oversized artwork.
Keep the original pixel-art mangosteen favicon. No active page has a footer,
footer lace, lotus, or separate credits block.

### Mailing Address cats

The approved gray-and-white cat sits to the left of the Mailing Address heading;
the orange-and-white cat sits to the right, mirrored for a balanced pair.
Use `assets\img\cat-gray-idle.png` and `assets\img\cat-orange-idle.png`, preserving
the approved spots, white bellies, and the orange cat's white forehead.
Tofu's gray markings are confined to the head and tail; the body and paws
are white. Keep the original gray sheet and its white-paw variant separate.
Each transparent sheet contains ten 32px-square idle frames. Animate the
head bob and tail movement with a synchronized 1.4-second stepped loop so their
paws stay on the same plane. Lift both sprite windows slightly to center the
visible cats on the heading. Keep pixel edges crisp at 128px on desktop and 64px
on screens up to 600px; scale the mobile heading from 16px to its existing 22.4px
without changing its font or weight. The heading stays centered between the
cats, with the introduction below it and no artwork over the fields.
Tighten the introduction's gap by 12.5% of the cat sprite size (8px on mobile,
16px on desktop) to compensate for the transparent sprite canvas, while
keeping both lines horizontally centered.
These cats are named, keyboard-accessible buttons with at least 64px touch
targets. Tapping the gray cat shows "tofu ~"; tapping the orange cat shows
"miso ~". Use Press Start 2P for the small pixel-game speech bubbles, not for
the form or date. Keep the orange greeting upright despite the mirrored sprite.
Show one greeting at a time and keep it visible until a second tap, another
cat's greeting, or Escape dismisses it. Clicking cats must never submit the form.
Reduced motion shows their static first frames without disabling greetings.
Keep the original source sheets unchanged.

### Falling mangosteens

The mailing-address section and its standalone HTML preview share 24 decorative pixel
mangosteens, randomly scattered rather than arranged in rows.
Seven of the 24 (approximately 30%) use the palette pink-magenta `#b54d66`
via `assets\mangosteen-pink.svg`; the others reuse `assets\favicon.svg`.
Keep the current enlarged size (62.4px on mobile, 93.6px on desktop).
Start 18 fruit across the top, middle, and bottom of the visible screen so
an immediate screenshot shows an assortment. Six more enter from above after
random delays. Run the entire timeline at 1.4x speed (40% faster): delayed
starts occur after approximately 0.54 to 3.57 seconds, with falling speeds of
63 to 112 pixels per second. Randomize horizontal positions and sway phases.
Each fruit falls once, then disappears; stop when
all 24 have finished. Resizing or changing tab visibility must not restart
completed fruit. Do not use gravity, bouncing, collisions, or an endless loop.
Artwork sits behind the form and does not intercept pointer events or obscure
input text. The preview retains Pause/Resume until completion; reduced motion uses
scattered static artwork without automatic falling.
The main site's animation starts when the address section enters view and
pauses while it is offscreen. Keep it behind the real form, not over the
photographs. Inputs keep opaque paper backing for readability. Labels, headings,
introductory text, and status/error messages have transparent backgrounds so
the falling fruit stays visible behind the lettering without rectangular cutouts.
Use one translucent cream panel behind the entire form: 60% form-paper tint
with a 4px backdrop blur. Fruit behind the panel stays visible but softly
blurred; text, cats, and controls remain sharp. Keep the original form styling
and full-width fruit scatter, not pixel brackets, stepped buttons, or edge lanes.
The main form has no animation-control button; the finite effect stops
automatically. Cat greetings never submit the form. Preserve the real address
submission handler and Places autocomplete.

The separate preview loads neither the submission handler nor Places autocomplete,
keeps its send button disabled, and prevents form submission.
It uses the same animation code, but remains an inert animation study.

## 5. Save the Date: content and photographs

The canonical experience is `/save-the-date/`, not an entrance-preview URL
or a query-selected study.

| Order | Photograph | Source and responsive variant |
|---|---|---|
| 1 | Dancing beneath the arch | `assets\img\save-the-date-dance.jpg`; `save-the-date-dance-900.jpg` |
| 2 | Embracing beside the windows | `assets\img\save-the-date-embrace.jpg`; `save-the-date-embrace-640.jpg` |
| 3 | Hands and engagement ring at the piano | `assets\img\save-the-date-piano.jpg`; `save-the-date-piano-640.jpg` |

The opening introduction reads "Together with our families," followed by
"we invite you to", then the image-filled SAVE THE DATE headline.
The first photograph contains "Trisa & Charles", "Saturday, June 26, 2027",
"Houston, Texas", and "Share your mailing address".

The date stays visible on the first photograph after the original SAVE THE DATE
entrance. On mobile, show two top-centered lines below the names: "Saturday,"
then "June 26, 2027". Keep Marcellus and restore the previous deployment's
calmer date scale: 8cqw, with a 28px minimum and 88px maximum, rather than
near-edge-to-edge lettering. On desktop, keep the full date on one line. Cap the font
size by available height so the date stays above Charles's head without
overlapping the names or address CTA. On short landscape screens, let the
hero grow to preserve that clearance. Keep the date in normal
hero flow: it scrolls away with the other photo copy, not over the form.
There is no date marquee, duplicate visual copy, or Pause/Play control;
one semantic time element carries the date. Use the same `reveal-title`
animation as the SAVE THE DATE headline: a quick 32px slide from the left with
opacity, lasting 0.8 seconds and using `cubic-bezier(.2, .65, .25, 1)`.
Start after the curtain opens and keep the date visible afterward.

**The location and address CTA belong on the first photograph only.**
Moving the CTA to the third photograph was tried and explicitly undone.
The direct link must remain keyboard accessible.
Clear `#address` with `history.replaceState` only after reaching the form,
preserving the pathname, query parameters, and history state. Incoming deep
links still bypass the entrance on their first visit. A refresh uses the clean
URL and restarts the curtain at the top; disable automatic scroll restoration
so the browser does not restore the form's previous scroll position.

### Desktop and tablet widths above 600px

The first photograph remains full width and viewport height, using cover
framing with `object-position: center 35%`. Do not blur it.

The second and third photographs span the full page width at their natural
aspect ratios. They are not forced into a viewport-height box, and there are
no cream side margins from `object-fit: contain`.

Tall photographs first scroll until their bottom edge reaches the viewport
bottom, then pin while the next panel rises over them. The implementation uses
`min(0, window.innerHeight - section.offsetHeight)` for the sticky top offset,
refreshed on resize and image/container size changes. Every photograph's bottom
must remain reachable; there must be no stretched images or inaccessible crop.

"Full photograph" means the actual supplied image frame. The embrace source
already has tight framing near the heads; CSS cannot recover pixels outside
the original photograph.

### Mobile widths of 600px and below

Retain the full-bleed, viewport-height photographic panels with cover cropping.
This intentionally differs from desktop's natural-height gallery.
Keep the couple, date, location, and CTA readable within the available width.
The curtain headline stacks SAVE / THE / DATE.
The stacked date must remain fully readable without horizontal page scrolling.

### Layering and form

The hero pins beneath the subsequent photographs. Its names, date, location,
and CTA scroll upward rather than remaining fixed over later sections.
Each following photograph rises over the previous panel.
The solid cream form finally rises over the last image and scrolls normally.

The form is centered at a maximum width of 688px with 24px side padding.
Fields are one column in their current order. Do not restore the older
transparent form-over-blurred-photo layout or a venue/directions sidebar.

## 6. Transitions and motion: selected behavior

### Entrance A

This is an automatic curtain reveal, not click-to-enter. Wait for the opening
photograph and fonts to settle before starting. There is no Replay entrance
button, A/B switch, or comparison control.

| Transition | Settled behavior |
|---|---|
| Introduction | Supporting copy fades/rises in over 0.55s, after a 0.1s delay |
| Curtain headline | Fades in from 32px left over 0.8s, after a 0.75s delay |
| Opening photo | Subtle scale settle from 1.07 to 1 over 2.4s |
| Hero copy | Fades/rises from 24px below over 1s, with a 0.55s delay |
| Curtain opening | After the hero-copy reveal ends, hold 0.3s, then move the cream halves outward over 0.9s |
| Curtain title exit | Fade and move upward 12px during the 0.9s opening |
| Date fade | Soft left-to-right line fades starting at 2.8s; Saturday 0.9s, June 0.7s, 26 0.6s, 2027 0.8s; all remain visible |
| Form text | Fade/rise from 8px below over 0.5s; introduction/status have a 0.1s stagger |
| Button hover | Existing 0.18s background/text-color transition |

Curtain movement uses `cubic-bezier(.76, 0, .24, 1)`. The photo/headline/copy
reveals use `cubic-bezier(.2, .65, .25, 1)` where specified in the stylesheet.
These are subtle presentation transitions, not a camera-zoom interaction.

### Scrolling and text reveals

Use the stacked-panel idea from `https://kokoro.framer.website/`, not its
branding or assets. Normal document scrolling must remain available: no
wheel interception, scroll lock, miniature-card zoom, or mandatory replay.

Reveal form headings, introduction, field labels, button, and setup status
as they enter view. Inputs stay visible and stationary. Reveal text once per
entrance run, not repeatedly on scroll. Keyboard focus must reveal the
corresponding label even if its scroll trigger has not fired.

### Reduced motion and direct entry

With `prefers-reduced-motion: reduce`, skip the animated curtain, disable
animation/transitions, reveal copy immediately, and use non-smooth anchor
scrolling. The current CSS sticky layering remains; do not describe it as a
separate fully unpinned layout.
The date remains the same static, readable four-line stack with reduced motion
or without JavaScript.

Opening `/save-the-date/#address` bypasses the curtain and immediately positions
the mailing form. Neither direct entry nor reduced motion may leave hidden
copy, an invisible focus target, or an overlay blocking input.

## 7. Mailing form and truthful submission states

Heading: "Mailing Address". Introduction: "Formal invitation to follow".

Required visible fields, in order: Name, Email, Street address, City,
State / Province, ZIP / Postal code, Country. The optional Apt / Unit field
appears after Street address. Country defaults to United States.
Keep associated labels, autocomplete hints, native validation, the hidden
`form=address` value, and the honeypot. Do not add phone/guest/note fields
just because the backend has compatibility columns.

| State | Required behavior |
|---|---|
| Backend not configured | Button disabled; show "Address collection is being set up. Please check back soon." No request or success claim |
| Ready | Button says "Send my address"; purple by default, green on hover |
| Sending | Button disabled and says "Sending..."; do not create duplicate submissions |
| Confirmed save | Button says "Sent!" and remains visible and disabled; no separate thank-you message |
| Failure | Restore the send label and enabled button, show the error, and preserve the entered information for retry |

The sending label uses the existing typographic ellipsis in the interface.
Success requires HTTP 201 from Supabase.
Do not hide the address form or force a scroll away from its Sent! button.
Repeated submits while sending or after success must not create another request.
The changing button label has a polite live-region announcement.

The Sent! button is the only success confirmation. Do not show a separate
"Thank you!" heading or "We have your address" paragraph beneath it.

The error explains that something went wrong and provides the existing contact
email. Image-load failures also show explicit refresh guidance.
Do not replace either failure with silent success or clear the guest's data.

## 8. Backend, hosting, and handoff context

### Backend: Supabase

`supabase\schema.sql` creates the `addresses` table with not-null, length,
email-format and US-ZIP constraints, and row-level security that lets the public
(publishable) key only INSERT. `script.js` POSTs JSON to Supabase REST and treats
HTTP 201 as the only success. The constraints check format, not whether a postal
destination or mailbox actually exists.

Verify an approved synthetic browser save reaches the table before calling
collection live or sharing it as a working guest form.
Never commit guest addresses, spreadsheet exports, tokens, or credentials.

### Repository and publication

`charlesbneal2/wedding-website` is the single source of truth.
Use `master`, not a separate `main` branch, and push only to its `origin` remote.
The user explicitly requested deletion of `trisavo/wedding-website`; that fork
has been deleted and its local remote removed after verifying the source
contained the same committed changes. This supersedes the earlier two-repository
push arrangement. Do not recreate the fork. Verify the original remote head
after pushing, and never force-push or include unrelated untracked artwork.

GitHub Pages activation on the former private fork was rejected for plan
eligibility. That result does not establish the original owner's eligibility.
Verify Pages administration and hosting eligibility for the original repository.
No plan purchase, repository-visibility change, or separate public repository
has been authorized. No live website deployment is verified.

The intended release is a curated GitHub Actions Pages artifact, not the whole
working tree. The workflow is not yet implemented. Exclude backend source,
tests, documentation, originals, unused experiments, and guest data.
Root-relative asset URLs currently assume a domain root: an unchanged
`OWNER.github.io/wedding-website/` preview would need base-path support.

The intended domain is `trisaandcharleswedding.com`. Keep Squarespace
registration/DNS initially and connect hosting separately. GitHub Pages is not
a registrar. A registrar transfer is optional and separate from connecting DNS.
Follow `DEPLOYMENT.md` and `SPEC.md` section 6 for verification, DNS records,
mail-record preservation, custom domain, and HTTPS. None is established merely
by the existing CNAME file.

## 9. Decision history: do not reopen by accident

| Decision or experiment | Current disposition |
|---|---|
| Curtain entrance A | Selected canonical Save the Date experience |
| Replay button, split entrance B, comparison pickers | Removed; not part of the guest page |
| Click-to-enter gate | Superseded by the automatic curtain |
| Moving the address CTA to photo three | Explicitly undone; keep it on photo one |
| Desktop contain-fit portraits with cream side margins | Rejected; use full-width natural-height gallery photographs |
| Mobile viewport-height photographic panels | Retained intentionally |
| Miniature forms, zoom studies, tilted backing sheets, window frames, fruit cutouts | Discarded; do not reintroduce |
| Cream masthead, separate framed opening, old blurred-photo form | Archived alternatives, not the current layout |
| Marcellus form heading beside serif inputs | Replaced by consistent bold Libre Baskerville |
| Muted berry form text and purple-to-green send button | Selected and retained |
| Full wedding home page with details, gallery, navigation, and footer | Replaced by the armchair-photo holding page |
| Full RSVP copy and hidden form | Replaced by the sofa-photo holding page and "RSVP opens soon" |
| Standalone palette study and its exclusive artwork | Removed; keep selected colors, not the study route |
| Personal fork and two-repository pushes | Fork deleted; original repository is now the sole source of truth |
| Kokoro; Cartier, Louis Vuitton, Prada references | Interaction/hierarchy/restraint references only; no copied assets or branding |

## 10. Acceptance: mobile AND desktop are release gates

Any layout, typography, photo, transition, or form change must pass both sides.
Do not mark a feature accepted after checking only desktop, only mobile,
only reduced motion, or only an entrance screenshot.

### Viewport matrix

| Viewport | Primary checks |
|---|---|
| 320 x 640 | Narrow-phone copy, field readability, button fit, no horizontal overflow |
| 390 x 844 | Main mobile reference; touch scrolling, stacked title, form and holding pages |
| 600px and 601px widths | Gallery breakpoint: mobile cover treatment versus natural-height photographs |
| 768 x 1024 | Tablet layout and tall-image scrolling; no awkward transition between treatments |
| 1440 x 1000 | Standard desktop reference; typography, centered form, full-width gallery |
| 1920 x 1080 | Wide desktop; natural photograph framing and reachable photo bottoms |

Repeat the critical Save the Date checks with reduced motion. Also resize or
rotate after loading; sticky offsets and content must update without a reload.
At least one real touch-device check is required before a guest launch:
browser emulation alone is not final device acceptance.

### Shared visual and content acceptance

- [ ] Home contains only its original armchair image and exact requested message.
- [ ] RSVP contains only its sofa image and "RSVP opens soon", matching home typography.
- [ ] Holding-page images remain fully visible at natural proportions.
- [ ] No active page has the removed header/footer content or old study controls.
- [ ] Fonts, weights, colors, and copy match this document; fallback text remains readable.
- [ ] No horizontal scrolling, stretched photos, clipped controls, or unreadable button states.
- [ ] The retired palette route and removed prototype pages are not served.

### Save the Date interaction acceptance

- [ ] Automatic curtain A completes on mobile and desktop; mobile title stacks correctly.
- [ ] The first photograph contains names/date/location and the only address CTA.
- [ ] The large date stays visible after the entrance, left-aligned with one word/number per line.
- [ ] The complete date remains readable with reduced motion and no JavaScript, with no overflow or overlapping copy.
- [ ] Hero copy scrolls away; later photos cover earlier panels in the correct order.
- [ ] Both desktop gallery photographs fill the width at natural height; every bottom is reachable.
- [ ] Mobile retains the approved full-bleed viewport-height gallery treatment.
- [ ] The cream form appears above the final photo without trapping scroll or focus.
- [ ] Form headings/labels/input text use Libre Baskerville 700; inputs do not animate.
- [ ] The direct address link and `#address` entry work without a required entrance or replay.
- [ ] Reduced motion exposes readable content immediately and does not block the form.
- [ ] Keyboard focus is visible, field labels reveal on focus, and touch targets are usable.
- [ ] Focused address inputs have a thicker existing border, no detached outline, and no layout shift.
- [ ] The mobile keyboard does not leave fields or the submit button behind pinned imagery.

### Submission and launch acceptance

- [ ] An unconfigured backend cannot send data or display Sent!/saved confirmation.
- [ ] Pending and successful submissions cannot be submitted twice.
- [ ] Confirmed saves leave a visible disabled Sent! button without a separate thank-you block.
- [ ] Network, HTTP, or database failures show a retryable error and preserve fields.
- [ ] An authorized live endpoint saves one approved synthetic submission into the `addresses` table.
- [ ] The original repository push, hosted routes/assets, domain, HTTPS, and mobile/desktop guest flows are verified.

These are release criteria, not claims that all launch work is already complete.
Visual approval, local mocks, and source pushes are not proof
that a live deployment or database save works.

## 11. Verification context and implementation map

Prior checks covered the holding pages at 320, 390, and 1440px, plus exact copy,
original photos, matching typography, and absent headers/footers. Save the Date
checks covered normal/reduced-motion entrance, direct form entry, font weight,
purple/green button styles, and responsive gallery transitions, including wide
desktop photo bottoms. Nine client checks cover submission states and retries.
Retired-study URLs returned 404 while the retained pages and CSS/JS returned 200.
These records do not substitute for the live acceptance gates above.

| File | Responsibility |
|---|---|
| `index.html`, `rsvp\index.html` | Photo-and-message holding pages |
| `style.css` | Shared tokens, fonts, holding-page styles, and common controls |
| `save-the-date\index.html` | Canonical curtain markup, three photographs, address form |
| `save-the-date\save-the-date.css` | Curtain, gallery, cream form, responsive rules, motion |
| `save-the-date\save-the-date.js` | Entrance lifecycle, hash bypass, reveals, sticky offsets, image errors |
| `save-the-date\mangosteen-preview.html` | Isolated favicon animation experiment with no backend submission |
| `script.js` | Supabase insert, config gate, sending/error/Sent! states, duplicate-submit protection |
| `supabase\schema.sql` | Table, constraints, insert-only row-level security |
| `README.md` | Clone and local-launch instructions |
| `SPEC.md`, `DEPLOYMENT.md` | Functional/backend reference and deployment/domain rollout |
