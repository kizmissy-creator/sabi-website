# Current Studio preview access

An Edge Function protects all paths on non-production deployments containing this code, including static assets and direct sample function URLs. Netlify's trusted deployment context bypasses this check only for production. Failures stop the request chain; authenticated responses are private and no-store. Existing Studio HTML, copy and styling are unchanged.

HTTP Basic sign-in uses username `sabi`. The generated password is kept in local `.sample-private/preview-password.json` and Sam's local `outputs/SABI-preview-password.txt`, never in the published files or repository. Only a salted SHA-256 verifier is committed; the random password has 144 bits of entropy. Do not replace it with a short guessable password. Access is over HTTPS. Browsers cache HTTP authentication for their current session; closing the browser clears the usual session, and changing the password requires updating the verifier and redeploying.

Friends need the shared preview credentials plus their individual invitation link to request a sample. The preview password does not grant organiser access: the existing private organiser token is still required.

Scope: the updated PR #3 preview and immutable deployments made from this code. Earlier immutable Netlify deployment URLs and other branches are not retroactively changed. This is not Netlify's paid project-wide visibility feature. No production merge or account-plan change is made.

Validation: five authentication tests alongside eight reservation tests. Check deployed requests for missing/wrong credentials (401), correct credentials (200), protected assets and functions, authenticated then anonymous requests to detect cache leaks, and the unauthenticated production homepage (200).
