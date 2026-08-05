# Development acceptance evidence — 5 August 2026

**Branch:** `career-partner-onboarding-prototype`  
**Data used:** None; build and static checks only  
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

## Not run

Interactive browser, responsive, keyboard, screen-reader and browser-storage tests were not run. The local preview built and started on `127.0.0.1:4173`, but browser automation was prevented from controlling that local URL by the application URL security policy. No alternative browser-control route was used.

These rows remain `Not run` in `development-acceptance-plan.md`; they must not be treated as passed.

## Still blocked

Backend, Google Workspace permissions, email, upload, retention/deletion, legal-version, production deployment and payment tests remain blocked by the dependencies recorded in the acceptance plan.
