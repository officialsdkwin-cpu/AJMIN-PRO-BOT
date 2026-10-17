import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Trophy, Flame, X, Volume2, Star, AlertTriangle, ShieldAlert } from 'lucide-react';
import { SizeType } from '../types';

interface ResultModalProps {
  show: boolean;
  type: 'win' | 'loss';
  onClose: () => void;
  period: string;
  sizeSignal: SizeType;
  colorSignal: 'Green' | 'Red';
  actualNumber?: number;
  actualSize?: SizeType;
  actualColor?: string;
  winStreak: number;
  lossStep?: number;
  consecutiveLosses?: number;
  isDoubleWin?: boolean;
}

const WIN_IMAGE_URL = 'https://i.ibb.co.com/q3STb50p/file-0000000081bc8211af775bd357aa7604.png';
const LOSS_IMAGE_URL = 'https://i.ibb.co.com/JRkJxGSc/file-00000000ff3882118df2415366003514.jpg';

export const WinCelebrationModal: React.FC<ResultModalProps> = ({
  show,
  type,
  onClose,
  period,
  sizeSignal,
  colorSignal,
  actualNumber,
  actualSize,
  actualColor,
  winStreak,
  lossStep = 1,
  consecutiveLosses = 0,
  isDoubleWin = false
}) => {
  const [countdownSec, setCountdownSec] = useState<number>(3);
  const onCloseRef = useRef(onClose);

  // Keep onClose reference fresh without triggering effect re-runs
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Timestamp-based 3-second auto-close: immune to parent component re-renders
  useEffect(() => {
    if (!show) {
      setCountdownSec(3);
      return;
    }

    setCountdownSec(3);
    const startTime = Date.now();
    const durationMs = 3000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingMs = durationMs - elapsed;
      const secLeft = Math.max(0, Math.ceil(remainingMs / 1000));
      setCountdownSec(secLeft);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        if (onCloseRef.current) {
          onCloseRef.current();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [show]);

  useEffect(() => {
    if (!show || type !== 'win') return;

    // Confetti effect for win
    const pieces: HTMLElement[] = [];
    for (let i = 0; i < 48; i++) {
      const piece = document.createElement('i');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = ['#ff3366', '#00e676', '#ba38ca', '#ffd700', '#00f2fe', '#ff007f'][i % 6];
      piece.style.animationDelay = Math.random() * 0.6 + 's';
      piece.style.transform = 'rotate(' + Math.floor(Math.random() * 360) + 'deg)';
      document.body.appendChild(piece);
      pieces.push(piece);
    }

    const timer = setTimeout(() => {
      pieces.forEach((p) => p.remove());
    }, 2800);

    return () => {
      clearTimeout(timer);
      pieces.forEach((p) => p.remove());
    };
  }, [show, type]);

  if (!show) return null;

  const isWin = type === 'win';
  const displayImage = isWin ? WIN_IMAGE_URL : LOSS_IMAGE_URL;

  // Determining ball color
  const ballBg =
    actualNumber === 0 || actualNumber === 5
      ? '#b5179e'
      : (actualNumber ?? 0) % 2 === 0
      ? '#ff385c'
      : '#00e676';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn select-none overflow-y-auto">
      {/* Background Lighting */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {isWin ? (
          <>
            <div className="w-[500px] h-[500px] bg-gradient-to-tr from-[#ff3366]/25 via-[#ba38ca]/30 to-[#00f2fe]/25 rounded-full blur-[90px] animate-[auraPulse_3s_ease-in-out_infinite]" />
            <div className="absolute w-[600px] h-[600px] bg-[conic-gradient(from_0deg,#ff007f,#7928ca,#00f2fe,#ffb300,#ff007f)] opacity-20 blur-3xl animate-[spin_16s_linear_infinite]" />
          </>
        ) : (
          <div className="w-[500px] h-[500px] bg-gradient-to-tr from-[#ff0055]/30 via-[#7928ca]/20 to-[#ff3366]/25 rounded-full blur-[90px] animate-[auraPulse_2.5s_ease-in-out_infinite]" />
        )}
      </div>

      {/* Main 3D Modal Wrapper */}
      <div 
        className="relative w-full max-w-sm flex flex-col items-center justify-center z-10 my-auto"
        style={{ perspective: '1200px' }}
      >
        {/* 3D Butterfly Wings Behind Card for Win */}
        {isWin && (
          <div className="absolute -top-14 inset-x-0 h-44 flex items-center justify-center pointer-events-none butterfly-container">
            {/* Left Wing */}
            <div 
              className="w-36 sm:w-44 h-36 sm:h-44 wing-left relative"
              style={{
                background: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.95) 0%, rgba(0,242,254,0.7) 30%, rgba(255,51,102,0.85) 70%, rgba(121,40,202,0.95) 100%)',
                clipPath: 'polygon(100% 50%, 65% 5%, 15% 0%, 0% 35%, 15% 75%, 0% 95%, 45% 100%, 75% 70%)',
                filter: 'drop-shadow(0 0 25px rgba(0,242,254,0.85)) drop-shadow(0 0 45px rgba(255,51,102,0.7))',
                transformStyle: 'preserve-3d'
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.7)_50%,transparent_60%)] animate-[shineSweep_1.5s_ease-in-out_infinite]" />
            </div>

            {/* Glowing Butterfly Center Crystal */}
            <div className="relative z-20 w-5 h-20 rounded-full bg-gradient-to-b from-yellow-300 via-white to-pink-500 shadow-[0_0_25px_#ff007f,0_0_40px_#00f2fe] border border-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white animate-spin" />
            </div>

            {/* Right Wing */}
            <div 
              className="w-36 sm:w-44 h-36 sm:h-44 wing-right relative"
              style={{
                background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.95) 0%, rgba(0,242,254,0.7) 30%, rgba(255,51,102,0.85) 70%, rgba(121,40,202,0.95) 100%)',
                clipPath: 'polygon(0% 50%, 35% 5%, 85% 0%, 100% 35%, 85% 75%, 100% 95%, 55% 100%, 25% 70%)',
                filter: 'drop-shadow(0 0 25px rgba(0,242,254,0.85)) drop-shadow(0 0 45px rgba(255,51,102,0.7))',
                transformStyle: 'preserve-3d'
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(225deg,transparent_40%,rgba(255,255,255,0.7)_50%,transparent_60%)] animate-[shineSweep_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* 3D Holographic Results Card with User's Image */}
        <div className={`w-full bg-gradient-to-b from-[#1c0830]/95 via-[#110420]/95 to-[#07010f] border-2 ${
          isWin
            ? 'border-pink-400/80 shadow-[0_0_60px_rgba(255,0,127,0.45),inset_0_0_30px_rgba(0,242,254,0.2)]'
            : 'border-red-500/80 shadow-[0_0_60px_rgba(255,0,85,0.45),inset_0_0_30px_rgba(255,0,0,0.2)]'
        } rounded-3xl p-4 sm:p-5 text-white text-center relative ${isWin ? 'mt-8' : 'mt-2'} backdrop-blur-xl animate-fadeIn`}>
          
          {/* Close Icon */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 transition-colors cursor-pointer z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* USER'S EXACT WIN / LOSS IMAGE WITH DIRECT TEXT LABELS */}
          <div className="relative mx-auto mt-1 mb-2 flex justify-center items-center">
            <div className={`relative w-44 sm:w-48 rounded-2xl p-1 bg-gradient-to-tr ${
              isWin
                ? 'from-[#ff3366] via-[#ffd66b] to-[#7928ca] shadow-[0_0_35px_rgba(255,51,102,0.6)]'
                : 'from-[#ff0055] via-[#ff4d4d] to-[#7928ca] shadow-[0_0_35px_rgba(255,0,85,0.6)]'
            }`}>
              <div className="w-full rounded-xl overflow-hidden bg-black/70 border border-white/60 relative">
                <img
                  src={displayImage}
                  alt={isWin ? 'Win Celebration Logo' : 'Loss Notice Logo'}
                  className="w-full h-auto max-h-36 object-contain filter contrast-110 drop-shadow-md mx-auto"
                  referrerPolicy="no-referrer"
                />

                {/* Overlaid Banner directly in the image */}
                <div className="absolute bottom-0 inset-x-0 bg-black/85 backdrop-blur-sm py-1 px-2 border-t border-white/30 flex items-center justify-between text-[11px] font-black font-mono">
                  <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                    {isWin ? '✅ প্রফিট নিশ্চিত' : `❌ ${lossStep}ম ইস্টেপ লস`}
                  </span>
                  <span className="text-yellow-300 font-bold">
                    P: {period.slice(-4)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Header Title */}
          <h2 className={`text-xl sm:text-2xl font-black text-transparent bg-clip-text mt-1 uppercase tracking-wide drop-shadow-md ${
            isWin 
              ? 'bg-gradient-to-r from-yellow-300 via-pink-200 to-cyan-300' 
              : 'bg-gradient-to-r from-red-300 via-orange-200 to-pink-300'
          }`}>
            {isWin ? (isDoubleWin ? 'ডাবল প্রফিট কনফার্ম!' : 'উইন প্রফিট কনফার্ম!') : 'লস ফলাফল ও রিকভারি'}
          </h2>

          {/* User's Exact Requested Information Breakdown:
              ১. পিরিয়ড নাম্বার কত ছিল
              ২. কোনটাতে প্রফিট/লস করলাম (B/S)
              ৩. কত নাম্বারে
              ৪. কোন কালারে */}
          <div className="mt-3 bg-[#150726] border border-purple-500/40 rounded-2xl p-3 text-left space-y-2 shadow-inner">
            {/* Period Row */}
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-purple-800/40">
              <span className="text-purple-300 font-medium">পিরিয়ড নাম্বার:</span>
              <span className="text-yellow-300 font-mono font-black text-sm">
                {period}
              </span>
            </div>

            {/* B/S (কোনটাতে প্রফিট/লস) Row */}
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-purple-800/40">
              <span className="text-purple-300 font-medium">কোনটাতে প্রেডিকশন (B/S):</span>
              <div className="flex items-center gap-1.5 font-bold">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                  sizeSignal === 'Big'
                    ? 'bg-orange-500 text-black'
                    : 'bg-cyan-400 text-black'
                }`}>
                  {sizeSignal}
                </span>
                <span className="text-purple-200">
                  (ফলাফল: <strong className="text-white">{actualSize || sizeSignal}</strong>)
                </span>
              </div>
            </div>

            {/* Lottery Number (কত নাম্বারে) Row */}
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-purple-800/40">
              <span className="text-purple-300 font-medium">কত নাম্বারে ফলাফল:</span>
              <div className="flex items-center gap-1.5 font-bold">
                <span 
                  className="w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs text-white shadow"
                  style={{ backgroundColor: ballBg }}
                >
                  {actualNumber !== undefined ? actualNumber : '--'}
                </span>
                <span className="font-mono text-white text-xs">
                  {actualNumber !== undefined ? `নাম্বার [${actualNumber}]` : '--'}
                </span>
              </div>
            </div>

            {/* Color (কোন কালারে) Row */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-300 font-medium">কোন কালারে ফলাফল:</span>
              <div className="flex items-center gap-1.5 font-bold">
                <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase text-white shadow ${
                  actualColor === 'Green' ? 'bg-emerald-600' : actualColor === 'Red' ? 'bg-rose-600' : 'bg-purple-600'
                }`}>
                  {actualColor || colorSignal}
                </span>
                <span className="text-[11px] text-purple-200">
                  (সিগন্যাল: <strong className="text-yellow-300">{colorSignal}</strong>)
                </span>
              </div>
            </div>
          </div>

          {/* Streak or Recovery Step Card */}
          <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl bg-purple-950/50 border border-purple-700/40 text-xs">
            <span className="text-purple-300 font-medium">
              {isWin ? 'উইন স্ট্রিক:' : 'স্টেপ হিসেব:'}
            </span>
            {isWin ? (
              <span className="flex items-center gap-1 text-emerald-400 font-black font-mono">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                টানা {winStreak} স্টেপ উইন!
              </span>
            ) : (
              <span className="text-rose-400 font-black font-mono">
                {lossStep} ইস্টেপ লস ({lossStep + 1} ইস্টেপ রিকভারি)
              </span>
            )}
          </div>

          {/* Action Continue Button with live 3-second countdown */}
          <button
            onClick={onClose}
            className={`mt-3 w-full py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm tracking-wider uppercase text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isWin
                ? 'bg-gradient-to-r from-[#ff3366] via-[#ba38ca] to-[#7928ca] hover:brightness-110 shadow-[0_0_25px_rgba(255,51,102,0.5)]'
                : 'bg-gradient-to-r from-[#d90429] via-[#ba38ca] to-[#7928ca] hover:brightness-110 shadow-[0_0_25px_rgba(217,4,41,0.5)]'
            }`}
          >
            <Star className="w-4 h-4 fill-white" />
            <span>চালিয়ে যান (CONTINUE)</span>
            <span className="px-2 py-0.5 rounded-full bg-black/40 text-yellow-300 font-mono text-xs border border-white/20 animate-pulse">
              {countdownSec}s
            </span>
          </button>
          <div className="mt-1 text-[10px] text-purple-300/70 font-medium">
            ৩ সেকেন্ড পর নিজে থেকে কেটে গিয়ে আবার সিগন্যাল বট দেখা যাবে
          </div>
        </div>
      </div>
    </div>
  );
};
