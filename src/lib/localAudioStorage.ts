// Local audio storage utility for saving recordings as backup

export async function saveAudioLocally(
  audioBlob: Blob, 
  recordingId: string, 
  type: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `plex-${type}-${timestamp}.webm`;
  
  // Create a download link and trigger it
  const url = URL.createObjectURL(audioBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Clean up the URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  
  console.log('[LocalStorage] Saved audio as:', filename);
  return filename;
}

// Store audio blob in IndexedDB for persistent local backup
const DB_NAME = 'PlexAudioBackup';
const STORE_NAME = 'recordings';

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export interface StoredRecording {
  id: string;
  type: string;
  timestamp: string;
  duration: number;
  audioBlob: Blob;
  filename: string;
}

export async function storeAudioInDB(recording: StoredRecording): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(recording);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log('[LocalStorage] Stored in IndexedDB:', recording.id);
      resolve();
    };
  });
}

export async function getStoredRecordings(): Promise<StoredRecording[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function deleteStoredRecording(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function downloadStoredRecording(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const recording = request.result as StoredRecording;
      if (recording) {
        const url = URL.createObjectURL(recording.audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = recording.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      resolve();
    };
  });
}
