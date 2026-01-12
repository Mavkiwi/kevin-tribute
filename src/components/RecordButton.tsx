import { Mic, Square } from 'lucide-react';

interface RecordButtonProps {
  isRecording: boolean;
  onClick: () => void;
  glowClass: string;
  color: string;
  disabled?: boolean;
}

export function RecordButton({ isRecording, onClick, glowClass, color, disabled }: RecordButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-24 h-24 rounded-full
        flex items-center justify-center
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-4 focus:ring-white/20
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isRecording 
          ? 'bg-type-recording type-glow-recording animate-recording-pulse' 
          : `${glowClass} hover:scale-105 active:scale-95`
        }
      `}
      style={{ 
        backgroundColor: isRecording ? undefined : color,
      }}
    >
      {/* Inner glow ring */}
      <div 
        className={`
          absolute inset-2 rounded-full 
          transition-opacity duration-300
          ${isRecording ? 'opacity-0' : 'opacity-30'}
        `}
        style={{ 
          background: `radial-gradient(circle, white 0%, transparent 70%)` 
        }}
      />
      
      {/* Icon */}
      <div className="relative z-10">
        {isRecording ? (
          <Square className="w-8 h-8 text-white fill-white" />
        ) : (
          <Mic className="w-10 h-10 text-white" />
        )}
      </div>

      {/* Recording pulse rings */}
      {isRecording && (
        <>
          <div className="absolute inset-0 rounded-full bg-type-recording/30 animate-ping" />
          <div 
            className="absolute -inset-4 rounded-full border-2 border-type-recording/50 animate-pulse"
            style={{ animationDuration: '1s' }}
          />
        </>
      )}
    </button>
  );
}
