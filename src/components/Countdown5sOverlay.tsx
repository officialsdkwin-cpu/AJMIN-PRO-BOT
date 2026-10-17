import React from 'react';

interface Countdown5sOverlayProps {
  show: boolean;
  remainingSec: number;
}

const COUNTDOWN_IMAGE_URL = 'https://i.ibb.co.com/sv8Z7Vsy/file-00000000f99482118ec98aa573510810.jpg';

export const Countdown5sOverlay: React.FC<Countdown5sOverlayProps> = ({ show, remainingSec }) => {
  if (!show || remainingSec > 5 || remainingSec < 1) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none pointer-events-none">
      {/* Aurora Rays Behind */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="w-80 h-80 rounded-full bg-gradient-to-r from-red-600/30 via-pink-600/30 to-amber-500/30 blur-3xl animate-[auraPulse_1s_ease-in-out_infinite]" />
      </div>

      {/* Main 3D Countdown Container */}
      <div className="relative w-full max-w-[320px] flex flex-col items-center justify-center">
        {/* Glowing 3D Outer Ring */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl p-2 bg-gradient-to-tr from-[#ff0055] via-[#ffd66b] to-[#7928ca] shadow-[0_0_50px_rgba(255,0,85,0.7)] border-2 border-white/60 animate-[pulse_0.8s_ease-in-out_infinite]">
          {/* User's Exact 5-Second Image */}
          <div className="w-full h-full rounded-2xl overflow-hidden bg-black relative shadow-inner">
            <img
              src={COUNTDOWN_IMAGE_URL}
              alt="5s Countdown Alert"
              className="w-full h-full object-cover filter contrast-110"
              referrerPolicy="no-referrer"
            />

            {/* Dynamic Countdown Number Overlay right in the center / where the number is on the image */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[1px]">
              {/* Pulsing ring around the dynamic digit */}
              <div className="relative flex items-center justify-center">
                <span className="absolute w-24 h-24 rounded-full bg-[#ff0055]/40 animate-ping" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#ff0055] via-[#ff3b56] to-[#ffd66b] border-4 border-white shadow-[0_0_30px_#ff0055,inset_0_0_15px_#ffffff] flex items-center justify-center">
                  <span
                    key={remainingSec}
                    className="text-5xl font-black text-white font-mono drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] animate-[targetCelebration_0.35s_cubic-bezier(0.175,0.885,0.32,1.275)]"
                  >
                    {remainingSec}
                  </span>
                </div>
              </div>

              {/* Countdown Label */}
              <div className="mt-3 px-3 py-1 rounded-full bg-black/80 border border-yellow-400/80 text-yellow-300 text-xs font-black uppercase tracking-widest shadow-md">
                ⚡ লাস্ট {remainingSec} সেকেন্ড
              </div>
            </div>
          </div>
        </div>

        {/* Subtitle Alert */}
        <div className="mt-3 text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-black uppercase tracking-wider shadow-lg border border-white/40">
            মার্কেট রেজাল্ট কাউন্টডাউন চলছে...
          </span>
        </div>
      </div>
    </div>
  );
};
