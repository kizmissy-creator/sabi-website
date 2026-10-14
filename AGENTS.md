# SABI website agent instructions

## Scope and sources
Read `docs/website-build-workflow.md` before implementation. The approved launch services are Career & Job Support, Admin & Systems Support, and Writing & Clarity. Advocacy, Resources & Digital Products and the blog are deferred. SABI Studio has a separate draft preview in PR #3; do not overwrite or merge it incidentally.

Use the linked Drive specifications when access is available. If inaccessible, say so and use only the dated requirements recorded here; do not pretend to have reconciled current documents. Current explicit instructions from Sam override this brief. Ask only about material business decisions or conflicting requirements.

## Complete outcomes
For an authorised work package, inspect existing work, implement on an isolated branch, run relevant checks, repair failures, and prepare a draft PR with a preview, evidence and remaining decisions. Continue through routine reversible steps without asking for each edit. Do not stop at a plan when implementation is requested.

Preserve the existing visual direction and plain English. Make journeys accessible, mobile friendly and manageable with limited attention and energy. Do not invent prices, testimonials, garment properties, service commitments or policy approvals. Avoid introducing a framework, subscription or provider without a demonstrated need.

## Architecture and data
Keep website source in GitHub, previews/hosting in Netlify, and approved private form records in Google Workspace/Apps Script. Separate public enquiries, Career Support and other service records and endpoints. Use fictional test data. Never submit test enquiries to production, read client records, send correspondence, take payments, alter permissions or deploy production unless expressly authorised.

The Netlify publish root is currently the repository root: treat all tracked files as public. Never commit client data, uploads, credentials, secrets or private correspondence, including in logs, fixtures and screenshots. Agents must not broaden their own data permissions. Keep detailed private audit entries in the correct restricted Drive records.

## Verification and delivery
Run `python3 scripts/check_site.py` before requesting review. This covers local references, basic HTML metadata and JavaScript syntax only. Also test changed interactions in a browser when possible: mobile and desktop navigation, keyboard/focus, validation, success and failure. Use a mock or explicitly approved test endpoint, never the live receiver. Report unavailable checks accurately; passing static checks is not launch approval or a full accessibility audit.

For significant changes, include a dated entry in `docs/website-build-log.md`: trigger, sources, change, checks, limitations and next action. Update the relevant Drive planning record with a minimal factual audit entry when the task authorises it and the connector is available; otherwise mark writeback pending. Never claim synchronisation without readback.

PRs must describe the problem and resulting behaviour, validation and limitations. Keep production merge, live backend activation, DNS changes and purchases as separate approvals. Do all authorised preparation before requesting those approvals.
