import { Clock, Lightbulb, BookOpen, Users, Presentation, Settings, Folder, Trash2, CheckCircle, AlertCircle, Loader2, Clock3, Download } from 'lucide-react';
import { Recording, VOICE_TYPES, RecordingStatus } from '@/types/voice-capture';

const iconMap = {
  Lightbulb,
  BookOpen,
  Users,
  Presentation,
  Settings,
  Folder,
};

interface HistoryPanelProps {
  recordings: Recording[];
  onDelete: (id: string) => void;
  onDownload?: (id: string) => Promise<void>;
  onDeleteLocal?: (id: string) => Promise<void>;
}

function StatusIcon({ status }: { status: RecordingStatus }) {
  switch (status) {
    case 'pending':
      return <Clock3 className="w-4 h-4 text-muted-foreground" />;
    case 'processing':
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    case 'complete':
      return <CheckCircle className="w-4 h-4 text-type-coaching" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-type-recording" />;
  }
}

export function HistoryPanel({ recordings, onDelete, onDownload, onDeleteLocal }: HistoryPanelProps) {
  if (recordings.length === 0) {
    return (
      <div className="glass-card p-6 rounded-2xl text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm">No recordings yet</p>
        <p className="text-muted-foreground/60 text-xs mt-1">Your voice memos will appear here</p>
      </div>
    );
  }

  const handleDownload = async (id: string) => {
    if (onDownload) {
      try {
        await onDownload(id);
      } catch (err) {
        console.error('Download failed:', err);
      }
    }
  };

  const handleDelete = async (id: string) => {
    onDelete(id);
    if (onDeleteLocal) {
      try {
        await onDeleteLocal(id);
      } catch (err) {
        console.error('Local delete failed:', err);
      }
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="p-4 border-b border-border/30">
        <h2 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Recordings
        </h2>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {recordings.map((recording) => {
          const typeConfig = VOICE_TYPES.find(t => t.id === recording.type)!;
          const Icon = iconMap[typeConfig.icon as keyof typeof iconMap];
          const date = new Date(recording.timestamp);
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

          return (
            <div
              key={recording.id}
              className="flex items-center gap-3 p-3 border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors group"
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${typeConfig.hex}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: typeConfig.hex }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{typeConfig.label}</span>
                  <StatusIcon status={recording.status} />
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{dateStr} at {timeStr}</span>
                  <span>•</span>
                  <span>{Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}</span>
                </div>
                {recording.status === 'error' && recording.errorMessage && (
                  <p className="text-xs text-type-recording mt-1 truncate">{recording.errorMessage}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {onDownload && (
                  <button
                    onClick={() => handleDownload(recording.id)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                    title="Download recording"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(recording.id)}
                  className="p-2 text-muted-foreground hover:text-type-recording transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete recording"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
