# SABI Career Support fictional-development receiver

This folder supports the Career Support development route. It is deliberately restricted to fictional testing and is not a production client-intake system.

## Current connection status

**Do not connect the Apps Script receiver to the current Phase 2 frontend yet.**

The browser-only development route now contains the approved **About you** and **Current situation** fields. `Code.gs` still uses the earlier shell-only answer sanitizer, so connecting it now would discard those newer fields. The frontend therefore keeps `BACKEND_URL` set to `REPLACE_WITH_APPS_SCRIPT_EXEC_URL` and uses fictional browser-only storage.

Before the receiver is connected, its server-side answer schema must be updated and tested against the current field map. This is a deliberate safety stop, not a production defect.

## Development workbook

Use the restricted Google Sheet:

- **SABI Career Support Form Development - Fictional Test Records - August 2026**
- Spreadsheet ID: `1I0EWd11MLTFOCLQjnIkLPTTME9FXkdordQ78uQZ-5iE`
- URL: https://docs.google.com/spreadsheets/d/1I0EWd11MLTFOCLQjnIkLPTTME9FXkdordQ78uQZ-5iE/edit

The workbook contains:

- `Service Config`
- `Drafts`
- `Verification`
- `Audit Log`
- `Test Cases`

Keep sharing set to **Restricted**. Use fictional `@example.com` addresses only.

## Receiver setup, only after the Phase 2 server schema is updated

1. In the SABI Google Workspace account, create a new standalone Apps Script project named `SABI Career Support - Fictional Development Receiver`.
2. Replace the default script with the reviewed `Code.gs` from this folder.
3. Enable the manifest file and replace it with `appsscript.json`.
4. Run `configureCareerSupportDevelopment` once and approve the requested spreadsheet access.
5. Confirm that the script reports successful configuration and that all required sheet tabs exist.
6. Choose **Deploy → New deployment → Web app**.
7. Set **Execute as** to the SABI Workspace account that owns the development workbook.
8. Use the tightest access setting compatible with the fictional public-page test.
9. Copy the deployed `/exec` URL.
10. Replace `REPLACE_WITH_APPS_SCRIPT_EXEC_URL` in `career-support/app.js` with that `/exec` URL only after the schema and fictional end-to-end tests pass.
11. Test only with invented information and `@example.com` addresses.

## What the existing receiver shell supports

- approved service-code validation
- direct routes for fictional people aged 16 or 17 and 18 or over
- no under-16 record creation
- fictional verification codes returned to the test page rather than emailed
- hashed verification codes and return tokens
- duplicate-draft prevention for the same fictional email and service
- token rotation when a fictional draft is reopened
- cross-device draft loading after verified return
- audit events without answer content
- 90-day fictional draft deletion date
- spreadsheet formula-injection protection
- rate limiting and verification-attempt limits

The current server-side answer sanitizer does **not** yet preserve the Phase 2 About you and Current situation fields. That must be corrected before deployment or connection.

## Important development boundaries

- `developmentMode` must remain `true`.
- The receiver rejects requests unless `testOnly` is exactly `true`.
- Only `@example.com` addresses are accepted.
- Do not add live uploads, health information, Terms acceptance, payment or live client data to this receiver.
- Do not reuse the public enquiry receiver or Advocacy records.
- Do not publish or link the development page from the public website navigation.
- Before production, replace or materially re-review this receiver as a production implementation and remove the browser-only fallback from the page.

## Test sequence

Continue fictional route testing only. Record screenshots, route logs, defects and retests in the development workbook. Paid checkout remains disabled throughout this phase.
