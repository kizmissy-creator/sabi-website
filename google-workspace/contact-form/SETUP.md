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

## Acknowledgement protocol v1 — draft activation procedure

This branch changes both the website and receiver. Do not enable the frontend against the old deployed receiver: it does not send the required acknowledgements. No live deployment is performed by this PR.

1. Use a separate fictional-test workbook and script deployment. Configure `CONTACT_ALLOWED_ORIGINS` as a comma-separated list of exact approved HTTPS origins, including only the intended test preview. Do not allow arbitrary preview hosts or use a wildcard. `configureContactReceiver` currently sets the existing Netlify production origin as a starting value; verify the actual domain and replace this value for the test deployment.
2. Supply `submissionId`, a fresh `attemptId`, `parentOrigin`, `serviceArea`, `serviceInterest` and the existing form fields. The receiver validates origin and UUIDs before accepting. Service interest is retained in the existing message column; no private record is copied into the website.
3. The response posts `{type: 'sabi-enquiry-result', version: 1, submissionId, attemptId, result}` to the exact configured parent origin. No answers are echoed. Because Apps Script uses nested sandbox frames, the client validates Google HTTPS response origins and both unguessable IDs. Frame loads never confirm success. The origin allowlist is not authentication: public anti-spam and rate controls are still required.
4. Test accepted, rejected, blocked-frame, timeout, storage failure, retry and duplicate outcomes in the deployed Google sandbox. ALLOWALL is used only for a minimal non-interactive acknowledgement response. Browser/privacy settings may block the frame; the page must then report an unconfirmed request, preserving its reference.
5. In this PR, the public form has `data-enabled="false"`, no endpoint and a disabled submit button. To enable an approved test copy, set `data-enabled="true"` and `data-endpoint` to the tested deployment URL. Never use the production receiver for automated tests.
6. Before production, complete publication-ready privacy information, approved storage and retention, confirm the real deployment/domain, and test with explicit authorisation. Remove preview notices/noindex only when approved. Deploy the receiver first, then enable the compatible frontend. No automatic top-level redirects remain in the receiver.
7. Unconfirmed retries preserve the submission ID and frozen answers; each attempt gets a new acknowledgement ID. A previously saved reference is acknowledged without adding another row or consuming another rate-limit allowance.

Automated Node tests use fictional in-memory spreadsheet services, never Google APIs: `node --test tests/enquiry.test.cjs`.

## Notice-version update

The form now provides privacy information rather than requiring agreement to it. It sends `privacyNoticeVersion`; the old `privacyAcknowledged` checkbox is removed. The receiver requires an exact non-empty match to the `CONTACT_PRIVACY_NOTICE_VERSION` script property. It records the value in column H, `privacy_notice_version`. Inspect the existing Sheet schema before deployment; a conflicting column-H header blocks writes.

`configureContactReceiver` intentionally leaves the notice version empty. The draft version `enquiries-draft-2026-10-14` is for isolated testing only. A production version must be chosen after the effective notice is reviewed. See `docs/enquiry-launch-readiness.md` and the isolated `ReceiverSmokeTest.gs` runner. Do not run that test against an actual client workbook.
