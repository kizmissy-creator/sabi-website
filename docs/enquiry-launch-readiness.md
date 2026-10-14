# Short enquiry activation — review record

14 October 2026. This record prepares the work; it does not approve live activation.

## Sources checked
- Existing modular Privacy Notice: https://docs.google.com/document/d/133yiiGlZVotYcQxl22arMOwOpLY5Tf03x4sZ-1dxd6s/edit
- Approved Systems Register: https://docs.google.com/spreadsheets/d/1cP2tUbWTrncQK03-D8f-26FcZnXzmna2lP2ha1Ux2Mk/edit
- Website source and receiver in PR #5.
- ICO privacy-information guidance: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/

The on-site `/privacy/` page is a review draft for browsing and short enquiries, not a replacement for the complete service-specific notice. It remains noindex and explicitly non-operative while the form is disabled. No client data was inspected.

## Prepared in this change
- Public draft identifies the controller, documented business contact/address, proposed data categories, linked purposes/bases, legitimate interests and objection rights, provider categories, transfers, intended retention and the limits of verified controls.
- Actual homepage external styling and font requests are disclosed. Their provider cookies/logs require a live audit; source scanning cannot prove provider behaviour.
- The form links the notice and records its version without demanding agreement. Separate genuine consent/contract controls are unaffected.
- Receiver fails closed without a configured matching notice version and records that version in a dedicated eighth column. An unexpected existing column header blocks writes rather than overwriting it.
- A smoke-test runner uses fictional values only and refuses to run unless the bound workbook has the explicit test name prefix and CONTACT_TEST_MODE=true.

## Evidence and remaining work
- Privacy alias: existing register records successful inbound testing on 4 August. Do not send another email without authorisation.
- Correspondence address: recorded in the current privacy draft. No new address decision is requested.
- Ordinary enquiry retention: planned three months after last meaningful contact if no service is purchased. It is not yet verified across mailbox, Sheet and provider retention/backups. Final notice must match the implemented position; do not promise irreversible deletion now.
- Provider transfers/account controls: retain and verify current applicable terms for the actual enabled services. Draft wording does not certify account configuration.
- Domain/receiver settings: verify the actual public domain, approved parent origin and deployment before enabling. Do not infer approval from an endpoint in old source.
- Live Google test: pending. Available connectors do not expose creation/deployment of Apps Script projects. No test workbook, script deployment or live submission was created in this run.
- Service-specific private intake, payments, booking, terms and AI permissions: separate work. This change does not activate or broaden them.

## Isolated Google test procedure
1. Create a separate spreadsheet named `SABI RECEIVER TEST - acknowledgement v1`, with restricted access. Attach a new Apps Script project. Copy Code.gs and ReceiverSmokeTest.gs from this PR; do not modify the production script or workbook.
2. Set CONTACT_TEST_MODE=true, CONTACT_ALLOWED_ORIGINS to the exact approved test-preview HTTPS origin, CONTACT_TEST_PARENT_ORIGIN to the same origin, and CONTACT_PRIVACY_NOTICE_VERSION=enquiries-draft-2026-10-14. Do not run configureContactReceiver afterward: it resets origin/version defaults.
3. Run runContactReceiverSmokeTest. It creates its test sheet/header and leaves one fictional row as evidence; it sends no email and makes no payment. Retain the returned check result in the private test record. It does not delete existing rows.
4. Deploy only the isolated test script as a web app with the approved public-test access. Use an isolated test copy of the frontend with that endpoint, never the production endpoint or this general preview.
5. Verify actual browser acceptance and error feedback, nested Google sandbox origin, blocked-frame/timeout handling, retry without a duplicate and notice-version logging. A direct script test is not proof of cross-origin browser success.
6. Review effective retention, privacy information, provider settings, production endpoint and notice version before seeking live activation approval.

## Expected evidence before activation
Exact deployment version/URL; restricted test workbook reference (kept private); eight smoke checks; browser result and observed response origin; one stored fictional row with notice version; duplicate retry result; blocked-response recovery; live storage/access/retention verification; approved privacy effective date/version; rollback to disabled frontend.
