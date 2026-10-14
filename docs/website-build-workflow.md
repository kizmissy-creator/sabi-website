# Website build workflow

Established 14 October 2026. This is a dated implementation brief, not a substitute for newer approved Drive decisions.

## Authoritative planning sources
- Website Master Plan: https://docs.google.com/document/d/1Nj9jX4quonRdSU-ntfAXI-NXcyNprD8o0rE1TASU5Wg/edit
- Form Architecture: https://docs.google.com/document/d/1PGf4K_D2WIFPNP2geVal-UAf8wWo06iujfqXFQROgEA/edit
- Studio draft: https://github.com/kizmissy-creator/sabi-website/pull/3

Only specifications required for the work should be retrieved. These links do not authorise access to client case files.

## Delivery cycle
1. Reconcile the requested outcome with current sources and branches.
2. List observable acceptance criteria and material unknowns.
3. Implement on a separate branch; preserve unrelated work.
4. Run static checks, browser checks and mocked failure-path tests as relevant; repair failures.
5. Open a draft PR with preview, test evidence, audit entry and rollback approach.
6. Present only outstanding decisions to Sam. Production release requires explicit approval.
7. After authorised release, verify it and record the commit and result in the appropriate Drive planning record.

No background coding agent is enabled by these files. GitHub Actions checks run on PRs after the workflow exists on the relevant branch. Netlify preview availability must be verified, not assumed. The existing main-to-Drive snapshot workflow is a code backup, not two-way planning reconciliation.

## First work package: public service journeys and reliable enquiry feedback
The current main branch has a homepage and thank-you page, rather than the dedicated service pages specified by the plan. Launch alignment and the public enquiry journey are the first delivery target, before complex intake or checkout.

Acceptance criteria:
- Career & Job Support, Admin & Systems Support and Writing & Clarity have distinct, useful destinations reachable from desktop and mobile navigation.
- The starting-point route sends visitors to the relevant launch service or brief enquiry; Advocacy and Resources are not offered as available launch services.
- Service content is grounded in approved specifications. Missing prices, booking URLs and policy approvals are recorded rather than invented.
- The brief enquiry form provides privacy information and discourages detailed medical, legal, financial or identity evidence.
- Success is shown only after verified server acknowledgement. Receiver errors, blocked responses, timeouts and double-clicks have explicit recoverable behaviour. A frame load alone is not success.
- Mocked submissions cover accepted, rejected, duplicate and unavailable-receiver cases; no production records or notification emails are created.
- Local links/assets and JavaScript syntax pass; changed journeys are checked at mobile/desktop widths and by keyboard.
- Production endpoint settings, storage permissions and the applicable policies are verified separately before live launch.

## Automated baseline
`python3 scripts/check_site.py` requires Python 3 and Node. It checks all tracked HTML pages and JS/GS syntax without executing code or sending requests. It verifies local anchors/assets, duplicate IDs, language/title/viewport and image alt attributes. External URLs, server correctness, CSS, browser behaviour, payments and full accessibility remain outside its coverage. CSS background references and dynamic links also require other checks.

For stronger verification, add browser journey tests with mocked backends when the first feature is implemented. Do not introduce browser tests that silently contact production.
