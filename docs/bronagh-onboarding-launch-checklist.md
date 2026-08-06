# Bronagh onboarding launch checklist

## Current position

- Dedicated branch: `feat/bronagh-onboarding`.
- This branch must not be merged into `main`.
- It is intended for a separate one-off Netlify site for client `CL-2026-001` only.
- The Netlify publish directory is `client/cl-2026-001`, so the SABI homepage and unfinished public website are not deployed with it.
- The site contains only Bronagh's onboarding, confirmation page and required static assets.
- The route is not linked from the public website.
- Page and Netlify headers instruct search engines not to index, follow, cache or archive the site.
- A password gate protects every route and remembers access for up to 30 days on that browser and device.
- Unfinished text answers stay in the browser's local storage on that device.
- Uploaded files are not retained in the browser draft and must be selected again before submission.
- The final submission goes directly from the browser to the dedicated Google receiver.
- Netlify issues a 15-minute signed pass but does not receive or retain the completed answers or files.
- Google rejects submissions without a valid pass bound to the client reference, service code and submission ID.
- Final answers and files are stored only in the restricted SABI Google Workspace record.

## Private Netlify environment variables required

- `BRONAGH_PAGE_PASSWORD`
- `BRONAGH_COOKIE_SECRET`
- `BRONAGH_SUBMISSION_SECRET`
- `BRONAGH_APPS_SCRIPT_ENDPOINT`

None of these values should be committed to GitHub or included in the client email.

## Safest activation order

1. Create the restricted dedicated Google Sheet and configure the Apps Script receiver using `google-workspace/bronagh-onboarding/SETUP.md`.
2. Generate the shared submission secret and save the same value in Apps Script and the Bronagh Netlify site's `BRONAGH_SUBMISSION_SECRET` variable.
3. Deploy the Apps Script web app and save its `/exec` URL only in `BRONAGH_APPS_SCRIPT_ENDPOINT` on Netlify.
4. Create a separate Netlify site from `feat/bronagh-onboarding`. Do not connect this branch to the public SABI production site.
5. Add the page password and separate cookie secret in Netlify.
6. Deploy the isolated client site.
7. Test the exact client URL on phone and desktop with entirely fictional data.
8. Confirm password access, 30-day cookie behaviour, local save and restore, backup download, conditional questions, private uploads, duplicate protection and confirmation.
9. Confirm files larger than 8 MB individually or 15 MB in total are rejected before submission.
10. Confirm changing the URL does not reveal any public SABI pages.
11. Confirm no Google endpoint or private secret appears in the deployed JavaScript or GitHub branch.
12. Confirm the saved Google JSON does not contain the short-lived submission token.
13. Only after all tests pass, send Bronagh the exact client URL and send the password separately.

## Payment

Add payment only after the Stripe product or client-specific payment route, amount, cancellation wording, Service Schedule and early-start records have been checked together.

The onboarding can be tested before payment is activated. Do not imply the service has started merely because the form was submitted.

## Main SABI domain

Do not change nameservers or move `sabigroup.co.uk` merely to launch this one-off client site. The client deployment can use its own Netlify hostname or a dedicated subdomain later without changing or publishing the unfinished main website.

Any future domain connection must preserve Google Workspace MX, SPF, DKIM, DMARC and verification records.

## Privacy limits

- The password protects access but is not individual identity verification.
- The remembered login belongs to that browser and device. It will not follow Bronagh to another device.
- Browser drafts can be lost if site data is cleared, private browsing is used or the device is lost.
- The downloadable JSON backup is readable and should be used only when needed and handled securely.
- Do not reuse the site, password, secrets, Google receiver or client route for another person.
- Retire the one-off Netlify site and its environment variables when the onboarding route is no longer needed, following the recorded retention decision.
