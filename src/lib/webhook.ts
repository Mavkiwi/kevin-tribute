// Kevin Tribute webhook - routes to n8n for Google Drive storage and database logging
// Using existing voice-idea webhook until dedicated kevin-tribute workflow is created
const WEBHOOK_URL = 'https://plex.app.n8n.cloud/webhook/voice-idea';

export type FileCategory = 'audio' | 'image';

export interface UploadMetadata {
  type: 'kevin_tribute';
  category: FileCategory;
  timestamp: string;
  file_name: string;
  file_type: string;
  file_size: number;
  contributor_name: string;
  department: string;
  message?: string;
}

export async function sendFileToWebhook(
  file: File,
  category: FileCategory,
  contributorName: string,
  department: string,
  message?: string
): Promise<void> {
  console.log('[Kevin Webhook] Sending file:', file.name, 'Category:', category);

  const metadata: UploadMetadata = {
    type: 'kevin_tribute',
    category,
    timestamp: new Date().toISOString(),
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    contributor_name: contributorName || 'Anonymous',
    department: department || 'Not specified',
    message: message || '',
  };

  const formData = new FormData();
  formData.append('attachment', file, file.name);
  formData.append('metadata', JSON.stringify(metadata));

  console.log('[Kevin Webhook] File metadata:', metadata);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    console.log('[Kevin Webhook] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.error('[Kevin Webhook] Error response:', text);
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log('[Kevin Webhook] File sent successfully!');
  } catch (error) {
    console.error('[Kevin Webhook] Fetch error:', error);
    throw error;
  }
}
