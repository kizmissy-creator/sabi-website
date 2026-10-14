# Website build log

## 14 October 2026 — agent build foundation (draft)

Trigger: Sam requested continuation of the proposed outcome-based website build workflow.
Sources: Website Master Plan and Form Architecture in Drive; main commit `007b0a2e7f1726dc6c6da5103c680ee6ef9bed4a`; draft Studio PR #3.

Changes: standing agent instructions, implementation workflow, first work-package acceptance criteria and offline checks with GitHub Actions. Production site content, form receiver, existing backup workflow and Studio branch are unchanged.

Confirmed code findings:
- Homepage currently offers Advocacy and Resources despite the approved plan deferring them.
- There are no dedicated launch service pages on main. Writing & Clarity has no dedicated service card.
- Enquiry iframe load listener redirects to thank-you after any response load while a submission is in progress, without verifying acceptance. Apps Script separately returns success and error responses. This can produce a false confirmation and needs mocked failure-path testing.
- Snapshot setup document lists a different destination folder from the active workflow. Establish intended destination and inspect run results before changing it; existence of a workflow does not prove backup success.

First delivery target: public launch service journeys and reliable enquiry feedback, under the acceptance criteria in `website-build-workflow.md`. Detailed intake, checkout and production activation are later work.

Verification: offline checks passed for 2 HTML pages and 4 scripts. A temporary missing-page link and invalid inline script were both rejected by the checker, then removed. GitHub Actions run 38630885310 passed for implementation commit 29a123310d839cda4c1f6135903e62c391ac03c6. Netlify reported preview #4 ready for that commit. The dated entry in the Drive Website Master Plan was appended and verified by readback. Draft PR: https://github.com/kizmissy-creator/sabi-website/pull/4. Preview: https://deploy-preview-4--celadon-melomakarona-a77f9d.netlify.app. This log-only follow-up does not change site behaviour.
