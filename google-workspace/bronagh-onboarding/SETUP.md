# Bronagh onboarding receiver

This is a dedicated receiver for `CL-2026-001`. It does not modify or share the public website enquiry workbook.

## Before using real client information

1. In the SABI Workspace account, create a Google Sheet named `SABI - CL-2026-001 Onboarding` and keep it **Restricted**.
2. Open **Extensions → Apps Script**, paste in `Code.gs`, and replace the manifest with `appsscript.json`.
3. Run `configureBronaghOnboarding` once. It creates the response tab and a restricted upload folder.
4. Move the generated upload folder into Bronagh's approved `02 Onboarding and Client Evidence` matter folder if required. Moving it does not change its ID.
5. Deploy as a Web app, executing as the owning SABI account, with the narrowest access setting that still permits submission from the website.
6. Copy the deployed `/exec` URL into `client/cl-2026-001/config.js` as `endpoint`.
7. Test with entirely fictional answers and files. Confirm one row, one private submission folder, one JSON snapshot and no duplicate when the same submission ID is resent.
8. Check the page on mobile and desktop, then test a rejected file type, an oversized file and an interrupted submission.

The Apps Script endpoint URL is not a password, but no credentials or secret keys belong in website code. Do not email submitted answers or attach client documents to notification emails.

## Current save-and-return position

The page automatically saves text answers in the browser on the current device and offers a downloadable backup. It is not verified cross-device save-and-return. That later enhancement needs a server-side draft store, expiring one-time links or codes, a 90-day deletion process and end-to-end access testing.
