// Kevin Tribute webhook - routes to n8n for Google Drive storage and transcription
const WEBHOOK_URL = 'https://plex.app.n8n.cloud/webhook/kevin-tribute';

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
  // Chunk support for big files
  chunk_index?: number;
  total_chunks?: number;
  recording_id?: string;
}

export interface UploadResult {
  success: boolean;
  message: string;
  chunked: boolean;
  chunksSent: number;
}

/**
 * Send a single file to the n8n webhook.
 * The webhook now responds immediately (200) and processes async.
 */
export async function sendFileToWebhook(
  file: File,
  category: FileCategory,
  contributorName: string,
  department: string,
  message?: string,
  chunkMeta?: { chunk_index: number; total_chunks: number; recording_id: string }
): Promise<void> {
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
    ...(chunkMeta || {}),
  };

  const formData = new FormData();
  formData.append('attachment', file, file.name);
  formData.append('metadata', JSON.stringify(metadata));

  console.log('[Kevin Webhook] Sending file:', file.name, 'Size:', formatBytes(file.size), 'Category:', category);
  if (chunkMeta) {
    console.log('[Kevin Webhook] Chunk', chunkMeta.chunk_index + 1, 'of', chunkMeta.total_chunks);
  }

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    body: formData,
  });

  console.log('[Kevin Webhook] Response:', response.status, response.statusText);

  if (!response.ok) {
    const text = await response.text().catch(() => 'No response body');
    console.error('[Kevin Webhook] Error response:', text);
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }

  console.log('[Kevin Webhook] File sent successfully!');
}

/**
 * Send multiple chunk files from a compressed recording.
 * Each chunk is sent sequentially to avoid overwhelming the webhook.
 */
export async function sendChunkedFiles(
  files: File[],
  category: FileCategory,
  contributorName: string,
  department: string,
  message: string | undefined,
  recordingId: string,
  onChunkSent?: (chunkIndex: number, totalChunks: number) => void
): Promise<UploadResult> {
  const totalChunks = files.length;

  for (let i = 0; i < files.length; i++) {
    await sendFileToWebhook(files[i], category, contributorName, department, message, {
      chunk_index: i,
      total_chunks: totalChunks,
      recording_id: recordingId,
    });
    onChunkSent?.(i, totalChunks);
  }

  return {
    success: true,
    message: `All ${totalChunks} chunks uploaded successfully`,
    chunked: totalChunks > 1,
    chunksSent: totalChunks,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
