# Separate follow-up tester

This branch serves `/follow-up/` on the existing `sabi-career-partner-test` Netlify site. It uses the existing tester password and cookie. It does not change Bronagh's live site, password or access settings.

The frontend always submits `testMode: true` through `/api/test-follow-up-submit`; the backend independently rejects non-test requests and uses only the existing `TESTER_*` environment variables. The Apps Script receiver accepts the tester signing secret only for explicitly test-mode submissions. Test answers go to `TESTER_UPLOAD_FOLDER_ID` and the `Follow-up tests` sheet, without client notification emails.

Build `follow-up-app` using pnpm; commit the generated `tester-site/follow-up-public` alongside source. The normal tester build copies that output after its existing onboarding substitutions. No other onboarding text or data schema is transformed.

Current mode: form testing only. `testSendingAvailable` is false in the frontend and `TESTER_FOLLOW_UP_ENABLED` is unset, so the button is disabled and the endpoint rejects sends without forwarding anything.

The shared receiver update was blocked by the safety reviewer pending explicit approval. Its two saved edits were reversed through the editor; the deployed receiver remains version 11. The local `FollowUp.gs` contains the proposed, unit-tested addition only. Do not deploy it without approval.

For full delivery testing after approval: deploy the additive tester-signature check in `FollowUp.gs` to the existing receiver; set `TESTER_FOLLOW_UP_ENABLED=true` on the tester project only; enable `testSendingAvailable` and rebuild. Submit a fictional response and inspect the test sheet, JSON and Google Doc. Do not call delivery verified until that readback passes. Keep the client production gate closed.
