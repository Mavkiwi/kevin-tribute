# Kevin Tribute n8n Workflow Setup

## Workflow Overview

```
Webhook → Extract Metadata → Is Audio?
                               ├── YES → Upload to Drive → Transcribe (Whisper) → Log to Sheet
                               └── NO  → Upload to Drive → Log to Sheet (no transcription)
```

## Prerequisites

1. **Google Drive** folder created: `kevin/` (for contributor subfolders)
2. **Google Sheet** with columns:
   - Timestamp
   - Contributor
   - Department
   - Type
   - File Name
   - Message
   - Transcription
   - Drive Link

3. **n8n Credentials** configured:
   - Google Drive OAuth2
   - Google Sheets OAuth2
   - OpenAI API (for Whisper transcription)

---

## Step-by-Step Manual Setup

### 1. Webhook Trigger
- **Type**: Webhook
- **HTTP Method**: POST
- **Path**: `kevin-tribute`
- **Options**: Enable "Raw Body" to handle binary files

### 2. Extract Metadata (Code Node)
```javascript
// Parse the incoming webhook data
const items = $input.all();
const item = items[0];

// Get metadata from form fields
const metadata = {
  contributor_name: item.json.body?.contributor_name || item.json.contributor_name || 'Unknown',
  department: item.json.body?.department || item.json.department || '',
  message: item.json.body?.message || item.json.message || '',
  category: item.json.body?.category || item.json.category || 'audio',
  file_name: item.json.body?.file_name || item.json.file_name || 'upload',
  file_type: item.json.body?.file_type || item.json.file_type || '',
  timestamp: item.json.body?.timestamp || item.json.timestamp || new Date().toISOString(),
};

// Determine if this is audio or image
const isAudio = metadata.category === 'audio' ||
  metadata.file_type?.startsWith('audio/') ||
  metadata.file_name?.match(/\.(mp3|wav|m4a|webm|ogg|aac)$/i);

const isImage = metadata.category === 'image' ||
  metadata.file_type?.startsWith('image/') ||
  metadata.file_name?.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i);

return [{
  json: {
    ...metadata,
    isAudio,
    isImage,
    folderName: `kevin/${metadata.contributor_name.replace(/[^a-zA-Z0-9]/g, '_')}`,
    uploadTimestamp: new Date().toISOString()
  },
  binary: item.binary
}];
```

### 3. IF Node (Is Audio?)
- **Condition**: `{{ $json.isAudio }}` equals `true`
- **True branch** → Audio path
- **False branch** → Image path

### 4a. AUDIO PATH

#### Upload Audio to Drive
- **Operation**: Upload
- **File Name**: `{{ $('Extract Metadata').item.json.file_name }}`
- **Folder**: Your kevin/ parent folder ID
- **Binary Property**: `data`

#### Transcribe Audio (OpenAI)
- **Resource**: Audio
- **Operation**: Transcribe
- **Model**: whisper-1
- **Binary Property**: `data`
- **Language**: en

#### Log Audio to Sheet
- **Operation**: Append
- **Sheet**: Your Google Sheet
- **Columns**:
  - Timestamp: `{{ $('Extract Metadata').item.json.uploadTimestamp }}`
  - Contributor: `{{ $('Extract Metadata').item.json.contributor_name }}`
  - Department: `{{ $('Extract Metadata').item.json.department }}`
  - Type: `Audio`
  - File Name: `{{ $('Extract Metadata').item.json.file_name }}`
  - Message: `{{ $('Extract Metadata').item.json.message }}`
  - Transcription: `{{ $json.text }}`
  - Drive Link: `{{ $('Upload Audio to Drive').item.json.webViewLink }}`

### 4b. IMAGE PATH

#### Upload Image to Drive
- **Operation**: Upload
- **File Name**: `{{ $('Extract Metadata').item.json.file_name }}`
- **Folder**: Your kevin/ parent folder ID
- **Binary Property**: `data`

#### Log Image to Sheet
- **Operation**: Append
- **Sheet**: Your Google Sheet
- **Columns**:
  - Timestamp: `{{ $('Extract Metadata').item.json.uploadTimestamp }}`
  - Contributor: `{{ $('Extract Metadata').item.json.contributor_name }}`
  - Department: `{{ $('Extract Metadata').item.json.department }}`
  - Type: `Image`
  - File Name: `{{ $('Extract Metadata').item.json.file_name }}`
  - Message: `{{ $('Extract Metadata').item.json.message }}`
  - Transcription: *(empty)*
  - Drive Link: `{{ $('Upload Image to Drive').item.json.webViewLink }}`

---

## Webhook Endpoint

Your webhook URL: `https://plex.app.n8n.cloud/webhook/kevin-tribute`

## Data Sent from Web App

The web app sends multipart form data:
- `file` - Binary file (audio or image)
- `metadata` - JSON string containing:
  - `type`: "kevin_tribute"
  - `category`: "audio" or "image"
  - `timestamp`: ISO date string
  - `file_name`: Original filename
  - `file_type`: MIME type
  - `file_size`: Size in bytes
  - `contributor_name`: Person's name
  - `department`: Optional department
  - `message`: Optional message

---

## Folder Structure in Google Drive

```
kevin/
├── John_Smith/
│   ├── recording-2025-01-12.webm
│   ├── photo1.jpg
│   └── photo2.png
├── Jane_Doe/
│   └── message.mp3
└── Team_Sales/
    └── group-photo.jpg
```

## Testing

1. Go to https://kevin-tribute.pages.dev/
2. Record a test message or upload a file
3. Enter your name and click Submit
4. Check n8n execution logs
5. Verify file in Google Drive
6. Verify row in Google Sheet (with transcription for audio)
