# Current Studio preview access

An Edge Function protects all paths on non-production deployments containing this code, including static assets and direct sample function URLs. Netlify's trusted deployment context bypasses this check only for production. Failures stop the request chain; authenticated responses are private and no-store. Existing Studio HTML, copy and styling are unchanged.

Visitors enter the shared password on a small server-rendered form. The generated password stays in local .sample-private/preview-password.json and the local outputs/SABI-preview-password.txt, outside Git and the public build. Only salted verifiers are committed. The random password has 144 bits of entropy; do not replace it with a short guessable password. Sign-in sets a separate derived bearer token in a Secure, HttpOnly, SameSite=Strict, host-only session cookie over HTTPS. The password itself is not stored in the cookie. Rotation requires replacing both verifiers and redeploying; old immutable deploys retain their own verifiers. Basic authentication with username sabi also works for automated verification.

Friends need the shared preview credentials plus their individual invitation link to request a sample. The preview password does not grant organiser access: the existing private organiser token is still required.

Scope: the updated PR #3 preview and immutable deployments made from this code. Earlier immutable Netlify deployment URLs and other branches are not retroactively changed. This is not Netlify's paid project-wide visibility feature. No production merge or account-plan change is made.

Validation: seven authentication tests alongside eight reservation tests. Check deployed requests for missing/wrong credentials (401), correct credentials (200), protected assets and functions, authenticated then anonymous requests to detect cache leaks, and the unauthenticated production homepage (200).
