# Career Support field-map coverage

Validated against the current Drive sources on 5 August 2026:

- **SABI Career Services Framework – Launch Version – 1 August 2026** (`1TOIbbtsiBHfq5BtPOhEjzPIjDeRercjl8pi8oQ5YBMA`)
- **SABI Career Support – Onboarding and Checkout Field Map – 1 August 2026** (`1g44k7X7HFjA3WBiynRVIlJLuaDz52Ap_nhhNF6so1Tc`)

The older **Career Partner Onboarding Form – Copy Questions and Build Notes** is explicitly marked superseded and is not treated as the package source of truth.

## Implemented in the development shell

- Starting-point router and service-fit umbrella question
- Age-band routing, including direct 16–17 access and an under-16 stop before detailed intake
- Shared identity, contact, current-situation, work-history, next-role, evidence, application and delivery questions
- Professional CV, Career Change, Career Partner, Career Partner Plus and Starter CV branches
- Optional accessibility gate with separate explicit-consent control
- Supporter, third-party payer, add-on and Service Schedule previews
- Urgent, unclear-direction, from-scratch application and Starter CV suitability flags
- Separate Terms, early-start and accuracy controls with development evidence records
- Browser-only save and return, accessible error summary and edit links
- Simulated file selection with no file transmission
- Disabled payment and no live submission endpoint

## Deliberately not live

The following field-map items require approved providers, secure server-side storage or operational workflows. They remain represented by explanatory or simulated controls and must not be described as operational:

- verified-email return links and authenticated drafts
- private uploads, malware scanning and server-side replacement/deletion
- immutable Service Schedule and consent-version records
- Stripe payment, idempotent booking creation, refunds and confirmation messages
- timed retention/deletion jobs, rights-request workflows and backup recovery
- live support-period timers, reminders and internal task automation

## Acceptance boundary

This branch is complete as a **development route shell**, not as a paid-launch system. Paid launch remains blocked until the critical provider-dependent tests in the canonical field map can be run and evidenced with fictional test data.
