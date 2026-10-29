# Basic integration test plan

Run real Chrome against an isolated, temporary local server. Database, Places,
and admin-auth responses are fixtures; tests never write to Supabase or send
typed addresses to Google. Each run uses its own browser profile and ports.
The suite currently runs locally/on demand; no GitHub Actions workflow is installed.

| Area | Basic coverage |
|---|---|
| Address form | Native validation; pending and duplicate submissions; save failure preserves inputs; successful retry shows confirmation |
| State / Province | Name and abbreviation matching; keyboard and touch selection; Canada/Australia; international free text and absent regions; Places autofill; reset |
| Confirmation | Viewport coverage; synchronized mirrored cats; reduced motion; Back returns to the photograph and resets the form |
| Admin | Signed-out UI; full-width desktop table with a fixed ~24-character Street column; no hover/focus resizing or address truncation; horizontal scrolling; mobile cards; filtering; failed/successful edits; canceled/confirmed deletion |
| Received | Original database receipt time displayed in device-local time; unchanged after edits |

These are UI integration checks, not tests of live Supabase permissions or Google
Places availability. Keep live-service checks separate and use explicit test data.

## Run

Requires Node.js 22+ and Chrome. No npm dependencies or package installation.

```powershell
node --test tests\integration\basic.test.cjs
```

Chrome defaults to `C:\Program Files\Google\Chrome\Application\chrome.exe` on
Windows and `google-chrome` on Linux. Set `CHROME_PATH` if it is elsewhere.

On the current Windows development machine, VS Code's bundled Node can also run
the suite:

```powershell
$env:ELECTRON_RUN_AS_NODE = '1'
& "$env:LOCALAPPDATA\Programs\Microsoft VS Code\Code.exe" --test tests\integration\basic.test.cjs | Out-Host
if ($LASTEXITCODE -ne 0) { throw 'Integration tests failed' }
```

Run the existing form and animation unit tests alongside it with:

```powershell
node --test script.test.cjs save-the-date\mangosteen-preview.test.cjs tests\integration\basic.test.cjs
```
