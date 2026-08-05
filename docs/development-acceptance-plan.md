# SABI website development acceptance plan

**Scope:** Starting-point router, Career development journey, Admin & Systems public shell and Stage 1 enquiry, Writing & Clarity public shell and Stage 1 enquiry  
**Data rule:** Fictional data only  
**Release target:** Development branch; this plan does not approve production deployment  

## Evidence states

- **Automated pass:** produced by `career-partner-onboarding/scripts/validate-development-shell.ps1`.
- **Manual pass:** tester records date, environment, viewport/assistive technology, result and notes.
- **Blocked:** a named dependency prevents a valid test.
- **Not run:** test has not yet been executed.

No item may be marked passed from code inspection alone when the test requires interaction, assistive technology, Google Workspace permissions, email delivery, deletion, deployment or recovery.

## Automated development controls

| ID | Control | Expected evidence |
| --- | --- | --- |
| AUTO-01 | No browser source contains live request libraries, secrets, analytics or checkout markers | Validator output |
| AUTO-02 | Development warnings, fictional-data wording, disabled payment and Career consent locks remain present | Validator output |
| AUTO-03 | Starting-point router includes Career, Admin, Writing and unsure routes | Validator output |
| AUTO-04 | Admin and Writing public shells contain the framework-approved launch offers | Validator output |
| AUTO-05 | Stage 1 enquiry source contains no endpoint, upload input, browser persistence or form action | Validator output |
| AUTO-06 | Admin and Writing contracts parse as JSON and remain development-disabled | Validator output |
| AUTO-07 | Endpoint, uploads and payment remain disabled; endpoint URL remains null | Validator output |
| AUTO-08 | Cross-service storage is forbidden and the two deployments, property keys and reference prefixes are distinct | Validator output |
| AUTO-09 | Git diff contains no whitespace errors | `git diff --check` |

## Router and page acceptance

| ID | Scenario | Expected result | State |
| --- | --- | --- | --- |
| ROUTE-01 | Choose Career + defined need | Career result appears and Continue opens Career intake | Not run |
| ROUTE-02 | Choose Career + explore | Guided Career result appears | Not run |
| ROUTE-03 | Choose Admin | Admin result opens Admin service page | Not run |
| ROUTE-04 | Choose Writing | Writing result opens Writing service page | Not run |
| ROUTE-05 | Choose unsure or brief enquiry | General enquiry route appears; no detailed service form opens | Not run |
| ROUTE-06 | Start again | Both umbrella answers and result reset | Not run |
| PAGE-01 | Review Admin page | Two public launch offers and correct starting-price wording display | Not run |
| PAGE-02 | Review Writing page | Four public routes and correct starting prices display | Not run |
| PAGE-03 | Follow enquiry CTA | Correct service-specific Stage 1 shell opens | Not run |
| PAGE-04 | Use back controls | Returns to the correct service page/router without submitting | Not run |

## Stage 1 enquiry acceptance

| ID | Scenario | Expected result | State |
| --- | --- | --- | --- |
| ENQ-01 | Submit an empty Admin review | Accessible error summary lists required fields | Not run |
| ENQ-02 | Complete fictional Admin Tool Fix route | Admin Tool Fix review result appears; Submission stays disabled | Not run |
| ENQ-03 | Complete fictional Workflow Reset route | Workflow Reset review result appears; Submission stays disabled | Not run |
| ENQ-04 | Complete fictional Writing Clarity Edit route | Clarity Edit review result appears; Submission stays disabled | Not run |
| ENQ-05 | Choose Writing case study | Safeguard and suitability review result appears | Not run |
| ENQ-06 | Enter third-party/sensitive = Yes | No sensitive-detail field or upload is requested | Not run |
| ENQ-07 | Inspect network and browser storage | No request is sent and no enquiry value is persisted | Not run |
| ENQ-08 | Refresh after entering fictional answers | Answers clear; no save-and-return claim is made | Not run |
| ENQ-09 | Inspect form controls | No file input, payment button, live privacy agreement or endpoint exists | Not run |

## Accessibility acceptance

| ID | Test | Required method | State |
| --- | --- | --- | --- |
| A11Y-01 | Complete router and both Stage 1 shells without a pointer | Keyboard only; include backward navigation | Not run |
| A11Y-02 | Focus remains visible on every interactive element | Keyboard review at 100% and 200% zoom | Not run |
| A11Y-03 | Headings, landmarks, fieldsets, legends and labels form a coherent structure | Screen reader and accessibility tree | Not run |
| A11Y-04 | Error summary is announced and focus moves to it | Screen reader with empty-form review | Not run |
| A11Y-05 | Routing result is announced without an unexpected context change | Screen reader | Not run |
| A11Y-06 | Content reflows without horizontal page scrolling | 320 CSS px and 400% zoom | Not run |
| A11Y-07 | Selected radio and checkbox states are perceivable without colour alone | Visual and screen-reader review | Not run |
| A11Y-08 | Reduced-motion preference removes non-essential motion | OS/browser reduced-motion emulation | Not run |
| A11Y-09 | Text and meaningful controls meet contrast requirements | Automated scan plus manual spot check | Not run |
| A11Y-10 | Touch targets and spacing are usable on mobile | Mobile viewport and touch review | Not run |

## Career regression checks

| ID | Scenario | Expected result | State |
| --- | --- | --- | --- |
| CAREER-01 | Return to Career after using router | Existing fictional draft behaviour remains intact | Not run |
| CAREER-02 | Attempt to advance without gateway answers | Error summary appears and answers remain | Not run |
| CAREER-03 | Decline optional special-category consent | Sensitive questions remain locked | Not run |
| CAREER-04 | Reach review | Service Schedule is labelled development preview and payment remains disabled | Not run |
| CAREER-05 | Inspect local storage | Only Career fictional development data is present; no Admin/Writing data is stored | Not run |

## Backend and production tests—currently blocked

These cannot pass until dedicated resources and approved wording exist.

| ID | Dependency | Required future evidence | State |
| --- | --- | --- | --- |
| BACK-01 | Dedicated Admin Apps Script deployment | Server validation, duplicate protection and safe reference creation | Blocked |
| BACK-02 | Dedicated Writing Apps Script deployment | Branch routing, token creation and safeguards | Blocked |
| BACK-03 | Separate restricted Sheets | Permission matrix and proof that cross-service reads fail | Blocked |
| BACK-04 | Separate restricted Drive folders | Upload permissions, type/size checks and failed-upload recovery | Blocked |
| BACK-05 | Approved retention schedule | Scheduled deletion and deletion-evidence test | Blocked |
| BACK-06 | Approved Privacy and Terms versions | Version capture and wording acceptance test | Blocked |
| BACK-07 | Approved notification recipients/templates | Proof emails exclude answers and attachments | Blocked |
| BACK-08 | Production deployment | CSP, headers, domain, monitoring and rollback evidence | Blocked |
| BACK-09 | Payment approval | Idempotent checkout and callback tests; remains disabled until separately approved | Blocked |

## Test record template

| Test ID | Date/time | Tester | Commit | Browser/device/assistive technology | Result | Evidence link or note | Defect ID |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  | Pass / Fail / Blocked |  |  |

## Development exit criteria

- All automated controls pass on the candidate commit.
- All router, page, Stage 1, accessibility and Career regression tests pass or have a documented, approved equivalent control.
- Failures have a reproducible defect record and are retested after repair.
- No backend or production test is silently treated as passed while its dependency remains blocked.
- `main` remains unchanged until a separate production review authorizes a merge.
