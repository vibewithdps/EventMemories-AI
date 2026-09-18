#!/usr/bin/env python3
"""
One-Time Google Drive Authorization Script for Event Memories
Run this script once on your Mac to link your personal Google Drive account.
"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
CREDENTIALS_FILE = os.path.join(BASE_DIR, "credentials.json")
TOKEN_FILE = os.path.join(BASE_DIR, "token.json")
SCOPES = ["https://www.googleapis.com/auth/drive.file"]

def authenticate():
    print("=" * 60)
    print("  Event Memories — Google Drive One-Time Link Setup")
    print("=" * 60)

    if not os.path.exists(CREDENTIALS_FILE):
        print(f"[ERROR] '{CREDENTIALS_FILE}' not found.")
        sys.exit(1)

    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build
    except ImportError:
        print("[ERROR] Google libraries not installed. Please run: pip install -r requirements.txt")
        sys.exit(1)

    print("\n[1/3] Starting OAuth flow...")
    print("      Your default web browser will open in a moment.")
    print("      Please select your Google Account and click 'Continue' / 'Allow'.\n")

    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
    creds = flow.run_local_server(port=0)

    # Save credentials token
    with open(TOKEN_FILE, "w") as token:
        token.write(creds.to_json())
    print(f"\n[2/3] Authorization Token successfully saved to: {TOKEN_FILE}")

    # Test Drive connection
    try:
        service = build("drive", "v3", credentials=creds)
        user_info = service.about().get(fields="user(displayName, emailAddress)").execute()
        user_email = user_info.get("user", {}).get("emailAddress", "Unknown")
        user_name = user_info.get("user", {}).get("displayName", "Admin")

        print(f"[3/3] Connected to Google Drive as: {user_name} ({user_email})")
        print("\n" + "=" * 60)
        print("  SUCCESS: Google Drive Auto-Sync is now 100% active!")
        print("  All photos and videos uploaded by Admin will now")
        print("  automatically save into your personal Google Drive!")
        print("=" * 60 + "\n")
    except Exception as e:
        print(f"[WARNING] Token saved, but drive check encountered: {e}")

if __name__ == "__main__":
    authenticate()
