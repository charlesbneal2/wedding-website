# Save the Date: Design Spec

**Status:** Curtain entrance A selected as the main page; backend and deployment activation pending.
**Scope:** The Save the Date page only.
**Local preview:** `http://localhost:8000/save-the-date/`

Use this spec to agree on the design before implementing more visual changes.
Keep confirmed requirements; replace `[TBD]` with decisions as they are made.
`SPEC.md` remains the broader functional and technical reference.

## 1. Purpose and priorities

**Primary guest task:** Enter their mailing address so we can send a wedding invitation.

**Opening experience:** `/save-the-date/` is the selected curtain entrance A.
The introduction reads "Together with our families," and "we invite you to"
on two lines, followed by image-filled Marcellus SAVE THE DATE. After the
0.3-second hold, cream curtains open onto the dancing photograph.
Mobile stacks SAVE / THE / DATE. There is no click-to-enter or Replay button,
split-layout option, or comparison picker.

The photograph retains the script names, "June 26, 2027" at its approved sizing,
Houston location, and mailing-address link. The opening copy scrolls upward
while the photo stays pinned. Reduced motion skips the animated entrance.
A direct `#address` visit bypasses the introduction and reaches the form.

**Selected cream mailing form:** The canonical page uses the regular full-size
cream form with boxed fields and a purple send button that turns green on hover. Headings, labels, and
entered text use the palette study's muted berry `#80505d`; photo copy stays white.
The form heading, introduction, labels, and input text use Libre Baskerville
at weight 700 for consistent, more readable lettering.
After the entrance, the supplied embrace and piano/ring photographs appear
as sticky panels. Each rises over and covers the previous photo.
On desktop, the additional photographs span the page width at their natural
proportions, without side margins or viewport cropping. Tall photographs scroll
until their bottom edge reaches the viewport bottom, then pin while the next
panel covers them. Mobile retains its existing full-viewport treatment.
Houston, Texas and the mailing-address button remain on the first photograph.
The cream form then rises over the final image and scrolls in normal page
flow. There is no miniature preview, zoom, scroll lock, yellow stage, tilted
backing paper, window bar, or mangosteen decoration. Headings, labels, and button
text fade gently upward as they enter the viewport; inputs stay visible and
usable throughout. Reduced motion displays all text immediately.
Superseded entrance/form/scroll comparisons and green/cream previews are removed.
The separate palette investigation remains at `save-the-date/palette-study/`
for local art-direction work, not the guest release.
The submit button remains disabled until a real Apps Script `/exec` endpoint
is configured; confirmation appears only after a successful backend save.

Only the photo stays pinned using CSS. Trisa & Charles, SAVE THE DATE, the date,
and Houston location scroll upward together over the photo.
The direct link and address section remain in normal scrolling flow so
interactive controls are not trapped behind the covering section.
The first photograph's direct link remains keyboard accessible and reaches
the form without requiring the covering scroll transition.

**Interaction reference:** `https://kokoro.framer.website/` - stacked sections
moving over pinned imagery. Use the interaction idea, not its assets or branding.

**Success looks like:** Guests see the wedding announcement, reach the address
form by scrolling or using the direct link, and receive clear confirmation when
their address is saved.

**Release scope:** Keep the main wedding website and RSVP schedule intact.
`DEPLOYMENT.md` and `SPEC.md` section 6 now define the requested GitHub Pages
launch and Squarespace domain connection. The site remains local until backend
activation, repository access, Pages publishing, and DNS/HTTPS are completed.

## 2. Content and copy

Collect guests' mailing addresses. Venue details and directions are not shown on this page.

| Element | Content or working copy | Status |
|---|---|---|
| Page title | SAVE THE DATE | Confirmed |
| Couple | Trisa & Charles | Confirmed |
| Date | Saturday, June 26 2027 | White serif beneath the headline |
| Location | Houston, TX | Confirmed |
| Form heading | MAILING ADDRESS | Confirmed |
| Form explanation | FORMAL INVITATION TO FOLLOW | Confirmed |
| Guest name label | Name | Confirmed |
| Primary button | Send my address | Draft |
| Success message | We have your address. Watch your mailbox for your invitation. | Draft; show only after a successful submission |
| Error message | [TBD: explain the problem and how to retry or contact us] | To decide |

**Required form information:** [TBD: confirm the minimum information needed.]

**Optional form information:** [TBD: include only if it serves a clear purpose.]

## 3. Visual direction and references

**Working direction:** The earlier green photograph-first design with a
Marcellus announcement and compact letter spacing. Pinyon Script names,
Libre Baskerville supporting text, olive accents, and a cream paper-textured form card
retain the earlier romantic color story. The Kokoro reference informs the
headline font. Cartier, Louis Vuitton, and Prada
remain directional references for hierarchy and restraint, not asset sources.

**Three words the page should evoke:** [TBD]

**What it should not feel like:** [TBD]

| Reference or existing element | What we like | Where it could apply |
|---|---|---|
| Cartier, Louis Vuitton, and Prada | Expressive announcement with restrained supporting information | Typography hierarchy, fewer repeated messages, and deliberate whitespace |
| Kokoro | Large Marcellus heading and Mrs Saint Delafield signature above an inset photograph | Separate cream masthead and cream frame around the full photograph |
| Engagement photography | The couple dancing beneath an arch | Uncropped 3:4 portrait; `assets/img/save-the-date-dance.jpg` |

**Decoration rules:** Keep the opening photograph unframed. This page has no footer,
footer lace, lotus, or footer credits. Any additional motif or effect needs a
specific role before it is introduced.

## 4. Wireframes and hierarchy

Start with plain text and boxes. Approve the arrangement before choosing details.

### Mobile

**Proposed reading order:**

1. Script names and white Marcellus SAVE THE DATE over the photograph, with date and Houston location.
2. Full-width, viewport-height photograph behind the announcement.
3. A clear "Share your mailing address" link near the bottom of the photo.
4. Scroll the address section upward over the pinned photo, revealing the form.
5. Primary submit button and submission feedback.

**Wireframe or sketch:** [TBD]

**What must appear in the first screen:** The announcement, names, full date,
Houston location, photograph, and address link. Form fields are reached by
scrolling or keyboard navigation.

### Desktop

**Form placement and width:** Below the full-screen opening, centered with a maximum
width of 680px. Restore the earlier cream card, paper texture, serif labels, and
boxed inputs over the blurred photo. Section, card, and inputs have no border
radius. State and postal code share one row.

**Photo placement:** The photo fills the opening width and viewport height using
`object-fit: cover` and `object-position: center 25%`. The announcement scrolls
away while the image stays pinned beneath a fully transparent form section.
Photo blur increases from 0 to 14px as the form enters, reversing when scrolling
back up; only the photo blurs, not the form. Reduced motion uses ordinary
scrolling, a sharp photograph, and the sage section background.
No venue or directions block is shown.

**Wireframe or sketch:** [TBD]

## 5. Visual foundations

These are starting points from the current prototype, not locked decisions.

| Foundation | Starting point | Decision |
|---|---|---|
| Background and surfaces | Seamless blurred photo without a section tint; cream `#f5f0e7` form card | Earlier paper-textured card, now with square corners |
| Text and accents | White opening text; olive `#3d4936` form text and buttons | Earlier green color story |
| Display typography | Marcellus for the uppercase announcement; Pinyon Script for names | Headline uses `-.055em` tracking; no separate masthead |
| Reading typography | Libre Baskerville for date, location, form title, subtitle, labels, inputs, buttons, and feedback | Earlier serif typography retained |
| Spacing | Compact letter spacing with generous space around the announcement and form fields | No duplicate corner navigation or date/location; names remain centered |
| Shapes and borders | Square section, card, and input corners; existing pill button | No rounded form corners |
| Texture and motion | Subtle paper texture on the form; photo progressively blurs while text scrolls away | Form stays sharp; reduced motion uses ordinary scrolling |
| Favicon | Original pixel-art purple mangosteen with green leaves; `assets/favicon.svg` | Confirmed |

## 6. Elements and states

Design one input and one primary button before styling the entire page.

| Element | What to specify | Design or decision |
|---|---|---|
| Opening announcement and photo | White Marcellus announcement over the full-width photo; direct link near the photo's bottom | Photo pins while text scrolls away |
| Form field | Label, required/optional wording, hint, default/focus/error appearance | [TBD] |
| Address layout | Field order, grouping, mobile stacking, autocomplete | [TBD] |
| Primary button | Label, default/hover/focus/submitting appearance | [TBD] |
| Submission feedback | Error, retry, success, and preserved entered values | [TBD] |
| Photography | Responsive full-width photo framing | [TBD] |

## 7. Acceptance criteria

- [ ] The primary task is clearly entering a guest's mailing address.
- [ ] The form reads "Mailing Address" with "Formal invitation to follow" underneath, both in Libre Baskerville.
- [ ] The white Marcellus announcement uses tight tracking over the photo; names use Pinyon Script.
- [ ] The photograph contains the opening announcement, names, date, and location.
- [ ] The top header shows only centered names, without corner navigation or repeated date/location.
- [ ] The form is centered without a venue or directions sidebar.
- [ ] The name field is labeled "Name".
- [ ] The form floats in front of the blurred photo, rather than a solid light-green section.
- [ ] The form section, cream card, and boxed serif inputs have square corners.
- [ ] Photo blur increases on scroll and reverses on return; the form remains sharp.
- [ ] The wedding date and Houston location are easy to find.
- [ ] The first viewport shows the full-width photograph and white announcement.
- [ ] The image fills the opening using responsive cropping without stretched proportions.
- [ ] There is no footer, green footer section, lace, or footer credits.
- [ ] The photo stays in place while the mailing-address section moves upward over it.
- [ ] The names, title, date, and location scroll upward together rather than staying pinned.
- [ ] The direct link reaches the form without requiring the scroll effect.
- [ ] The mailing-address button remains on the first photograph and is keyboard accessible.
- [ ] Reduced-motion preferences replace the pinned overlap with ordinary page scrolling.
- [ ] Labels, input text, and buttons are readable without decorative type.
- [ ] Required and optional information are clearly distinguished.
- [ ] Keyboard focus is visible and follows the reading order.
- [ ] The page has no horizontal overflow at 320, 390, 768, and 1440 pixels.
- [ ] Errors explain what happened and preserve entered information.
- [ ] Success appears only after the backend confirms the address was saved.
- [ ] The main wedding website and domain configuration remain unchanged.

**Separate launch requirement:** Connect and verify the address-submission backend
before sharing the page with guests. Visual approval alone does not mean data is saved.

## 8. Review and handoff

**Review order:** Content hierarchy, wireframes, visual foundations, component
states, then the assembled mobile and desktop page.

| Decision | Reason | Status |
|---|---|---|
| Center the form and remove venue details and directions | User requested only "Mailing Address" and "Formal invitation to follow" above the fields | Confirmed |
| Cream announcement masthead, then photo and address form on scroll | Separate type from the photograph for clearer lettering while keeping address collection as the primary action | Archived alternative |
| Use the supplied dancing-under-the-arch engagement photo without cropping | User requested the full image inside a cream frame | Archived cream alternative |
| Full-width pinned photo with the address section scrolling over it | Latest clarification and Kokoro interaction reference replace the fitted, uncropped portrait | Confirmed |
| All opening text scrolls upward together while the photo stays pinned | User selected version A from the scroll comparison | Approved |
| Restore green design with the cream alternative's headline font | User selected the earlier green layout with Marcellus SAVE THE DATE over the photograph; other earlier typography remains | Current selection |
| Plain white form section with spaced, underlined fields and a "Name" label | User supplied a minimal two-column form reference | Archived cream alternative; selected green page retains the "Name" label |
| Remove the entire footer from the Save the Date page | User requested removal of the green footer, lace, and all its contents | Confirmed |
| [TBD] | [TBD] | Proposed / approved / needs revision |

**Design approval:** [Pending]

**Implementation handoff:** [TBD: approved layouts, component decisions, and any remaining questions.]
