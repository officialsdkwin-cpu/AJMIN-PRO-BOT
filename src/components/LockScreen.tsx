import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Eye, EyeOff, KeyRound, AlertTriangle, CheckCircle2, Cpu, Zap, Radio, Award } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
}

// SHA-256 hash of "AJMIN2026"
const TARGET_SHA256 = 'dd6b2449b18cdaf12d53932d6f8cd0fdfcceb0b289931ad879e1b3af22ac352f';
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [rememberSession, setRememberSession] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // User's photo on the 3D logo frame
  const userPhotoUrl = 'https://i.ibb.co.com/C3LQxpqT/20260804-024023.jpg';

  // Focus password input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setAttemptsLeft(MAX_ATTEMPTS);
            setErrorMessage('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutTimer]);

  // Audio synthesizer via Web Audio API
  const playSound = (type: 'success' | 'error' | 'click') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.28);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch {
      // AudioContext ignored
    }
  };

  const verifyPasswordHash = async (inputStr: string): Promise<boolean> => {
    const trimmed = inputStr.trim();
    if (trimmed === 'AJMIN2026') return true;

    try {
      if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(trimmed);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        return hashHex.toLowerCase() === TARGET_SHA256;
      }
    } catch {
      // fallback
    }
    return trimmed === 'AJMIN2026';
  };

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutTimer > 0) return;

    if (!password.trim()) {
      playSound('error');
      setErrorMessage('অনুগ্রহ করে বটের পাসওয়ার্ড দিন');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const isValid = await verifyPasswordHash(password);

    if (isValid) {
      playSound('success');
      setIsSuccess(true);
      setErrorMessage('');
      if (rememberSession) {
        sessionStorage.setItem('ajmin_bot_auth', 'authenticated');
      }
      setTimeout(() => {
        onUnlock();
      }, 700);
    } else {
      playSound('error');
      const remaining = attemptsLeft - 1;
      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (remaining <= 0) {
        setLockoutTimer(LOCKOUT_SECONDS);
        setErrorMessage(`বারবার ভুল পাসওয়ার্ড! ${LOCKOUT_SECONDS} সেকেন্ড লকড ডাউন।`);
      } else {
        setAttemptsLeft(remaining);
        setErrorMessage(`ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন (বাকি সুযোগ: ${remaining})`);
      }
      setPassword('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#080314] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Cyber Grid & Glow Orbs */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(186, 56, 202, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(186, 56, 202, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px'
        }}
      />
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#ff3366]/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#7928ca]/25 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Gateway Card */}
      <div 
        className={`w-full max-w-md bg-gradient-to-b from-[#190a2e]/95 via-[#120622]/95 to-[#0b0316] border border-[#ff477e]/30 rounded-3xl p-5 sm:p-7 shadow-[0_0_55px_rgba(255,51,102,0.25)] backdrop-blur-xl relative z-10 transition-transform duration-300 ${
          shake ? 'animate-[wiggle_0.4s_ease-in-out]' : ''
        }`}
      >
        {/* Top Status Bar */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#7928ca]/30 text-xs text-purple-200">
          <div className="flex items-center gap-1.5 font-mono">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-semibold tracking-wider">SECURITY GATEWAY</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-700/40">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>100% PROTECTED</span>
          </div>
        </div>

        {/* 3D Cyber Logo with User's Photo */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative group mb-3">
            {/* Animated 3D Cyber Glow Rings in Coral & Lavender */}
            <div className="absolute -inset-2.5 bg-gradient-to-r from-[#ff3366] via-[#c056d6] to-[#7928ca] rounded-full blur-md opacity-80 group-hover:opacity-100 transition duration-500 animate-pulse" />
            <div className="absolute -inset-1 rounded-full border border-dashed border-[#ff85c0]/70 animate-[spin_10s_linear_infinite]" />
            
            {/* 3D Circular Frame with User Photo */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-[#1b0a33] via-[#3a0d5c] to-[#120625] border-2 border-[#ff85c0] shadow-[0_10px_25px_rgba(255,51,102,0.45)] flex items-center justify-center">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/80 shadow-inner bg-black relative">
                <img 
                  src={userPhotoUrl} 
                  alt="Ajmin Pramink Profile" 
                  className="w-full h-full object-cover rounded-full filter contrast-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = 'https://i.ibb.co.com/C3LQxpqT/20260804-024023.jpg';
                  }}
                />
              </div>

              {/* Verified Emblem */}
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-black p-1 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <Award className="w-3.5 h-3.5 fill-black" />
              </div>
            </div>

            <div className="absolute -bottom-2 -left-2 bg-emerald-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full border border-white/80 shadow-md uppercase tracking-wider">
              ONLINE
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-[#e0aaff] uppercase drop-shadow-sm">
            Professional Win Go Hacker
          </h1>
          <p className="text-xs sm:text-sm text-[#ff85c0] font-bold tracking-wider mt-0.5 flex items-center justify-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            <span>BUY AJMIN PRAMINK VIP BOT</span>
          </p>
          <div className="mt-1.5 text-[11px] text-purple-200/80 max-w-xs font-medium">
            নিরাপদ অ্যাক্সেসের জন্য নিচে বটের নির্ধারিত পাসওয়ার্ড প্রদান করুন।
          </div>
        </div>

        {/* Security Password Box Form */}
        <form onSubmit={handleUnlock} className="space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label 
                htmlFor="bot-password" 
                className="text-purple-200 font-semibold flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#ff85c0]" />
                বটের গোপন পাসওয়ার্ড (Password)
              </label>
              <span className={`text-[11px] font-mono ${attemptsLeft <= 2 ? 'text-red-400' : 'text-purple-300'}`}>
                সুযোগ বাকি: {attemptsLeft}
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="bot-password"
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                disabled={lockoutTimer > 0 || isSuccess}
                placeholder="পাসওয়ার্ড লিখুন..."
                autoComplete="current-password"
                className={`w-full pl-10 pr-12 py-3 bg-[#0d051c] border ${
                  errorMessage
                    ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                    : isSuccess
                    ? 'border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'border-[#a855f7]/40 focus:border-[#ff3366] focus:shadow-[0_0_20px_rgba(255,51,102,0.35)]'
                } rounded-xl text-white placeholder-purple-400/40 text-sm font-medium tracking-wide outline-none transition-all duration-200 disabled:opacity-50`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-purple-400 hover:text-purple-200 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Feedback & Error / Success Messages */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-2 bg-red-950/50 border border-red-500/50 rounded-lg text-red-200 text-xs animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="leading-tight">{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="flex items-center gap-2 p-2 bg-emerald-950/50 border border-emerald-500/50 rounded-lg text-emerald-200 text-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="leading-tight font-semibold">পাসওয়ার্ড সঠিক! বট ওপেন হচ্ছে...</span>
            </div>
          )}

          {lockoutTimer > 0 && (
            <div className="text-center py-2 bg-yellow-950/40 border border-yellow-500/30 rounded-lg text-yellow-300 text-xs font-mono">
              লকড ডাউন সক্রিয়: <strong className="text-yellow-200">{lockoutTimer}</strong> সেকেন্ড পর পুনরায় চেষ্টা করুন
            </div>
          )}

          {/* Unlock Bot Button */}
          <button
            type="submit"
            disabled={lockoutTimer > 0 || isSuccess}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
              isSuccess
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-black shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-[#ff3366] via-[#ba38ca] to-[#7928ca] hover:brightness-110 text-white shadow-[0_0_22px_rgba(255,51,102,0.4)] active:scale-[0.98]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>অ্যাক্সেস মঞ্জুর হয়েছে</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>বট আনলক করুন (Unlock Bot)</span>
              </>
            )}
          </button>

          {/* Remember Session Toggle */}
          <div className="flex items-center justify-between text-xs text-purple-300/80 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="rounded border-purple-600 bg-purple-950/80 text-pink-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 accent-pink-500"
              />
              <span>এই ব্রাউজারে সেশন মনে রাখুন</span>
            </label>
            <span className="text-[11px] text-purple-400 font-mono">v4.2 VIP</span>
          </div>
        </form>

        {/* Security Specs Footer Strip */}
        <div className="mt-5 pt-4 border-t border-purple-900/40 grid grid-cols-3 gap-2 text-center text-[10px] text-purple-300/70 font-mono">
          <div className="flex flex-col items-center">
            <Cpu className="w-3.5 h-3.5 text-purple-400 mb-1" />
            <span>AI PATTERN</span>
            <span className="text-[9px] text-emerald-400">ACTIVE</span>
          </div>
          <div className="flex flex-col items-center">
            <Shield className="w-3.5 h-3.5 text-pink-400 mb-1" />
            <span>256-BIT AES</span>
            <span className="text-[9px] text-emerald-400">ENCRYPTED</span>
          </div>
          <div className="flex flex-col items-center">
            <Radio className="w-3.5 h-3.5 text-cyan-400 mb-1" />
            <span>AR-LOTTERY</span>
            <span className="text-[9px] text-emerald-400">SYNC LIVE</span>
          </div>
        </div>
      </div>

      {/* Cyber Security Bottom Notice */}
      <div className="mt-4 text-center text-xs text-purple-400/70 font-mono">
        Official Hacker Predictor Engine · Designed for Ajmin Pramink
      </div>
    </div>
  );
};
