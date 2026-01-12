import { AudioWaveform } from 'lucide-react';

export function PlexLogo({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Base icon */}
      <AudioWaveform className="w-full h-full text-primary" />
      
      {/* Animated spark overlay */}
      <svg 
        viewBox="0 0 24 24" 
        className="absolute inset-0 w-full h-full pointer-events-none"
        fill="none"
      >
        <defs>
          <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Animated spark that follows the waveform shape */}
        <circle r="2" fill="url(#sparkGradient)" filter="url(#glow)">
          <animateMotion
            dur="1.8s"
            repeatCount="indefinite"
            path="M2 12 L6 12 L6 8 L10 8 L10 16 L14 16 L14 6 L18 6 L18 18 L22 18 L22 12"
            keyPoints="0;1;0"
            keyTimes="0;0.5;1"
            calcMode="spline"
            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
          />
        </circle>

        {/* Spark glow trail */}
        <circle r="4" fill="url(#sparkGradient)" opacity="0.4">
          <animateMotion
            dur="1.8s"
            repeatCount="indefinite"
            path="M2 12 L6 12 L6 8 L10 8 L10 16 L14 16 L14 6 L18 6 L18 18 L22 18 L22 12"
            keyPoints="0;1;0"
            keyTimes="0;0.5;1"
            calcMode="spline"
            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
          />
        </circle>
      </svg>
    </div>
  );
}
