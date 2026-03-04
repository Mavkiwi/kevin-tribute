// Audio compression for big files - downsample and split for Whisper API (25MB limit)

const WHISPER_LIMIT = 24 * 1024 * 1024; // 24MB (leave 1MB headroom)
const CHUNK_DURATION_SEC = 600; // 10 minutes per chunk
const TARGET_SAMPLE_RATE = 16000; // 16kHz mono - optimal for speech

export interface CompressionResult {
  files: File[];
  wasCompressed: boolean;
  originalSize: number;
  totalCompressedSize: number;
  chunkCount: number;
  recordingId: string;
}

export interface CompressionProgress {
  stage: 'decoding' | 'processing' | 'encoding' | 'complete';
  percent: number;
  message: string;
}

/**
 * Compress and optionally split an audio file to fit within Whisper's 25MB limit.
 *
 * Strategy:
 * 1. Decode the audio to raw PCM
 * 2. Downsample to mono 16kHz (optimal for speech recognition)
 * 3. Encode as WAV
 * 4. If still > 24MB, split into 10-minute chunks
 */
export async function compressAudioForTranscription(
  file: File,
  onProgress?: (progress: CompressionProgress) => void
): Promise<CompressionResult> {
  const recordingId = crypto.randomUUID();

  // If file is already small enough, return as-is
  if (file.size <= WHISPER_LIMIT) {
    return {
      files: [file],
      wasCompressed: false,
      originalSize: file.size,
      totalCompressedSize: file.size,
      chunkCount: 1,
      recordingId,
    };
  }

  onProgress?.({ stage: 'decoding', percent: 10, message: 'Decoding audio...' });

  // Decode the audio file
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  await audioContext.close();

  const totalDuration = audioBuffer.duration;

  onProgress?.({ stage: 'processing', percent: 30, message: 'Compressing audio...' });

  // Calculate how many chunks we need
  // At 16kHz mono 16-bit WAV: 16000 * 2 * duration bytes + 44 byte header
  const estimatedFullSize = TARGET_SAMPLE_RATE * 2 * totalDuration + 44;
  const needsSplitting = estimatedFullSize > WHISPER_LIMIT;
  const chunkDuration = needsSplitting ? CHUNK_DURATION_SEC : totalDuration;
  const totalChunks = needsSplitting ? Math.ceil(totalDuration / chunkDuration) : 1;

  const files: File[] = [];
  const baseName = file.name.replace(/\.[^.]+$/, '');

  for (let i = 0; i < totalChunks; i++) {
    const startTime = i * chunkDuration;
    const endTime = Math.min(startTime + chunkDuration, totalDuration);
    const duration = endTime - startTime;

    const progressPercent = 30 + Math.round((i / totalChunks) * 60);
    onProgress?.({
      stage: 'encoding',
      percent: progressPercent,
      message: totalChunks > 1
        ? `Processing chunk ${i + 1} of ${totalChunks}...`
        : 'Downsampling audio...',
    });

    // Use OfflineAudioContext to downsample this chunk
    const chunkSamples = Math.ceil(duration * TARGET_SAMPLE_RATE);
    const offlineCtx = new OfflineAudioContext(1, chunkSamples, TARGET_SAMPLE_RATE);

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0, startTime, duration);

    const renderedBuffer = await offlineCtx.startRendering();

    // Encode to WAV
    const wavBlob = encodeWAV(renderedBuffer);

    const chunkName = totalChunks > 1
      ? `${baseName}-part${i + 1}.wav`
      : `${baseName}-compressed.wav`;

    files.push(new File([wavBlob], chunkName, { type: 'audio/wav' }));
  }

  const totalCompressedSize = files.reduce((sum, f) => sum + f.size, 0);

  onProgress?.({ stage: 'complete', percent: 100, message: 'Compression complete!' });

  return {
    files,
    wasCompressed: true,
    originalSize: file.size,
    totalCompressedSize,
    chunkCount: totalChunks,
    recordingId,
  };
}

/**
 * Encode an AudioBuffer as a WAV file (PCM 16-bit).
 */
function encodeWAV(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;
  const bytesPerSample = 2; // 16-bit
  const dataSize = numSamples * numChannels * bytesPerSample;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
  view.setUint16(32, numChannels * bytesPerSample, true); // block align
  view.setUint16(34, bytesPerSample * 8, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  const channelData = audioBuffer.getChannelData(0); // mono
  let offset = headerSize;
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += bytesPerSample;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Check if a file needs compression for Whisper transcription.
 */
export function needsCompression(file: File): boolean {
  return file.size > WHISPER_LIMIT;
}

/**
 * Format file size for display.
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
