# For Kevin - OfficeMax Retirement Tribute

A web application for collecting stories, memories, and photos to create a special coffee-table book celebrating Kevin's retirement from OfficeMax.

## Features

- **Voice Recording Upload** - Upload audio recordings of stories and memories
- **Photo Upload** - Share photos from team events, celebrations, etc.
- **Per-Person Folders** - Automatically organized in Google Drive by contributor
- **Transcription Support** - Audio files transcribed for easy editing
- **Database Logging** - All submissions tracked with metadata
- **OfficeMax Branding** - Rubber band ball animation and orange theme

## Tech Stack

- **Frontend:** Vite + React + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** n8n workflow automation
- **Storage:** Google Drive
- **Database:** Airtable/Notion/Supabase (configurable)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/kevin-tribute.git

# Navigate to project directory
cd kevin-tribute

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## Configuration

### Webhook URL
Update the webhook URL in `src/lib/webhook.ts`:
```typescript
const WEBHOOK_URL = 'https://plex.app.n8n.cloud/webhook/kevin-tribute';
```

### n8n Workflow
See `docs/n8n-workflow-spec.md` for the complete n8n workflow specification.

## Google Drive Structure

```
kevin/
├── {Contributor Name}/
│   ├── audio files
│   └── image files
└── ...
```

## Deployment

The project can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting

### Vercel Deployment
```bash
npm install -g vercel
vercel
```

## Powered by Plex

This tribute page was built by the Plex team for OfficeMax.

---

For questions or support, contact jeff@plex.nz
