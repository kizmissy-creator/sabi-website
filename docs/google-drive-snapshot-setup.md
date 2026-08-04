# Google Drive snapshot setup

This repository contains a GitHub Actions workflow that creates
`SABI_Website_Main.zip` after each push to `main` and replaces the matching
file in the dedicated Google Drive folder.

## Drive destination

- Folder: `SABI GitHub Snapshots`
- Folder ID: `1gPQZMUPJ4K8iPUhxC9GzXXuA_VQnKIHr`
- URL: <https://drive.google.com/drive/folders/1gPQZMUPJ4K8iPUhxC9GzXXuA_VQnKIHr>

## Authentication

The workflow uses short-lived GitHub OpenID Connect credentials through Google
Cloud Workload Identity Federation. It does not use a downloaded service-account
key or a GitHub credential secret.

- Google Cloud project number: `140178503272`
- Workload Identity Pool: `github`
- Workload Identity Provider: `sabi-website`
- Service account:
  `sabi-github-drive-sync@ninth-wares-504519-g1.iam.gserviceaccount.com`
- Allowed GitHub repository: `kizmissy-creator/sabi-website`

The Drive folder must be shared as **Editor** with the service account email.
The provider must restrict access to the named repository, and the service
account must grant Workload Identity User only to that repository principal.

## Behaviour

- Runs automatically after a push to `main`.
- Can also be started manually from the Actions tab.
- Creates the snapshot on the first successful run.
- Replaces the existing snapshot on later runs.
- Does not copy changes from Drive back into GitHub.
