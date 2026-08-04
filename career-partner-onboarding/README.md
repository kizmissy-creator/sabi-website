# SABI Career Partner onboarding prototype

An isolated front-end prototype for Brona’s Career Partner onboarding experience.

## Run locally

```sh
pnpm install
pnpm dev
```

Create a production build with:

```sh
pnpm build
```

## Prototype scope

- React, TypeScript and Tailwind CSS
- Local component state only
- “Save and return later” stores the five example answers in the current browser’s `localStorage`
- No account, payment, database, email, upload or analytics integration
- No changes to the existing SABI website repository

## Future integration

Before this becomes a live onboarding flow, the navigation, secure server-side saving,
privacy information, document uploads, payment confirmation and remaining steps will
need to be designed and implemented.
