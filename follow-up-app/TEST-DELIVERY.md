# Separate follow-up tester

This branch serves `/follow-up/` on the existing `sabi-career-partner-test` Netlify site. It uses the existing tester password and cookie. It does not change Bronagh's live site, password or access settings.

The frontend always submits `testMode: true` through `/api/test-follow-up-submit`; the backend independently rejects non-test requests and uses only the existing `TESTER_*` environment variables. The Apps Script receiver accepts the tester signing secret only for explicitly test-mode submissions. Test answers go to `TESTER_UPLOAD_FOLDER_ID` and the `Follow-up tests` sheet, without client notification emails.

Build `follow-up-app` using pnpm; commit the generated `tester-site/follow-up-public` alongside source. The normal tester build copies that output after its existing onboarding substitutions. No other onboarding text or data schema is transformed.

Current mode: connected tester. `testSendingAvailable` is true in the frontend and `TESTER_FOLLOW_UP_ENABLED=true` is set only for the tester project's Production deploy context. User explicitly approved setting this up like the onboarding test on 14 September 2026.

Published on 13 September 2026 from `13995acee6573e0ee25e69fdddc0afb59731189d`, Netlify deploy `6aa72821f5737700081fc25f`. Verified the live `/follow-up/` opens with the existing tester session and displays the device-local test notice. Password unchanged. No fictional or real submission was sent. TypeScript, Vite, four Node tests and browser checks at 320/390/768/1280 passed; local draft reload and disabled sending were verified.

After explicit approval, the two-line tester-signature extension was saved and published to the existing Apps Script deployment as version 12 on 14 September 2026 at 00:08 London. Existing execution owner, access settings, onboarding routes and client credentials were unchanged. Do not replace the live Code.gs with the older repository copy.

TypeScript, Vite build, all four Node tests and browser checks at 320/390/768/1280 passed for the connected build. Browser tests verify a failed send, frozen pending response, reload, identical retry and confirmed receipt using a mocked endpoint. Live fictional submission and Drive readback are still pending publication. Keep the client production gate closed.
