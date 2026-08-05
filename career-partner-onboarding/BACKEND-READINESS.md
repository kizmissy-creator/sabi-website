# Career Support backend readiness

This prototype must remain local-only until the controls below are implemented and independently verified.

## Minimum records

- Client and verified-email identity, separated from third-party payer details
- Draft form with current section, applicable branch state and expiry date
- Immutable control events for special-category consent, terms, early start and declaration
- Service Schedule snapshot tied to the accepted wording and price versions
- Upload metadata with owner, access scope, replacement state and deletion state
- Scope-review task with reason, status, reviewer and written acceptance
- Booking and payment-event ledger with idempotency keys
- Delivery, reminder, retention, rights-request and breach-event logs

## Security boundaries

- Never put client intake answers in payment-provider metadata.
- A payer does not receive the client intake, documents or career decisions.
- Upload access is limited to the client and authorised SABI personnel.
- Return links require verified identity and must not reveal whether another email address has a draft.
- Every write uses server-side authorisation; browser state is not trusted as proof of identity or consent.
- Secrets remain in the hosting platform's secret store and never enter the repository or browser bundle.

## Required development endpoints

These are interface requirements only; this branch does not expose them.

- `POST /career-support/drafts` – create a draft after email verification
- `GET /career-support/drafts/:id` – return only the authenticated client's draft
- `PATCH /career-support/drafts/:id` – save answers and branch state with optimistic concurrency
- `POST /career-support/drafts/:id/uploads` – create a private upload intent
- `DELETE /career-support/drafts/:id/uploads/:uploadId` – revoke and delete an upload
- `POST /career-support/drafts/:id/scope-review` – pause checkout and create manual review
- `POST /career-support/drafts/:id/checkout` – create idempotent provider checkout after controls pass
- `POST /career-support/payment-events` – verify and process provider callbacks idempotently

## Launch gates

- Threat model and data-protection review approved
- All 18 critical acceptance tests passed or an equivalent control formally approved
- Backup restoration and deletion evidence tested with fictional records
- Keyboard and screen-reader review completed
- Privacy Notice, terms, Service Schedule and consent wording versions approved
- Production monitoring alerts on failed email, upload, payment and workflow events
