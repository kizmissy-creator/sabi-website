# SABI service form contracts

These versioned contracts define the intended data and storage boundaries for the Admin & Systems and Writing & Clarity form families before implementation begins.

They are development specifications, not deployed configuration. Endpoint URLs, Google Sheet IDs, Drive folder IDs, privacy-version IDs, notification recipients and credentials are deliberately absent. Payments are disabled.

## Boundary rules

- Stage 1 is a short, no-upload enquiry used for routing.
- Stage 2 is available only through a controlled, expiring token after manual review.
- Each service family has its own Apps Script deployment, restricted Sheet, restricted Drive folder and reference sequence.
- Career, Admin and Writing records must never share a workbook or upload folder.
- Notification emails contain a reference and safe routing metadata only, never form answers or uploaded contents.
- Uploads are client records and are accepted only in an approved Stage 2 route.
- Retention values remain blocked until the applicable approved policy supplies them.
- GitHub stores schemas and code only—never client submissions, documents, secrets or production identifiers.

## Contract lifecycle

1. Review the contract against the current Drive framework and approved privacy/terms versions.
2. Replace each required `TBD` control through deployment configuration, not source-code secrets.
3. Implement the receiver and storage resources separately for each service.
4. Run the acceptance checks using fictional data.
5. Record contract version, privacy version and terms version with every accepted record.
6. Enable a route only after permissions, deletion and notification content have been verified.

The contracts are intentionally fail-closed: `endpoint.enabled`, `uploads.enabled` and `payment.enabled` are false.
