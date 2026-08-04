# Google Drive snapshot setup

This repository contains a GitHub Actions workflow that creates
`SABI_Website_Main.zip` after each push to `main` and replaces the matching
file in the dedicated Google Drive folder.

## Drive destination

- Folder: `SABI GitHub Snapshots`
- Folder ID: `1gPQZMUPJ4K8iPUhxC9GzXXuA_VQnKIHr`
- URL: <https://drive.google.com/drive/folders/1gPQZMUPJ4K8iPUhxC9GzXXuA_VQnKIHr>

## Required GitHub configuration

The workflow expects:

- Repository secret `GOOGLE_DRIVE_CREDENTIALS`: the complete JSON credential
  for a restricted Google service account.
- Repository variable `GOOGLE_DRIVE_FOLDER_ID`:
  `1gPQZMUPJ4K8iPUhxC9GzXXuA_VQnKIHr`

The Drive folder must be shared as **Editor** with the service account email.
Do not commit the JSON credential to the repository or paste it into issues,
pull requests, workflow files, or logs.

## Behaviour

- Runs automatically after a push to `main`.
- Can also be started manually from the Actions tab.
- Creates the snapshot on the first successful run.
- Replaces the existing snapshot on later runs.
- Does not copy changes from Drive back into GitHub.
