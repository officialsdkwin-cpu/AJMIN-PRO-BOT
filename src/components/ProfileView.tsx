import React, { useState } from 'react';
import { Send, CheckCircle2, ShieldCheck, Copy, ExternalLink, Lock, Award, Cpu, Key } from 'lucide-react';

interface ProfileViewProps {
  onLock: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onLock }) => {
  const [copied, setCopied] = useState(false);
  const telegramLink = 'https://t.me/+wcXYWXRIWbBjMWVl';
  const userPhotoUrl = 'https://i.ibb.co.com/C3LQxpqT/20260804-024023.jpg';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(telegramLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-b from-[#190a2e] via-[#120622] to-[#0b0316] border border-[#ff477e]/35 rounded-3xl p-5 shadow-[0_0_40px_rgba(255,51,102,0.22)] relative overflow-hidden flex flex-col items-center text-center">
        
        {/* Decorative Top Beacon */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>VERIFIED BOT OWNER & DEVELOPER</span>
        </div>

        {/* 3D Cybernetic Logo Frame with User Photo */}
        <div className="relative group my-2">
          {/* Animated 3D Cyber Rings */}
          <div className="absolute -inset-3 bg-gradient-to-r from-[#ff3366] via-[#c056d6] to-[#7928ca] rounded-full blur-md opacity-80 group-hover:opacity-100 transition duration-500 animate-pulse" />
          <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-[#ff85c0]/70 animate-[spin_12s_linear_infinite]" />
          
          {/* 3D Holographic Perspective Container */}
          <div 
            className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1.5 bg-gradient-to-tr from-[#1b0a33] via-[#3a0d5c] to-[#120625] border-2 border-[#ff85c0] shadow-[0_10px_30px_rgba(255,51,102,0.45),inset_0_0_20px_rgba(186,56,202,0.5)] transform-gpu transition-transform duration-300 group-hover:scale-105"
            style={{ perspective: '800px' }}
          >
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
              {/* Holographic Gloss Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none rounded-full" />
            </div>

            {/* 3D Badge Emblem */}
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[11px] font-black p-1.5 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <Award className="w-4 h-4 fill-black" />
            </div>
          </div>
        </div>

        {/* User Name & Details */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-[#e0aaff] uppercase">
              Ajmin Pramink
            </h1>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
          </div>
          <div className="text-xs font-bold text-[#ff85c0] tracking-wider">
            আজমিন প্রামাণিক
          </div>
          <p className="text-xs text-purple-200/80 max-w-xs font-medium pt-0.5">
            Founder & Lead Creator of Professional Win Go Hacker Bot
          </p>
        </div>

        {/* Official Telegram Group Link Card */}
        <div className="w-full mt-5 p-4 rounded-2xl bg-gradient-to-r from-[#0088cc]/20 via-[#180a33] to-[#0088cc]/20 border border-[#0088cc]/60 shadow-[0_0_25px_rgba(0,136,204,0.25)] space-y-3">
          <div className="flex items-center justify-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
            <Send className="w-4 h-4 text-[#0088cc] animate-bounce" />
            <span>অফিসিয়াল টেলিগ্রাম গ্রুপ (Telegram Group)</span>
          </div>

          <p className="text-[11px] text-purple-200/90 leading-relaxed">
            লাইভ ১০০% নিখুঁত প্রেডিকশন সিগন্যাল, ট্রিক্স এবং সব ধরণের আপডেটের জন্য আমাদের অফিশিয়াল টেলিগ্রাম গ্রুপে এখনই যুক্ত হন!
          </p>

          {/* Join Telegram Button */}
          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm tracking-wider uppercase text-white bg-gradient-to-r from-[#0088cc] to-[#00b4d8] hover:from-[#0077b5] hover:to-[#0096c7] shadow-[0_0_20px_rgba(0,136,204,0.5)] transition-all flex items-center justify-center gap-2 active:scale-95 border border-cyan-300/40"
          >
            <Send className="w-4 h-4" />
            <span>টেলিগ্রাম গ্রুপে জয়েন করুন (JOIN NOW)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Copy Link Option */}
          <div className="flex items-center justify-between bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-xs">
            <span className="font-mono text-purple-300/80 text-[11px] truncate max-w-[210px]">
              {telegramLink}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-[11px] font-bold transition-colors ml-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>কপি লিংক</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bot Credentials & Specs */}
        <div className="w-full grid grid-cols-2 gap-2 mt-4 text-left text-xs">
          <div className="bg-[#120722] border border-purple-800/40 rounded-xl p-2.5 space-y-0.5">
            <div className="text-[10px] text-purple-400 flex items-center gap-1 font-mono">
              <Key className="w-3 h-3 text-pink-400" />
              <span>ACCESS PASS</span>
            </div>
            <div className="font-mono font-bold text-white text-[11px]">
              AJMIN2026 (Active)
            </div>
          </div>

          <div className="bg-[#120722] border border-purple-800/40 rounded-xl p-2.5 space-y-0.5">
            <div className="text-[10px] text-purple-400 flex items-center gap-1 font-mono">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>SECURITY LEVEL</span>
            </div>
            <div className="font-mono font-bold text-emerald-400 text-[11px]">
              100% MAXIMUM
            </div>
          </div>
        </div>

        {/* Standalone HTML File Launcher */}
        <a
          href="/wingo-bot-ajmin.html"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full py-2.5 px-4 rounded-xl border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
        >
          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          <span>🌐 সম্পূর্ণ একক HTML ফাইল ওপেন / সেভ করুন (Standalone HTML)</span>
        </a>

        {/* Lock Bot Action */}
        <button
          onClick={onLock}
          className="mt-3 w-full py-2.5 px-4 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-900/40 text-red-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-red-400" />
          <span>বট লক করে প্রস্থান করুন (LOCK & LOGOUT)</span>
        </button>
      </div>
    </div>
  );
};
