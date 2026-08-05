# Development acceptance evidence — 5 August 2026

**Branch:** `career-partner-onboarding-prototype`  
**Data used:** Fictional browser-test values only
**Production impact:** None; `main` unchanged  

## Passed

### TypeScript compilation

Command: `tsc -b`

Result: passed after correcting:

- the type of the Career review `onEdit` callback index;
- the shared Admin/Writing service-offer type and optional Admin price range.

### Vite production build

Command: `vite build`

Result: passed.

Generated build summary:

- 32 modules transformed;
- HTML: 0.54 kB;
- CSS: 21.67 kB (4.81 kB gzip);
- JavaScript: 213.88 kB (66.19 kB gzip).

Generated `dist/` files are ignored build output and are not committed.

### Development safeguard validator

Command: `scripts/validate-development-shell.ps1`

Result: passed for:

- source-level live-integration exclusions;
- required development and fictional-data warnings;
- Starting Point routes and service-page offers;
- Stage 1 no-endpoint, no-upload and no-persistence boundary;
- separate, fail-closed Admin and Writing contracts;
- disabled endpoints, uploads and payments;
- distinct deployment identifiers, configuration keys and reference patterns.

### Git whitespace check

Command: `git diff --check`

Result: passed.

## Interactive public-preview evidence

Environment: Netlify deploy preview for PR #1, commit `0ee30fb0e3055c534a2c68470f43bccbfdb64a46`.

Observed passes:

- ROUTE-01 through ROUTE-06;
- PAGE-01 through PAGE-04;
- ENQ-01 through ENQ-06, ENQ-08 and ENQ-09;
- CAREER-01 through CAREER-04;
- Writing self-enquiry validation requires both age band and current-material branch fields;
- accessibility tree exposes the router heading, two labelled fieldsets and labelled inputs;
- the router reflows at 320 CSS pixels with `scrollWidth` equal to `innerWidth` and no unlabelled inputs;
- error summaries receive focus in the tested browser interaction;
- selected states are present in the accessibility tree;
- review remains explicitly a development Service Schedule and payment remains disabled.

Defect found and repaired during testing: the Writing enquiry displayed age band and current material as required but did not enforce them. `0ee30fb` adds both conditional validation checks and safeguard assertions.

Further accessibility testing at commit `a180ec397f8fd3928637fe943f38f55a41e8b42b` found and repaired two defects:

- the `320px` body minimum combined with a vertical scrollbar to create horizontal overflow; `min-width: 0` now gives `scrollWidth = clientWidth = 305px` in the 320px test viewport;
- the focused Stage 1 error/review regions lacked a visible focus treatment; the error alert now receives a visible 4px ring and the review result receives the corresponding gold ring.

Additional partial evidence:

- sampled focused radio control: solid visible outline;
- router text contrast sample: 26 visible direct-text elements tested, with no computed WCAG ratio failure in the sample;
- responsive checks at 640px and 320px found no remaining document overflow after the repair;
- reduced-motion CSS disables smooth scrolling and reduces transition/animation duration, but OS/browser preference emulation was not run.

## Not run or only partially run

Keyboard-only completion, a real screen reader, browser-level 200%/400% zoom, reduced-motion emulation, manual contrast review and touch-device testing were not completed. Browser storage inspection was not available through the preview control surface; the no-persistence boundary remains covered by the source validator and the observed refresh reset, not a direct storage read. These rows remain `Not run` or `Partial pass` and must not be treated as full accessibility passes.

## Still blocked

Backend, Google Workspace permissions, email, upload, retention/deletion, legal-version, production deployment and payment tests remain blocked by the dependencies recorded in the acceptance plan.
