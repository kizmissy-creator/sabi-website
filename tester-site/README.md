# Career Partner tester site

This is a safe usability-testing copy of the private Career Partner journey.

- Stripe uses the Sandbox Payment Link.
- No real payment is taken.
- Fictional test submissions, harmless sample files and recordings go to a separate restricted tester record after the tester receiver is configured.
- Nothing is written to Bronagh's sheet, folder or client record.
- The build is visibly labelled TEST MODE and excluded from search engines.
- The tester password is separate from the Bronagh client password.

## Netlify project settings

Create a separate Netlify project from the same repository and branch.

- Base directory: `tester-site`
- Build command: use the value from `tester-site/netlify.toml`
- Publish directory: use the value from `tester-site/netlify.toml`
- Environment variable `TESTER_ACCESS_SECRET`: a random value of at least 32 characters
- Environment variable `TESTER_PAGE_PASSWORD`: the password shared with testers
- Environment variable `TESTER_SUBMISSION_SECRET`: the tester-only secret also saved in Apps Script
- Environment variable `TESTER_APPS_SCRIPT_ENDPOINT`: the deployed Apps Script `/exec` URL

Do not add any Bronagh environment variables to this tester project.

After deployment, update the Stripe Sandbox Payment Link redirect to the tester project's `/payment-confirmation.html` URL.
