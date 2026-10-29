# GitHub Pages deployment plan

Updated October 29, 2026. This is a deployment plan, not a record of publication.
Detailed configuration and official references are in `SPEC.md`, section 6.

## Target

| Component | Selected direction |
|---|---|
| Repository | Verified private fork: `trisavo/wedding-website`; upstream: `charlesbneal2/wedding-website` |
| Website hosting | GitHub Pages, with a curated static artifact published by GitHub Actions |
| Guest entry | `https://trisaandcharleswedding.com/save-the-date/` |
| Design | Curtain entrance A, no Replay button, three photos, cream form with berry text |
| Backend | Google Apps Script writing to a private Google spreadsheet |
| Spreadsheet | `trisaandcharleswedding_savethedate_address` |
| Domain | Keep Squarespace registration and DNS initially; connect the domain to Pages |

## Ordered rollout

1. **Finish the selected site.** Keep `/`, `/save-the-date/`, and `/rsvp/`.
   Remove superseded save-the-date prototypes. Retain the palette study locally,
   but leave it out of the guest release. Verify desktop natural-proportion
   photos, mobile scrolling, keyboard access, reduced motion, and the address link.
2. **Activate address collection.** Create the named spreadsheet, run
   `setupWeddingResponses`, authorize Apps Script, and deploy its web app as the
   owner with access for Anyone. Configure the `/exec` URL in `script.js`.
   Verify one approved synthetic browser submission reaches `Addresses` and that
   validation/write failures preserve the form. Until then, the button stays
   disabled; local tests alone are not proof that submissions are saved.
3. **Prepare the fork's Pages release.** GitHub CLI is authorized as `trisavo`;
   the fork and its upstream parent are verified. Push only to that fork.
   GitHub rejected Pages activation with "Your current plan does not support
   GitHub Pages for this repository." The private fork cannot independently
   become public. Resolve eligibility through an approved plan change, or obtain
   explicit approval for a separate public deployment repository. Do not change
   visibility or purchase a plan implicitly. Once eligible, add a manually
   triggered GitHub Actions Pages workflow for `master`, packaging only the three
   public pages, their CSS/JS, favicon, and referenced optimized images. Exclude
   backend source/tests, documentation, palette study, originals, and response
   exports. The local sample PR was opened before pushing; the requested fork,
   push, and publication are authorized. Website publication remains blocked.
4. **Verify the domain before switching traffic.** Keep a copy of the current
   Squarespace DNS settings. In the repository owner's GitHub account settings,
   verify the domain with GitHub's supplied TXT record. Configure the repository
   custom domain and Pages source before changing its web-routing records.
5. **Connect Squarespace DNS.** Apply the exact A/AAAA, `www` CNAME, and
   verification TXT records in `SPEC.md` section 6.3. Keep existing mail and
   unrelated DNS records. Keep registration/nameservers at Squarespace.
6. **Launch and verify.** Publish the approved artifact, confirm DNS and certificate
   provisioning, enable Enforce HTTPS, and check apex/`www`, all public routes,
   photos, and a real browser-to-sheet round trip. Test on cellular data as well
   as Wi-Fi. Only then share the save-the-date link with guests.

The site currently uses root-relative asset URLs. An unchanged project preview
under `OWNER.github.io/wedding-website/` is not a valid smoke test: those URLs
would resolve outside the project. Validate the artifact locally at `/`, then
validate the configured custom domain. Supporting a project-subpath preview
would require an explicit base-path change.

## If you also want to leave Squarespace as registrar

That is optional and separate from moving the website. GitHub Pages is the host,
not the destination registrar. Choose a new registrar, copy the existing DNS zone,
unlock the domain in Squarespace, request its transfer authorization code, and
enter that code with the new registrar. Complete any confirmation emails and
verify that website and mail records survive the move. Registration, recent
transfer, or contact-change locks may delay a transfer; DNS can still be connected
to Pages while waiting. Do not cancel the domain registration.

## Rollback

Keep the last working Pages artifact and the pre-change web DNS values. If a
release fails, redeploy that artifact; if the host cutover fails, restore only the
previous web-routing records. Keep the spreadsheet and stable Apps Script
deployment URL unchanged so saved addresses are not affected.

## Remaining activation work

Pages eligibility, the Pages workflow, Google authorization, spreadsheet
creation/configuration, an actual `/exec` deployment, and
Squarespace DNS/HTTPS changes are not established by this document. No GitHub
website deployment, registrar transfer, or DNS change was performed while writing it.
