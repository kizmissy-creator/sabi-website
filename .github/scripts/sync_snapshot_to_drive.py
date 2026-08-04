import os
from pathlib import Path

import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload


folder_id = os.environ["GOOGLE_DRIVE_FOLDER_ID"]
snapshot_path = Path(os.environ.get("SNAPSHOT_PATH", "SABI_Website_Main.zip"))

if not snapshot_path.is_file():
    raise SystemExit(f"Snapshot was not created: {snapshot_path}")

credentials, _ = google.auth.default(
    scopes=["https://www.googleapis.com/auth/drive.file"]
)
drive = build("drive", "v3", credentials=credentials, cache_discovery=False)

escaped_name = snapshot_path.name.replace("'", "\\'")
query = (
    f"name = '{escaped_name}' and "
    f"'{folder_id}' in parents and trashed = false"
)
matches = (
    drive.files()
    .list(
        q=query,
        spaces="drive",
        fields="files(id,name)",
        pageSize=10,
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
    )
    .execute()
    .get("files", [])
)

media = MediaFileUpload(
    str(snapshot_path), mimetype="application/zip", resumable=True
)

if matches:
    file_id = matches[0]["id"]
    drive.files().update(
        fileId=file_id, media_body=media, supportsAllDrives=True
    ).execute()
    print(f"Updated Google Drive snapshot: {snapshot_path.name}")
else:
    metadata = {"name": snapshot_path.name, "parents": [folder_id]}
    drive.files().create(
        body=metadata,
        media_body=media,
        fields="id,name",
        supportsAllDrives=True,
    ).execute()
    print(f"Created Google Drive snapshot: {snapshot_path.name}")
