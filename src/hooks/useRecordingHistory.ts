import { useState, useEffect, useCallback } from 'react';
import { Recording } from '@/types/voice-capture';

const STORAGE_KEY = 'jeffs-crazy-ideas-history';

export function useRecordingHistory() {
  const [recordings, setRecordings] = useState<Recording[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Don't restore audio blobs from localStorage (they're too large)
        setRecordings(parsed.map((r: Recording) => ({ ...r, audioBlob: undefined })));
      } catch (e) {
        console.error('Failed to parse recording history:', e);
      }
    }
  }, []);

  // Save to localStorage whenever recordings change
  useEffect(() => {
    const toStore = recordings.map(({ audioBlob, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [recordings]);

  const addRecording = useCallback((recording: Recording) => {
    setRecordings(prev => [recording, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  const updateRecording = useCallback((id: string, updates: Partial<Recording>) => {
    setRecordings(prev => 
      prev.map(r => r.id === id ? { ...r, ...updates } : r)
    );
  }, []);

  const deleteRecording = useCallback((id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
  }, []);

  return {
    recordings,
    addRecording,
    updateRecording,
    deleteRecording
  };
}
