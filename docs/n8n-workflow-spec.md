# Kevin Tribute - n8n Workflow Specification

## Overview
This document specifies the n8n workflow required to process uploads from the Kevin Tribute website.

## Webhook Configuration

### Endpoint
```
https://plex.app.n8n.cloud/webhook/kevin-tribute
```

### Request Format
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Fields:**
  - `attachment` - The uploaded file (audio or image)
  - `metadata` - JSON string containing upload details

### Metadata Schema
```json
{
  "type": "kevin_tribute",
  "category": "audio" | "image",
  "timestamp": "2026-01-12T10:30:00.000Z",
  "file_name": "recording.m4a",
  "file_type": "audio/mp4",
  "file_size": 1234567,
  "contributor_name": "Sarah Jones",
  "department": "Marketing",
  "message": "Optional written message"
}
```

## Workflow Steps

### 1. Webhook Trigger
- Receive POST request from website
- Parse multipart form data
- Extract file and metadata

### 2. Parse Metadata
- Extract JSON from metadata field
- Validate required fields:
  - `contributor_name` (required)
  - `category` (audio | image)
  - `file_name`

### 3. Create/Get Contributor Folder
- Base folder: `kevin/` (in Google Drive)
- Create subfolder for contributor: `kevin/{contributor_name}/`
- Sanitize folder name (remove special characters)

### 4. Upload File to Google Drive
- Target: `kevin/{contributor_name}/{file_name}`
- If duplicate, append timestamp to filename
- Get shareable link

### 5. Database Logging
Create record with:
```json
{
  "id": "uuid",
  "contributor_name": "string",
  "department": "string",
  "category": "audio|image",
  "file_name": "string",
  "file_type": "string",
  "file_size": "number",
  "message": "string",
  "google_drive_link": "string",
  "google_drive_file_id": "string",
  "uploaded_at": "timestamp",
  "transcription": "string (if audio)",
  "transcription_status": "pending|processing|complete|failed"
}
```

### 6. Audio Transcription (if category = audio)
- Send to transcription service (Whisper API or similar)
- Options:
  - OpenAI Whisper API
  - AssemblyAI
  - Google Speech-to-Text
- Store transcription result in database
- Update transcription_status

### 7. Response
Return success/failure to website:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file_id": "google_drive_file_id"
}
```

## Google Drive Structure

```
kevin/
├── Sarah Jones/
│   ├── recording-2026-01-12.m4a
│   ├── photo-team-event.jpg
│   └── ...
├── John Smith/
│   ├── story-about-kevin.mp3
│   └── christmas-party-2024.png
└── ...
```

## Database Schema (Airtable/Notion/Supabase)

### Table: kevin_tributes

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| contributor_name | Text | Person who submitted |
| department | Text | Their department/team |
| category | Select | audio/image |
| file_name | Text | Original filename |
| file_type | Text | MIME type |
| file_size | Number | Size in bytes |
| message | Long Text | Optional written message |
| google_drive_link | URL | Shareable link |
| google_drive_file_id | Text | GDrive file ID |
| uploaded_at | DateTime | When submitted |
| transcription | Long Text | Audio transcription |
| transcription_status | Select | pending/processing/complete/failed |
| reviewed | Checkbox | Has been reviewed |
| include_in_book | Checkbox | Include in final book |
| notes | Long Text | Internal notes |

## Error Handling

1. **Upload Failure**
   - Retry 3 times with exponential backoff
   - On final failure, send alert to admin
   - Return error to user with fallback email option

2. **Transcription Failure**
   - Mark as failed in database
   - Allow manual retry
   - Don't block user flow

3. **Invalid File Type**
   - Reject at webhook level
   - Return user-friendly error

## Monitoring

- Log all webhook calls
- Track success/failure rates
- Alert on consecutive failures
- Daily summary of submissions
