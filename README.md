# wedding-website

Static HTML/CSS/JavaScript; no package installation or framework build is needed.
Serve the repository root locally on port 8000.

The selected Save the Date is `/save-the-date/`: curtain entrance A, no Replay
button, three covering photographs, and a cream mailing form with berry text.
Superseded preview/comparison pages have been removed. The separate palette
study remains local at `/save-the-date/palette-study/`.

## Deployment

`DEPLOYMENT.md` contains the rollout plan; `SPEC.md` section 6 contains the exact
GitHub Pages, Google Apps Script, Squarespace DNS, and optional registrar-transfer
instructions.

The plan uses a curated GitHub Actions Pages artifact for the requested
`trisavo/wedding-website` fork of `charlesbneal2/wedding-website`, rather than
publishing the entire working tree. The private fork exists and GitHub CLI is
authorized as `trisavo`. GitHub rejected Pages activation because the current
plan does not support Pages for this private repository.
Keep the domain registered with Squarespace initially and point its web DNS to
Pages. Registration transfer is optional and requires a separate registrar.

The backend code and idempotent spreadsheet setup are in `apps-script/Code.gs`.
Address collection stays disabled until `script.js` has the actual authorized
Apps Script `/exec` URL. A live browser-to-sheet save must be verified before
sharing with guests.

No live website deployment, domain transfer, or DNS change has been performed.
