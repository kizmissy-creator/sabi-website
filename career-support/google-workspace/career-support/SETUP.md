# SABI Career Support fictional-development receiver

This folder supports the first Career Support route shell. It is deliberately restricted to fictional testing and is not a production client-intake system.

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

## Create and deploy the Apps Script test receiver

1. In the SABI Google Workspace account, create a new standalone Apps Script project named `SABI Career Support - Fictional Development Receiver`.
2. Replace the default script with `Code.gs` from this folder.
3. Enable the manifest file and replace it with `appsscript.json`.
4. Run `configureCareerSupportDevelopment` once and approve the requested spreadsheet access.
5. Confirm that the script reports successful configuration and that all required sheet tabs exist.
6. Choose **Deploy → New deployment → Web app**.
7. Set **Execute as** to the SABI Workspace account that owns the development workbook.
8. Use the tightest access setting compatible with the fictional public-page test.
9. Copy the deployed `/exec` URL.
10. Replace `REPLACE_WITH_APPS_SCRIPT_EXEC_URL` in `career-support/app.js` with that `/exec` URL.
11. Test only with invented names, notes and `@example.com` addresses.

## What the receiver currently supports

- approved service-code validation
- direct routes for fictional people aged 16 or 17 and 18 or over
- no under-16 record creation
- fictional verification codes that are returned to the test page rather than emailed
- hashed verification codes and return tokens
- duplicate-draft prevention for the same fictional email and service
- token rotation when a fictional draft is reopened
- cross-device draft loading after verified return
- autosave of two small fictional test fields
- audit events without answer content
- 90-day fictional draft deletion date
- spreadsheet formula-injection protection
- rate limiting and verification-attempt limits

## Important development boundaries

- `developmentMode` must remain `true`.
- The receiver rejects requests unless `testOnly` is exactly `true`.
- Only `@example.com` addresses are accepted.
- Do not add uploads, health information, real work history, Terms acceptance, payment or live client data to this receiver.
- Do not reuse the public enquiry receiver or Advocacy records.
- Do not publish or link the development page from the public website navigation.
- Before production, replace this receiver with a separately reviewed production implementation and remove the browser-only fallback from the page.

## First test sequence

Run the `SHELL-001` to `SHELL-011` cases in the development workbook. Record screenshots, route logs, defects and retests. Paid checkout remains disabled throughout this phase.
