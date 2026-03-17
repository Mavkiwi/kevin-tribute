import { Clock } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-orange-950/20 to-slate-900 flex flex-col items-center justify-center px-4">
      {/* OfficeMax Rubber Band Ball */}
      <img
        src="/officemaxball.jpeg"
        alt="OfficeMax Rubber Band Ball"
        className="w-24 h-24 object-contain drop-shadow-lg mb-8"
      />

      {/* Kevin Photo */}
      <img src="/kevin.png" alt="Kevin" className="w-24 h-24 rounded-full object-cover mb-6" />

      <h1 className="text-3xl font-semibold text-white mb-2">For Kevin</h1>
      <p className="text-slate-300 text-lg mb-8">Celebrating a Legend's Retirement</p>

      {/* Maintenance Card */}
      <div className="bg-slate-800/50 border border-orange-900/50 rounded-xl p-8 max-w-md text-center">
        <Clock className="w-12 h-12 text-orange-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-3">Back Shortly</h2>
        <p className="text-slate-300 mb-4">
          We're making a few improvements to ensure your recordings and photos are saved perfectly.
        </p>
        <p className="text-orange-400 font-medium mb-4">
          Please check back in about an hour.
        </p>
        <p className="text-slate-400 text-sm">
          In the meantime, you can email your files directly to{' '}
          <a href="mailto:jeff@plex.nz" className="text-orange-400 hover:underline">
            jeff@plex.nz
          </a>
        </p>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 space-y-2">
        <p className="text-slate-500 text-sm">For Kevin - Celebrating Your OfficeMax Journey</p>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span>Powered by Plex</span>
        </div>
      </div>
    </div>
  );
}
