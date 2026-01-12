import { AlertTriangle } from 'lucide-react';

interface DurationTimerProps {
  duration: number;
  isRecording: boolean;
}

const MAX_DURATION = 300; // 5 minutes

export function DurationTimer({ duration, isRecording }: DurationTimerProps) {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const isWarning = duration >= MAX_DURATION - 30;
  const isMaxed = duration >= MAX_DURATION;

  const formatTime = (m: number, s: number) => {
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center space-y-1">
      <div 
        className={`text-2xl font-mono font-bold transition-colors ${
          isMaxed ? 'text-type-recording animate-pulse' : 
          isWarning ? 'text-primary' : 
          'text-foreground'
        }`}
      >
        {formatTime(minutes, seconds)}
      </div>
      {isRecording && isWarning && !isMaxed && (
        <div className="flex items-center justify-center gap-1 text-primary text-xs">
          <AlertTriangle className="w-3 h-3" />
          <span>Approaching 5 min limit</span>
        </div>
      )}
      {isRecording && isMaxed && (
        <div className="flex items-center justify-center gap-1 text-type-recording text-xs">
          <AlertTriangle className="w-3 h-3" />
          <span>Max duration reached</span>
        </div>
      )}
    </div>
  );
}
