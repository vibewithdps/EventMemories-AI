import os
import mimetypes
from pathlib import Path
from typing import Optional, Any

# Google API libraries
try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    GOOGLE_LIBS_AVAILABLE = True
except ImportError:
    GOOGLE_LIBS_AVAILABLE = False

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CREDENTIALS_FILE = os.path.join(BASE_DIR, "credentials.json")
TOKEN_FILE = os.path.join(BASE_DIR, "token.json")
SCOPES = ["https://www.googleapis.com/auth/drive.file"]

class GoogleDriveService:
    def __init__(self):
        self.service = None
        self.root_folder_name = "Event Memories 2026"
        self.root_folder_id = None
        self._init_service()

    def _init_service(self):
        if not GOOGLE_LIBS_AVAILABLE:
            print("[GDRIVE] Google API client libraries not yet installed.")
            return

        creds = None
        # Support cloud environment variable for Google Drive token
        env_token = os.environ.get("GDRIVE_TOKEN_JSON")
        if not os.path.exists(TOKEN_FILE) and env_token:
            try:
                with open(TOKEN_FILE, "w") as token_out:
                    token_out.write(env_token)
            except Exception as e:
                print(f"[GDRIVE] Error writing GDRIVE_TOKEN_JSON to file: {e}")

        if os.path.exists(TOKEN_FILE):
            try:
                creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
            except Exception as e:
                print(f"[GDRIVE] Error loading token file: {e}")

        # Refresh token if expired
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                with open(TOKEN_FILE, "w") as token:
                    token.write(creds.to_json())
            except Exception as e:
                print(f"[GDRIVE] Error refreshing credentials: {e}")
                creds = None

        if creds and creds.valid:
            try:
                self.service = build("drive", "v3", credentials=creds)
                print("[GDRIVE] Google Drive service connected successfully!")
            except Exception as e:
                print(f"[GDRIVE] Error building Drive service: {e}")
                self.service = None

    def is_connected(self) -> bool:
        return self.service is not None

    def get_or_create_folder(self, folder_name: str, parent_id: Optional[str] = None) -> Optional[str]:
        if not self.is_connected():
            return None

        try:
            query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
            if parent_id:
                query += f" and '{parent_id}' in parents"
            else:
                query += " and 'root' in parents"

            results = self.service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
            files = results.get('files', [])

            if files:
                return files[0]['id']

            # Create folder if it doesn't exist
            folder_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            if parent_id:
                folder_metadata['parents'] = [parent_id]

            folder = self.service.files().create(body=folder_metadata, fields='id').execute()
            return folder.get('id')
        except Exception as e:
            print(f"[GDRIVE] Failed to get/create folder '{folder_name}': {e}")
            return None

    def upload_media_file(
        self,
        local_file_path: str,
        original_name: str,
        event_tag: str = "General"
    ) -> dict[str, Any]:
        """
        Uploads a local photo/video to the user's personal Google Drive folder.
        Organizes files by ritual sub-folders (e.g. 'Event Memories 2026 / Sangeet & Dance').
        """
        if not self.is_connected():
            return {"success": False, "message": "Google Drive is not connected."}

        if not os.path.exists(local_file_path):
            return {"success": False, "message": f"File '{local_file_path}' not found."}

        try:
            # 1. Get or create root folder
            if not self.root_folder_id:
                self.root_folder_id = self.get_or_create_folder(self.root_folder_name)

            # 2. Get or create ritual subfolder
            target_folder_id = self.root_folder_id
            if event_tag and event_tag != "General":
                subfolder_id = self.get_or_create_folder(event_tag, parent_id=self.root_folder_id)
                if subfolder_id:
                    target_folder_id = subfolder_id

            # 3. Detect MIME type
            mime_type, _ = mimetypes.guess_type(local_file_path)
            if not mime_type:
                mime_type = "image/jpeg" if local_file_path.endswith((".jpg", ".jpeg")) else "video/mp4"

            # 4. Upload file
            file_metadata = {
                'name': original_name,
                'parents': [target_folder_id] if target_folder_id else []
            }
            media = MediaFileUpload(local_file_path, mimetype=mime_type, resumable=True)
            uploaded_file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webViewLink, webContentLink'
            ).execute()

            drive_id = uploaded_file.get('id')
            view_link = uploaded_file.get('webViewLink')

            print(f"[GDRIVE] Uploaded '{original_name}' -> Drive ID: {drive_id}")
            return {
                "success": True,
                "drive_file_id": drive_id,
                "drive_view_link": view_link,
                "folder_name": event_tag
            }
        except Exception as e:
            print(f"[GDRIVE] Error uploading file '{original_name}' to Google Drive: {e}")
            return {"success": False, "error": str(e)}

gdrive_service = GoogleDriveService()
