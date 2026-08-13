# Bronagh onboarding receiver

This is a dedicated receiver for `CL-2026-001`. It does not modify or share the public website enquiry workbook.

## Storage design

- Unfinished text answers remain in Bronagh's browser on that device.
- Netlify authenticates the private page and issues a short-lived signed upload ticket.
- The browser sends each document straight to the dedicated Google receiver. Netlify handles only the small ticket, status and removal requests and never receives the file content.
- The final form submission contains Drive references rather than embedding the document files again.
- Google verifies the signed pass before creating any spreadsheet row or Drive folder.
- The final response and uploads remain in SABI's restricted Google Workspace record.

## 1. Prepare the dedicated Google record

1. In the SABI Workspace account, create a Google Sheet named `SABI - CL-2026-001 Onboarding` and keep it **Restricted**.
2. Open **Extensions -> Apps Script**.
3. Paste in `Code.gs` and replace the manifest with `appsscript.json`.
4. Enable the Advanced Drive service used by the script.
5. Run `configureBronaghOnboarding` once. It creates the response tab and a restricted upload folder.
6. Move the generated upload folder into Bronagh's approved `02 Onboarding and Client Evidence` matter folder if required. Moving it does not change its ID.
7. Run `installBronaghUploadCleanupTrigger` once. This removes unfinished upload folders after 90 days while preserving every submitted record.

If the form or the sheet mapping changes later, update the Apps Script code and run `updateBronaghOnboardingSheet`. It adds any new summary columns without deleting existing responses or folders.

## 2. Create the shared submission secret

Generate one random secret of at least 32 characters. Do not put it in GitHub, the website files, email or the client record.

1. In Apps Script, run `setBronaghSubmissionSecret('YOUR_RANDOM_SECRET')` once, substituting the real value.
2. In the separate Bronagh Netlify site, create a private environment variable named `BRONAGH_SUBMISSION_SECRET` with exactly the same value.
3. Scope the variable to Functions and the Bronagh deploy context only where Netlify permits.

The signed pass lasts 15 minutes and is bound to Bronagh's client reference, service code and unique submission ID. A fresh pass is requested automatically when she presses Send.

## 3. Deploy the Google receiver

1. Deploy the script as a Web app.
2. Execute it as the owning SABI account.
3. Use the narrowest access setting that still permits the external website submission.
4. Copy the final `/exec` URL.
5. In the separate Bronagh Netlify site, save it as the private environment variable `BRONAGH_APPS_SCRIPT_ENDPOINT`.
6. Do not put the `/exec` URL back into `client/cl-2026-001/config.js`.

## 4. Send the payment confirmation email

The same restricted Apps Script sends the confirmation email from the SABI Workspace account only after Netlify has verified Stripe's signed checkout-completed event. The email contains no onboarding answers or uploaded files.

1. Replace the Apps Script code and manifest with the current versions in this folder. Authorise the added permission to send email.
2. Generate a second random secret of at least 32 characters. Run `setBronaghPaymentEmailSecret('YOUR_RANDOM_SECRET')` once in Apps Script.
3. In Netlify, create `BRONAGH_PAYMENT_EMAIL_SECRET` with the identical value and scope it to Functions and the Bronagh deploy context.
4. Deploy a new version of the Apps Script web app so it uses the updated email code.
5. In Stripe, add an endpoint for `https://bronagh.sabigroup.co.uk/api/stripe-payment-email`, select only `checkout.session.completed`, and copy the webhook signing secret into `STRIPE_PAYMENT_EMAIL_WEBHOOK_SECRET` on Netlify.
6. Make one Stripe test-mode payment first. Confirm exactly one email is sent, the Payment confirmations sheet records it, and the email contains no form answers or attachments.

## 5. Configure the private Bronagh Netlify site

Deploy branch `feat/bronagh-onboarding` as a separate Netlify site. Do not merge it into `main` and do not attach it to the public SABI production site.

Create these private environment variables:

- `BRONAGH_PAGE_PASSWORD`: the access password sent to Bronagh separately from the page link
- `BRONAGH_COOKIE_SECRET`: a separate long random value used only to sign the 30-day browser-access cookie
- `BRONAGH_SUBMISSION_SECRET`: the same random submission secret saved in Apps Script
- `BRONAGH_APPS_SCRIPT_ENDPOINT`: the deployed Google Apps Script `/exec` URL
- `BRONAGH_PAYMENT_EMAIL_SECRET`: the same separate payment-email secret saved in Apps Script
- `STRIPE_PAYMENT_EMAIL_WEBHOOK_SECRET`: the signing secret for the dedicated Stripe webhook endpoint

The deployment publishes only `client/cl-2026-001`. It does not publish the SABI homepage or unfinished public website pages.

## 6. Fictional testing before real use

Test with entirely fictional information and files.

1. Open the client site without a cookie and confirm the password screen appears.
2. Enter the correct password and confirm access remains after closing and reopening the browser.
3. Complete part of the form, close it and confirm the local draft restores on the same browser and device.
4. Confirm the draft does not appear in another browser or device.
5. Add several documents to one category and confirm each appears as uploaded without waiting for the final submission. Refresh the page and confirm the list returns.
6. Remove one uploaded document and confirm it is moved to the Drive bin and disappears from the form.
7. Submit fictional information and confirm one spreadsheet row, one private submission folder and one JSON snapshot are created. Confirm the remaining uploads are in that same folder and the sheet row includes the submission-folder link.
8. Resend the same submission ID and confirm no duplicate record is created.
9. Test a rejected file type, a file larger than 12 MB, a wrong password and an interrupted upload.
10. Test mobile and desktop layouts.
11. Confirm that changing the site URL does not reveal any public SABI pages.
12. Confirm the saved JSON does not contain `submissionToken`.

## Separate public tester record

The Career Partner tester site can run a complete end-to-end test without mixing fictional responses with Bronagh's record.

1. Replace the Apps Script project with the current `Code.gs` and deploy a new web-app version.
2. Run `configureCareerPartnerTester()` once. This creates a separate `Tester Onboarding` sheet and a restricted folder named `TEST ONLY - Career Partner form submissions`.
3. Generate a new random secret of at least 32 characters. Run `setCareerPartnerTesterSubmissionSecret('YOUR_RANDOM_SECRET')` once.
4. In the tester Netlify project, add `TESTER_SUBMISSION_SECRET` with the same value and `TESTER_APPS_SCRIPT_ENDPOINT` with the web-app `/exec` URL. Keep both secret and scoped to Functions for Production.
5. Redeploy the tester site, then submit fictional answers and harmless sample files only.
6. Confirm a row appears in `Tester Onboarding`, the readable response opens, sample uploads and voice recordings open, and the notification subject starts with `[TEST]`.

The tester receiver never writes to the `Bronagh Onboarding` sheet or Bronagh upload folder because its client reference, service code, secret, sheet and root folder are separate.

## Save-and-return limits

The page automatically saves text answers in the current browser on the current device. It is not cross-device storage. Browser data can be lost if Bronagh clears site data, uses private browsing or loses access to the device.

Uploaded-document references are saved in the local browser draft. The documents themselves are stored immediately in SABI's restricted Drive, can be removed before submission and do not share one combined size allowance. Each document can be up to 12 MB.

The optional downloadable backup contains her answers in a readable JSON file. She should use it only when needed and keep or send it securely.

## Important handling rules

- Do not email submitted answers or attach client documents to notification emails.
- Keep the Google Sheet, response folders and upload folders Restricted.
- Do not reuse this receiver, password, secrets or client route for another client.
- Retire the separate Netlify site and its environment variables when Bronagh's onboarding route is no longer needed, following the agreed retention record.
