import { PlexLogo } from './PlexLogo';

export function Header() {
  return (
    <header className="text-center py-6 animate-fade-in">
      <div className="flex items-center justify-center gap-3 mb-2">
        <PlexLogo className="w-10 h-10" />
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">
          Plex
        </h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Coaching and Audio Processing
      </p>
    </header>
  );
}
