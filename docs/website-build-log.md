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

## 14 October 2026 — public service journeys and acknowledgement fix (draft)

Trigger: Sam requested continuation after the build foundation. Includes the foundation from draft PR #4; PR #5 targets main as one complete review package.
Sources: Website Master Plan; Form Architecture; Career Services Framework (1 August); current Admin & Systems v10 (August); Writing & Clarity portfolio and its four service frameworks (2 August). Current documents were read; no case files were accessed.

Changes: seven dedicated pages for the three launch service categories and four writing services; confirmed prices and scoped inclusions; homepage launch cards and starting-point routing; short preview enquiry with service selection; controller that confirms only correlated acknowledgements; draft Apps Script result protocol, exact parent-origin allowlist, uncertain-response handling and duplicate retry protection. Added in-memory receiver tests and offline browser journey checks in CI.

The preview cannot send enquiries: disabled by default, no receiver endpoint. Live deployment, privacy publication, private intake, checkout, booking links and real Google sandbox integration remain outstanding. Published service pages are marked noindex for review. No production records, payments or emails are created. Review PR: https://github.com/kizmissy-creator/sabi-website/pull/5

Local verification: 9 HTML pages and 6 scripts passed static checks; all 7 Node tests passed; git diff --check passed. Local Chromium download failed in this execution environment; GitHub run 38633335068 passed both static/Node and browser jobs. Browser checks covered all seven service pages at 390px and 1280px, keyboard skip links, service routing, preview gating and mocked accepted/rejected/unconfirmed responses with retry. Desktop and mobile screenshots were inspected. Live Apps Script sandbox nesting and browser-blocked responses require authorised separate-workbook tests before activation.


## 14 October 2026 — privacy draft and isolated receiver preparation

Sam authorised continuation. Read the current modular Privacy Notice and Approved Systems Register, checked website resource/form source and current ICO transparency guidance. Prepared a scoped website/enquiry privacy review draft, linked it before collection and across public pages, and replaced privacy agreement with notice-version recording. The receiver requires a configured matching version and records it without overwriting an unexpected existing column. Career Support's documented 18+ launch boundary is now explicit.

Prepared an isolated Google receiver smoke-test runner and an evidence checklist. No live script deployment is available through the connected tools; no production activation or test submissions occurred. Intended deletion periods remain explicitly unverified against provider retention. Client AI processing permissions are unchanged. Local validation: 10 HTML pages and 7 scripts passed static checks; all 9 Node tests passed, including test-runner isolation guards and its eight smoke checks. GitHub run 38639328207 passed both static/Node and browser jobs for implementation commit 22328ccab3be6da3979f86fd6b1bd289166ab152. Eight service/privacy pages passed mobile/desktop checks; mock submissions included notice-version delivery without agreement. Privacy-page screenshots were inspected. Dated readiness entries were saved and verified in the existing Drive Notice and Website Master Plan. The existing PR #5 is extended as one review package.
