# SABI website contact-form receiver

This is a separate Google Apps Script receiver for the short public website enquiry form. It does not use or modify the advocacy client-form script or workbook.

## Data collected

- Name
- Email address
- Preferred contact method
- Short enquiry message
- Privacy acknowledgement

Do not expand this receiver to collect detailed financial, health, legal, identity-document or advocacy case information. Keep that work in the separately reviewed client-intake system.

## Create the dedicated workbook

1. In the SABI Google Workspace account, create a new Google Sheet named `SABI Website Enquiries`.
2. Keep its sharing set to **Restricted** and grant access only to the named account or accounts that need to answer enquiries.
3. Require two-step verification for every account with access.
4. In the Sheet, open **Extensions → Apps Script**.
5. Replace the default code with `Code.gs` from this folder.
6. In Apps Script **Project Settings**, enable the manifest file and replace it with `appsscript.json`.
7. Run `configureContactReceiver` once and approve its spreadsheet permission.
8. Confirm that a `Website Enquiries` tab and its header row were created.

## Deploy for fictional testing

1. Choose **Deploy → New deployment → Web app**.
2. Set **Execute as** to the SABI Workspace account that owns the dedicated enquiry Sheet.
3. Use the tightest access setting compatible with the public website form.
4. Copy the deployed `/exec` URL. Do not use the `/dev` URL.
5. Do not paste that URL into the website yet. First provide it to Codex so the form can be connected with the required hidden submission ID, timing, honeypot and privacy fields.
6. Test end-to-end using clearly fictional details.

## Built-in controls

- Dedicated spreadsheet and script, separate from advocacy records
- Strict field list, permitted contact-method values and length limits
- Required privacy acknowledgement
- Honeypot handling and minimum completion time
- Per-email submission throttling using a non-reversible cache key
- Duplicate-submission protection using a client-generated UUID
- Spreadsheet formula-injection protection
- Generic failure page that does not expose submitted information
- No submitted message content written to application logs

The deployment URL is an endpoint, not a password. Do not put Google credentials, API keys or shared secrets into the website code.
