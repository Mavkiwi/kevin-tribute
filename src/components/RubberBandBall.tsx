import { useEffect, useRef } from 'react';

interface RubberBandBallProps {
  size?: number;
}

export function RubberBandBall({ size = 60 }: RubberBandBallProps) {
  const ballRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0, vx: 2, vy: 1.5 });

  useEffect(() => {
    const ball = ballRef.current;
    if (!ball) return;

    const parent = ball.parentElement;
    if (!parent) return;

    let animationId: number;

    const animate = () => {
      const pos = positionRef.current;
      const parentRect = parent.getBoundingClientRect();
      const maxX = parentRect.width - size;
      const maxY = parentRect.height - size;

      // Update position
      pos.x += pos.vx;
      pos.y += pos.vy;

      // Bounce off walls with slight randomness
      if (pos.x <= 0 || pos.x >= maxX) {
        pos.vx = -pos.vx * (0.95 + Math.random() * 0.1);
        pos.x = Math.max(0, Math.min(pos.x, maxX));
      }
      if (pos.y <= 0 || pos.y >= maxY) {
        pos.vy = -pos.vy * (0.95 + Math.random() * 0.1);
        pos.y = Math.max(0, Math.min(pos.y, maxY));
      }

      // Apply slight gravity
      pos.vy += 0.05;

      // Apply friction
      pos.vx *= 0.999;
      pos.vy *= 0.999;

      // Keep minimum velocity
      const minVelocity = 1;
      const velocity = Math.sqrt(pos.vx * pos.vx + pos.vy * pos.vy);
      if (velocity < minVelocity) {
        const scale = minVelocity / velocity;
        pos.vx *= scale;
        pos.vy *= scale;
      }

      ball.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${pos.x * 2}deg)`;

      animationId = requestAnimationFrame(animate);
    };

    // Start animation
    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [size]);

  return (
    <div
      ref={ballRef}
      className="absolute will-change-transform"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        {/* Base ball - dark grey */}
        <circle cx="50" cy="50" r="48" fill="#3d3d3d" />

        {/* Rubber bands - multicolored wrapping effect */}
        {/* Red bands */}
        <ellipse cx="50" cy="50" rx="46" ry="20" fill="none" stroke="#e53935" strokeWidth="3" transform="rotate(0 50 50)" />
        <ellipse cx="50" cy="50" rx="44" ry="18" fill="none" stroke="#e53935" strokeWidth="2" transform="rotate(60 50 50)" />
        <ellipse cx="50" cy="50" rx="42" ry="16" fill="none" stroke="#e53935" strokeWidth="2" transform="rotate(120 50 50)" />

        {/* Orange bands - OfficeMax color */}
        <ellipse cx="50" cy="50" rx="40" ry="22" fill="none" stroke="#f97316" strokeWidth="4" transform="rotate(30 50 50)" />
        <ellipse cx="50" cy="50" rx="38" ry="20" fill="none" stroke="#f97316" strokeWidth="3" transform="rotate(90 50 50)" />
        <ellipse cx="50" cy="50" rx="36" ry="18" fill="none" stroke="#f97316" strokeWidth="3" transform="rotate(150 50 50)" />

        {/* Yellow bands */}
        <ellipse cx="50" cy="50" rx="34" ry="14" fill="none" stroke="#fbbf24" strokeWidth="2" transform="rotate(15 50 50)" />
        <ellipse cx="50" cy="50" rx="32" ry="12" fill="none" stroke="#fbbf24" strokeWidth="2" transform="rotate(75 50 50)" />
        <ellipse cx="50" cy="50" rx="30" ry="10" fill="none" stroke="#fbbf24" strokeWidth="2" transform="rotate(135 50 50)" />

        {/* Green bands */}
        <ellipse cx="50" cy="50" rx="28" ry="16" fill="none" stroke="#22c55e" strokeWidth="2" transform="rotate(45 50 50)" />
        <ellipse cx="50" cy="50" rx="26" ry="14" fill="none" stroke="#22c55e" strokeWidth="2" transform="rotate(105 50 50)" />

        {/* Blue bands */}
        <ellipse cx="50" cy="50" rx="24" ry="12" fill="none" stroke="#3b82f6" strokeWidth="2" transform="rotate(-15 50 50)" />
        <ellipse cx="50" cy="50" rx="22" ry="10" fill="none" stroke="#3b82f6" strokeWidth="2" transform="rotate(165 50 50)" />

        {/* Purple bands */}
        <ellipse cx="50" cy="50" rx="20" ry="8" fill="none" stroke="#a855f7" strokeWidth="2" transform="rotate(-30 50 50)" />

        {/* Shine effect */}
        <ellipse cx="35" cy="35" rx="8" ry="12" fill="rgba(255,255,255,0.2)" transform="rotate(-45 35 35)" />
      </svg>
    </div>
  );
}
