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

## Not run or only partially run

Keyboard-only completion, a real screen reader, 200%/400% zoom, reduced-motion emulation, formal contrast measurement and touch-device testing were not completed. Browser storage inspection was not available through the preview control surface; the no-persistence boundary remains covered by the source validator and the observed refresh reset, not a direct storage read. These rows remain `Not run` or `Partial pass` and must not be treated as full accessibility passes.

## Still blocked

Backend, Google Workspace permissions, email, upload, retention/deletion, legal-version, production deployment and payment tests remain blocked by the dependencies recorded in the acceptance plan.
