# Bronagh onboarding receiver

This is a dedicated receiver for `CL-2026-001`. It does not modify or share the public website enquiry workbook.

## Storage design

- Unfinished text answers remain in Bronagh's browser on that device.
- Netlify authenticates the private page and issues a short-lived signed submission pass.
- Netlify does not receive or retain the completed answers or uploaded files.
- The browser sends the completed submission directly to the dedicated Google Apps Script receiver.
- Google verifies the signed pass before creating any spreadsheet row or Drive folder.
- The final response and uploads remain in SABI's restricted Google Workspace record.

## 1. Prepare the dedicated Google record

1. In the SABI Workspace account, create a Google Sheet named `SABI - CL-2026-001 Onboarding` and keep it **Restricted**.
2. Open **Extensions -> Apps Script**.
3. Paste in `Code.gs` and replace the manifest with `appsscript.json`.
4. Enable the Advanced Drive service used by the script.
5. Run `configureBronaghOnboarding` once. It creates the response tab and a restricted upload folder.
6. Move the generated upload folder into Bronagh's approved `02 Onboarding and Client Evidence` matter folder if required. Moving it does not change its ID.

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

## 4. Configure the private Bronagh Netlify site

Deploy branch `feat/bronagh-onboarding` as a separate Netlify site. Do not merge it into `main` and do not attach it to the public SABI production site.

Create these private environment variables:

- `BRONAGH_PAGE_PASSWORD`: the access password sent to Bronagh separately from the page link
- `BRONAGH_COOKIE_SECRET`: a separate long random value used only to sign the 30-day browser-access cookie
- `BRONAGH_SUBMISSION_SECRET`: the same random submission secret saved in Apps Script
- `BRONAGH_APPS_SCRIPT_ENDPOINT`: the deployed Google Apps Script `/exec` URL

The deployment publishes only `client/cl-2026-001`. It does not publish the SABI homepage or unfinished public website pages.

## 5. Fictional testing before real use

Test with entirely fictional information and files.

1. Open the client site without a cookie and confirm the password screen appears.
2. Enter the correct password and confirm access remains after closing and reopening the browser.
3. Complete part of the form, close it and confirm the local draft restores on the same browser and device.
4. Confirm the draft does not appear in another browser or device.
5. Submit fictional information and confirm one spreadsheet row, one private submission folder and one JSON snapshot are created.
6. Resend the same submission ID and confirm no duplicate record is created.
7. Test a rejected file type, an oversized file, a wrong password and an interrupted submission.
8. Test mobile and desktop layouts.
9. Confirm that changing the site URL does not reveal any public SABI pages.
10. Confirm the saved JSON does not contain `submissionToken`.

## Save-and-return limits

The page automatically saves text answers in the current browser on the current device. It is not cross-device storage. Browser data can be lost if Bronagh clears site data, uses private browsing or loses access to the device.

Uploaded files are not saved in the browser draft. They must be selected again when she is ready to submit.

The optional downloadable backup contains her answers in a readable JSON file. She should use it only when needed and keep or send it securely.

## Important handling rules

- Do not email submitted answers or attach client documents to notification emails.
- Keep the Google Sheet, response folders and upload folders Restricted.
- Do not reuse this receiver, password, secrets or client route for another client.
- Retire the separate Netlify site and its environment variables when Bronagh's onboarding route is no longer needed, following the agreed retention record.
