# Bronagh follow-up delivery

The client copy is served at `/follow-up/` on the existing private Netlify onboarding site. It uses the existing client-access cookie and password. The separate Sites review copy is unchanged and cannot send responses.

## Build and deploy

- Run `pnpm install --frozen-lockfile` and `pnpm run build` in `follow-up-app`.
- Commit the source and generated `client/cl-2026-001/follow-up` output together. The existing Netlify build continues to serve this static output without changing onboarding.
- Run `node --test tests/follow-up.test.mjs tests/follow-up-access.test.mjs tests/onboarding-access-token.test.mjs` from the repository root.
- The deployment branch is `feat/bronagh-onboarding` on `kizmissy-creator/sabi-website`.

## Receiver

Uses the existing Apps Script endpoint and signing secret. `FollowUp.gs` is additive. The live `Code.gs` includes tester support absent from this branch: never replace the live file with the branch copy. Only add the follow-up route after JSON parsing and exempt `Follow-up - ` / `TEST - Follow-up - ` folders from abandoned-upload cleanup.

Apps Script version 11 was deployed on 13 September 2026 with these additions, preserving its endpoint and access settings. No configuration/bootstrap function was run.

Responses save a readable Google Doc and structured JSON under the existing private client upload root, plus a `Bronagh Follow-up` spreadsheet row. Owner notifications contain a document link, not answers. Retries keep the same submission ID; partial file saves are recovered.

## Test isolation and launch gate

- `?test=1` uses a separate browser draft, the existing tester upload root and the `Follow-up tests` sheet. No owner notification is sent.
- Production submissions are rejected until the Netlify function variable `BRONAGH_FOLLOW_UP_ENABLED` is exactly `true`.
- Never submit review-click data to the real client record.
- A draft is not a receipt. The client shows success only after the receiver confirms the matching submission ID.
- If sending is unconfirmed, the frozen payload stays locally available for an identical retry; editing is disabled until receipt is confirmed.

## Remaining launch verification

At this checkpoint the Netlify client build has not been published and the production gate remains closed. Verify the private page, mobile layout, an isolated end-to-end test and its saved document before enabling production.

Three existing tests fail identically on the untouched branch baseline: two legacy `payment-success` assertions and one `tester-site` link assertion. These are not follow-up regressions and were not changed.
