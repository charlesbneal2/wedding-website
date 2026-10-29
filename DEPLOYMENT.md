# GitHub Pages deployment plan

Updated October 29, 2026. This is a deployment plan, not a record of publication.
Detailed configuration and official references are in `SPEC.md`, section 6.
Current page designs and required mobile/desktop acceptance are in `DESIGNSPEC.md`.

## Target

| Component | Selected direction |
|---|---|
| Repository | `charlesbneal2/wedding-website`, the single source of truth; the personal fork was deleted |
| Website hosting | GitHub Pages, with a curated static artifact published by GitHub Actions |
| Guest entry | `https://trisaandcharleswedding.com/save-the-date/` |
| Design | Curtain entrance A, no Replay button, three photos, cream form with berry text |
| Backend | Supabase (Postgres), insert-only for the public site |
| Table | `addresses` (`supabase/schema.sql`) |
| Domain | Keep Squarespace registration and DNS initially; connect the domain to Pages |

## Ordered rollout

1. **Preserve the selected site.** Keep `/`, `/save-the-date/`, and `/rsvp/`.
   Home and RSVP remain photo-and-message holding pages. Follow `DESIGNSPEC.md`
   for the curtain Save the Date and require both mobile and desktop acceptance.
   Verify desktop natural-proportion
   photos, mobile scrolling, keyboard access, reduced motion, and the address link.
2. **Activate address collection.** Run `supabase/schema.sql` in the
   Supabase SQL Editor. `script.js` already holds the project URL and publishable key.
   Verify one approved synthetic browser submission reaches the `addresses` table
   and that failures preserve the form. Delete the synthetic row afterward.
3. **Prepare the original repository's Pages release.** Push only to `master`
   on `origin`, `charlesbneal2/wedding-website`. Verify Pages administration and
   plan eligibility with that repository's owner. The deleted fork's rejected
   Pages activation does not establish eligibility for the original.
   Do not recreate the fork, change visibility, or purchase a plan implicitly.
   Once eligible, add a manually
   triggered GitHub Actions Pages workflow for `master`, packaging only the three
   public pages, their CSS/JS, favicon, and referenced optimized images. Exclude
   `supabase/`, documentation, originals, and response
   exports. Website publication remains pending repository-owner setup and
   the launch requirements below.
4. **Verify the domain before switching traffic.** Keep a copy of the current
   Squarespace DNS settings. In the repository owner's GitHub account settings,
   verify the domain with GitHub's supplied TXT record. Configure the repository
   custom domain and Pages source before changing its web-routing records.
5. **Connect Squarespace DNS.** Apply the exact A/AAAA, `www` CNAME, and
   verification TXT records in `SPEC.md` section 6.3. Keep existing mail and
   unrelated DNS records. Keep registration/nameservers at Squarespace.
6. **Launch and verify.** Publish the approved artifact, confirm DNS and certificate
   provisioning, enable Enforce HTTPS, and check apex/`www`, all public routes,
   photos, and a real browser-to-database round trip. Test on cellular data as well
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
previous web-routing records. Keep the Supabase project and its URL unchanged so saved addresses are not affected.

## Remaining activation work

Pages eligibility, the Pages workflow, Supabase table creation, and
Squarespace DNS/HTTPS changes are not established by this document. No GitHub
website deployment, registrar transfer, or DNS change was performed while writing it.
