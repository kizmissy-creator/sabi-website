# Bronagh onboarding launch checklist

## Current position

- Private route: `/client/cl-2026-001/`
- Not linked from the homepage or public navigation.
- Page and Netlify headers both instruct search engines not to index, follow, cache or archive the route.
- The repository's `netlify.toml` publishes the repository root and contains security headers, but it does not identify a Netlify site ID or prove that Git-based continuous deployment is connected.
- The existing Google Apps Script contact receiver still refers to `https://celadon-melomakarona-a77f9d.netlify.app/`, which appears to be the earlier Netlify site URL.
- `sabigroup.co.uk` currently resolves to the existing Squarespace website and redirects to `www.sabigroup.co.uk`.
- Internal SABI records say Squarespace is the customer-facing domain provider, Tucows is the underlying registrar and Google Domains nameservers currently provide DNS. Confirm these values in the live account before changing DNS.

## Safest order for Bronagh

1. Configure and fictionally test the dedicated Google Apps Script receiver in `google-workspace/bronagh-onboarding/SETUP.md`.
2. Put its deployed `/exec` URL in `client/cl-2026-001/config.js`.
3. Commit and push this feature branch, then create a Netlify branch deploy or Deploy Preview. Do not merge to `main` yet.
4. Test the exact preview URL on phone and desktop with fictional data. Confirm automatic saving, backup download, conditional questions, private uploads, duplicate protection and confirmation.
5. If Bronagh needs access before the main domain moves, send only the exact branch/deploy-preview client URL. Keep the route unlinked.
6. Add payment later only after the Stripe product/payment link, amount, refund route, Service Schedule and early-start records have been tested. A reusable public payment link is weaker than a client-specific invoice or single-use route for this bespoke package.

## Connecting `sabigroup.co.uk` later

Do not change nameservers merely to launch this client page.

1. Confirm the Netlify production site is connected to this GitHub repository and that production deploys come only from `main`.
2. In Netlify, add both `sabigroup.co.uk` and `www.sabigroup.co.uk` as custom domains and choose one canonical hostname.
3. Copy the exact DNS records Netlify displays. Do not guess them.
4. In the current authoritative DNS manager, lower the TTL in advance if the interface permits, then replace only the web-host records for the apex and `www`. Preserve Google Workspace MX, SPF, DKIM, DMARC and verification records.
5. Keep the old Squarespace site available until Netlify shows a valid TLS certificate and both hostnames work over HTTPS.
6. Test apex-to-`www` (or the chosen reverse) redirect, the homepage, private onboarding route, public enquiry submission and thank-you route.
7. Update the Apps Script contact receiver's success URL from the old Netlify hostname to the chosen production domain and redeploy it.
8. Only after a stable rollback window should the Squarespace website subscription or old web records be removed. Domain registration and Google Workspace DNS must remain intact.

## Important privacy limit

An obscure, unlinked URL plus `noindex` is private-by-discovery, not authenticated access. It is appropriate only if the link is sent directly and contains no pre-filled sensitive data. For stronger access control, add Netlify access protection or a verified one-time-link flow before collecting live information.
