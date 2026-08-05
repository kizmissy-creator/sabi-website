# SABI Website Source Map

**Status:** Working implementation control document  
**Last reviewed:** 5 August 2026  
**Code repository:** `kizmissy-creator/sabi-website`  
**Production branch:** `main`  

## Purpose

This document connects the authoritative material in Google Drive to the pages, forms, components, integrations, and evidence that belong in the website repository. It is intended to stop old drafts, duplicate folders, and historic deployment packages from being mistaken for current website instructions.

Google Drive remains the source for approved business content, service rules, form specifications, privacy wording, and operational records. GitHub is the source for website code. Netlify deploys the approved GitHub version. Google Workspace and Apps Script handle private form records and workflow automation.

## Authority order

When sources disagree, use this order:

1. The latest explicitly approved or `CURRENT` service framework.
2. The SABI Website Master Plan and current Form Architecture.
3. The current service-specific field map, build specification, terms, and privacy documents.
4. The implementation in the active GitHub development branch.
5. Historic design references and archived deployment packages, for visual reference only.

Anything labelled `Superseded`, `Archive`, an older version number, or a working draft replaced by a current document must not direct implementation without review.

## Core source register

| Area | Authoritative source | Drive link | Repository destination | Current status |
| --- | --- | --- | --- | --- |
| Whole website | SABI Website Master Plan | [Open document](https://docs.google.com/document/d/1Nj9jX4quonRdSU-ntfAXI-NXcyNprD8o0rE1TASU5Wg) | Site structure, navigation, service pages, launch controls | Source identified; implementation incomplete |
| Forms and data boundaries | SABI Website Form Architecture — Separate Service Forms and Shared Components — 2 August 2026 | [Open document](https://docs.google.com/document/d/1PGf4K_D2WIFPNP2geVal-UAf8wWo06iujfqXFQROgEA) | Shared form shell plus separate service endpoints and storage | Partially represented in prototype |
| Historic visual reference | SABI Website — Stitch Homepage Code Copy | [Open document](https://docs.google.com/document/d/1sQ7gFxfd7vsEWLqjx2Heq7HsFU1MlNsLFnRtwNZNAG8) | Design tokens and visual reference only | Not an implementation authority |
| Career service rules | SABI Career Services Framework — Launch Version — 1 August 2026 | [Open document](https://docs.google.com/document/d/1TOIbbtsiBHfq5BtPOhEjzPIjDeRercjl8pi8oQ5YBMA) | Career landing page, service comparison and journey rules | Prototype in progress |
| Career questions and branching | Career Support Field Map | [Open spreadsheet](https://docs.google.com/spreadsheets/d/1g44k7X7HFjA3WBiynRVIlJLuaDz52Ap_nhhNF6so1Tc) | Career intake schema and conditional-question logic | Used by prototype; validation still required |
| Career form behaviour | Career Support On-Site Form Build Specification | [Open document](https://docs.google.com/document/d/1sJVqNqRRtedhwBegBAlGmRCAS7GD9UdiMV7bJH70JoI) | Career form components, validation, review and submission behaviour | Used by prototype; backend not live |
| Career terms | Career Support Terms working draft | [Open document](https://docs.google.com/document/d/19MxuBqVaOWY5GAVm_LT-ahlpCafUfLYcDiu6ZYAvBnM) | Career terms route and consent/version record | Draft; do not publish as final |
| Website privacy | Privacy Notice working draft | [Open document](https://docs.google.com/document/d/133yiiGlZVotYcQxl22arMOwOpLY5Tf03x4sZ-1dxd6s) | Privacy route and form privacy links | Draft; do not publish as final |
| Admin & Systems rules | `CURRENT - SABI Admin and Systems Service Framework - v10 - August 2026.docx` | [Open file](https://drive.google.com/open?id=16tZNV1SkUCUIY5vPdrNnasePo7a7Rwzq) | Admin service page and separate form family | Page and form not yet built |
| Approved systems | Approved Systems Register | [Open spreadsheet](https://docs.google.com/spreadsheets/d/1cP2tUbWTrncQK03-D8f-26FcZnXzmna2lP2ha1Ux2Mk) | Admin service constraints; never convert directly into public claims without review | Source identified |
| Writing service rules | Writing & Clarity Portfolio Framework | [Open document](https://docs.google.com/document/d/1T_N4Rfi6JMQyiQNQJUmV-zf4N3T3F3qC3KCLzSUjTls) | Writing & Clarity page, scope and service descriptions | Page not yet built |
| Writing enquiry | Writing & Clarity enquiry specification | [Open document](https://docs.google.com/document/d/1qCxlZn7p5JkhbsmZtC3jk3Bn9Lo-ig3M6yJjK_1br20) | Separate Writing & Clarity form family | Form not yet built |
| Writing terms | Writing & Clarity terms | [Open document](https://docs.google.com/document/d/1LtUfR_ul5TcYzh6U4KOFKw5JLxok1VE_9G6qu39K_qA) | Writing terms and consent/version record | Approval state must be confirmed before publication |
| Public enquiries | Website Enquiries sheet | [Open spreadsheet](https://docs.google.com/spreadsheets/d/19tZDlUZQx2gqT5iCEn6PHAvWiY4eBb9bJV0qAi5F23w) | `google-workspace/contact-form/` Apps Script integration | Present on `main`; acceptance evidence needed |

## Page and journey map

| Page or journey | Primary Drive authority | Intended implementation | Status / next control |
| --- | --- | --- | --- |
| Homepage | Website Master Plan | Root `index.html` initially; component route if the site is later migrated | Exists, but must be reconciled with the launch page map |
| Find Your Starting Point | Website Master Plan + Form Architecture | Umbrella router that directs a visitor into one service journey | Missing; build before treating the three service journeys as connected |
| Career & Job Support | Career Services Framework | Dedicated public service page and service comparison | Prototype work exists; public route incomplete |
| Career intake | Field Map + On-Site Form Build Specification | `career-partner-onboarding/` shared shell and Career-only schema/handler | Development prototype; fictional data only |
| Admin & Systems Support | Admin & Systems Framework v10 | Dedicated public page | Development page shell added; production route and acceptance review remain |
| Admin & Systems intake | Admin framework + Form Architecture + Approved Systems Register | Separate form schema, endpoint, storage and notifications | No-submit Stage 1 shell and fail-closed v0 contract added; receiver and private resources remain unbuilt |
| Writing & Clarity | Writing & Clarity Portfolio Framework | Dedicated public page | Development page shell added; production route and acceptance review remain |
| Writing & Clarity intake | Writing enquiry specification + Form Architecture | Separate form schema, endpoint, storage and notifications | No-submit Stage 1 shell and fail-closed v0 contract added; receiver and private resources remain unbuilt |
| General enquiry | Website Master Plan + Form Architecture | Brief contact form handled by `google-workspace/contact-form/` | Implemented in code; needs end-to-end acceptance record |
| Privacy | Approved website privacy notice | Dedicated versioned page linked from every relevant form | Current public placeholder; source is still a working draft |
| Terms | Approved general and service-specific terms | General terms page plus service-specific links and recorded versions | Current public placeholder; approval/version mapping required |
| Cookies | Website Master Plan + approved cookie wording | Cookie information/control appropriate to actual site technologies | Missing or unverified |
| Accessibility | Website Master Plan + accessibility statement/evidence | Accessibility page or statement plus test record | Evidence not yet assembled |
| Thank-you / confirmation | Form Architecture | Route-specific confirmation with reference and next steps | Generic page exists; route-specific behaviour needs review |
| Payments | Approved service, terms, cancellation and Stripe controls | Separate, explicitly enabled production flow | **Disabled; not launch-ready** |
| Resources / digital products | Website Master Plan | Future page family | Out of launch scope |
| Blog | Website Master Plan | Future content area | Out of launch scope |
| Advocacy | Website Master Plan | Future reviewed service area | Not a launch service |

## Shared component boundaries

The following may be shared across service journeys:

- page and form layout;
- progress, save/return and autosave behaviour;
- verified email pattern;
- accessible validation and error summaries;
- uploads component;
- conditional-section component;
- review-before-submit pattern;
- unique reference display;
- anti-spam and rate limiting;
- common privacy-link presentation.

The following must remain service-specific:

- question schema and branching rules;
- endpoint and server-side handler;
- restricted record store and Drive folder;
- notification recipients and templates;
- retention rules;
- service privacy wording and recorded version;
- service terms and recorded version;
- test fixtures, acceptance evidence and release decision;
- payment product, price and enablement control.

There must be no universal mixed intake record containing Career, Admin, and Writing data.

## Repository implementation map

| Repository area | Responsibility | Control note |
| --- | --- | --- |
| `index.html` | Current public homepage and brief enquiry entry point | Production-facing; change through reviewed branches only |
| `images/` | Current shared brand and homepage media | Current GitHub assets match the historic Drive package |
| `thank-you.html` | Current generic confirmation page | Review against route-specific requirements |
| `netlify.toml` | Netlify build/deployment configuration | GitHub-controlled; do not replace with old manual package |
| `google-workspace/contact-form/` | Public enquiry Apps Script source and setup | Private data belongs in Google Workspace, not GitHub |
| `career-partner-onboarding/` | Career Support development prototype | Fictional-data development only; not merged to `main` |
| `career-partner-onboarding/src/ServicePages.tsx` | Admin & Systems and Writing & Clarity public development page shells | Brief-enquiry routing only; no private intake, submission or payment |
| `career-partner-onboarding/src/ServiceEnquiry.tsx` | Admin & Systems and Writing & Clarity Stage 1 development enquiries | In-memory review only; no upload, persistence, endpoint, submission or payment |
| `form-contracts/` | Versioned Admin & Systems and Writing & Clarity data, routing and storage boundaries | Development-disabled; contains no production IDs, endpoints, recipients or credentials |
| `.github/workflows/sync-main-to-google-drive.yml` | Controlled GitHub-to-Drive snapshot automation | Snapshot only; Drive copies must not become code authority |
| `docs/google-drive-snapshot-setup.md` | Snapshot integration instructions | Operational setup reference |
| `docs/website-source-map.md` | This control document | Update whenever a source, route, approval state or implementation owner changes |

## Historic and non-authoritative material

### Manual Netlify package

The Drive folder [SABI-Website-NetlifyFiles](https://drive.google.com/drive/folders/1V-HGpOE9lK5AN6Zx-2jrPOVkI1OdK5hS) contains an older self-contained deployment package: `index.html`, `thank-you.html`, `netlify.toml`, `README.txt`, and images.

Its images remain useful and match the corresponding GitHub assets, but its homepage and README predate the current GitHub-controlled deployment and Apps Script architecture. Keep it as a historical snapshot. Do not drag it into Netlify or overwrite repository files from it.

### Empty duplicate folders

Two Drive folders named `05 Website Content and Build` were found empty. They contain no implementation authority and should not be used as destinations until ownership and intended structure are decided.

### Superseded files

Drive contains older Career onboarding notes, earlier field maps, older service frameworks, older terms, a superseded Cognito recommendation, and multiple archived operational packs. Their presence in search results does not make them current. Retain them for history, but exclude them from implementation unless the current framework explicitly incorporates them.

## Launch controls and blockers

- Paid checkout and real payment endpoints remain disabled.
- Development and acceptance testing use fictional data only.
- No sensitive client records, uploaded client documents, secrets, or production credentials belong in GitHub.
- Privacy and terms working drafts must not be represented as final approved pages.
- Each service journey requires its own data-flow, retention, notification, privacy, security and acceptance review.
- `main` must not receive unfinished service journeys merely to make them available for testing.

## Evidence still required

- approved website content inventory and final page map;
- owner and approval state for each public page;
- final Privacy, Terms, Cookies and Accessibility content;
- public enquiry end-to-end acceptance record;
- service-specific form acceptance tests, including branching and uploads;
- keyboard, screen-reader, zoom, mobile and error-state accessibility evidence;
- deployment and domain-control record;
- data retention, restricted-access and deletion verification for every service;
- explicit payment enablement decision and rollback procedure.

## Maintenance procedure

When a website source changes:

1. Confirm the new Drive document is explicitly current or approved.
2. Record its title, link, version/date, affected routes and approval state here.
3. Identify the GitHub files/components affected before implementation.
4. Make code changes on a development branch.
5. Test with fictional data and capture evidence.
6. Review privacy, accessibility, data separation and payment controls.
7. Merge only through the agreed production review process.
8. Allow the automated GitHub-to-Drive snapshot to reflect approved code; never use that snapshot as the editing source.

## Immediate implementation sequence

1. Build the Find Your Starting Point umbrella router.
2. Connect its Career result to the existing Career Support development journey.
3. Create controlled public page shells for Admin & Systems and Writing & Clarity from their current frameworks.
4. Define separate form contracts and storage boundaries for those two services.
5. Replace legal placeholders only after the relevant Drive documents are approved and versioned.
6. Complete acceptance and accessibility evidence before any production merge or payment enablement.
