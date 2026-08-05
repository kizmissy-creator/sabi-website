# SABI Career Support onboarding development shell

An isolated, framework-driven front-end development form for SABI Career Support.

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
- Local development saving in the current browser only
- Shared intake sections and service-specific branches for all five paid launch services
- Simulated uploads, scope flags, review, contractual controls and disabled checkout
- Draft Service Schedule preview and separately versioned development control records
- No account, payment, database, email, upload or analytics integration
- No changes to the existing SABI website repository

## Future integration

Before this becomes a live onboarding flow, the navigation, secure server-side saving,
privacy information, document uploads, payment confirmation and remaining steps will
need to be designed and implemented.

See `BACKEND-READINESS.md` for the minimum records, security boundaries and launch gates.
Run `powershell -ExecutionPolicy Bypass -File scripts/validate-development-shell.ps1`
to repeat the local integration-safety checks without installing dependencies.
