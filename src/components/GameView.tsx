import React, { useState } from 'react';
import { ExternalLink, RefreshCw, Shield, AlertCircle, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

interface GameViewProps {
  currentPrediction?: string | null;
  currentPeriod?: string | null;
  onToggleBottomNav?: () => void;
  isBottomNavHidden?: boolean;
}

export const GameView: React.FC<GameViewProps> = ({
  currentPrediction,
  currentPeriod,
  onToggleBottomNav,
  isBottomNavHidden = false
}) => {
  const gameUrl = 'https://hgnice.biz';
  const [iframeKey, setIframeKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [liftLevel, setLiftLevel] = useState<'normal' | 'lifted' | 'extra'>('lifted');
  const [showPredictionBadge, setShowPredictionBadge] = useState(true);

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
    setHasError(false);
  };

  // Height calculation to raise the website above the bottom navigation bar
  // lifted: raises by 75px, extra: raises by 115px, normal: standard height
  const containerHeightClass = isBottomNavHidden
    ? 'h-[calc(100dvh-115px)]'
    : liftLevel === 'extra'
    ? 'h-[calc(100dvh-245px)] min-h-[420px]'
    : liftLevel === 'lifted'
    ? 'h-[calc(100dvh-205px)] min-h-[460px]'
    : 'h-[calc(100dvh-175px)] min-h-[480px]';

  return (
    <div className={`w-full ${containerHeightClass} bg-[#090414] flex flex-col relative transition-all duration-300 pb-2`}>
      
      {/* Top Floating Mini Signal Overlay over the Game - Compact & Collapsible */}
      {currentPrediction && showPredictionBadge && (
        <div className="absolute top-1.5 left-2 right-2 z-20 flex items-center justify-between px-3 py-1 bg-[#120624]/95 backdrop-blur-md rounded-xl border border-[#ff3366]/50 shadow-[0_4px_20px_rgba(255,51,102,0.4)] animate-fadeIn">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold text-purple-200">
              পিরিয়ড: <strong className="text-yellow-300 font-mono">{currentPeriod ? currentPeriod.slice(-4) : '---'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-pink-200 font-bold">সিগন্যাল:</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase shadow-sm ${
              currentPrediction.includes('Big')
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black'
                : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black'
            }`}>
              {currentPrediction}
            </span>
            <button
              onClick={() => setShowPredictionBadge(false)}
              className="p-0.5 text-purple-300 hover:text-white"
              title="Hide badge"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* When collapsed, small restore pill */}
      {currentPrediction && !showPredictionBadge && (
        <button
          onClick={() => setShowPredictionBadge(true)}
          className="absolute top-1.5 right-3 z-20 px-2 py-0.5 bg-[#120624]/90 border border-pink-500/40 rounded-full text-[10px] text-pink-200 font-bold flex items-center gap-1 shadow-md"
        >
          <span>সিগন্যাল</span>
          <ChevronDown className="w-3 h-3 text-yellow-300" />
        </button>
      )}

      {/* Frame Controls Bar with Lift Level & Fullscreen Switch */}
      <div className="bg-[#10051e] border-b border-[#7928ca]/30 px-2.5 py-1.5 flex items-center justify-between text-xs text-purple-200 gap-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-mono font-semibold text-emerald-300 truncate max-w-[120px] sm:max-w-[160px]">
            hgnice.biz
          </span>
        </div>

        {/* Lift & Position Controls */}
        <div className="flex items-center gap-1.5">
          {/* Lift Website Up Toggle Button */}
          <button
            onClick={() => {
              if (liftLevel === 'normal') setLiftLevel('lifted');
              else if (liftLevel === 'lifted') setLiftLevel('extra');
              else setLiftLevel('normal');
            }}
            title="ওয়েবসাইট উপরে উঠান যেন নিচের সব অপশন দেখা যায়"
            className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all border ${
              liftLevel === 'extra'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black border-amber-300 shadow-[0_0_8px_#f59e0b]'
                : liftLevel === 'lifted'
                ? 'bg-gradient-to-r from-[#ff3366] to-[#ba38ca] text-white border-pink-300 shadow-[0_0_8px_rgba(255,51,102,0.5)]'
                : 'bg-purple-900/40 text-purple-200 border-purple-700/50'
            }`}
          >
            <ArrowUp className="w-3 h-3" />
            <span>
              {liftLevel === 'extra' ? '⬆️ বেশি উপরে (+110px)' : liftLevel === 'lifted' ? '⬆️ উপরে (+75px)' : 'স্বাভাবিক'}
            </span>
          </button>

          {/* Fullscreen / Toggle Bottom Nav */}
          {onToggleBottomNav && (
            <button
              onClick={onToggleBottomNav}
              title={isBottomNavHidden ? 'নেভিগেশন মেনু দেখান' : 'বটম মেনু লুকান (ফুল স্ক্রিন)'}
              className={`p-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors border ${
                isBottomNavHidden
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                  : 'bg-purple-900/40 border-purple-800 text-purple-200'
              }`}
            >
              {isBottomNavHidden ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3" />}
              <span>{isBottomNavHidden ? 'মেনু দেখান' : 'ফুল ভিউ'}</span>
            </button>
          )}

          {/* Reload Button */}
          <button
            onClick={handleRefresh}
            title="Reload Game Frame"
            className="p-1 rounded-md bg-purple-900/40 hover:bg-purple-800 text-purple-200 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>

          {/* Open in Browser */}
          <a
            href={gameUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new window"
            className="p-1 rounded-md bg-[#ff3366]/20 hover:bg-[#ff3366]/30 text-pink-200 border border-[#ff3366]/40 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Seamless Game Frame Raised Above Bottom Nav */}
      <div className="flex-1 w-full relative bg-[#090414] overflow-hidden rounded-b-2xl border-x border-b border-purple-900/30">
        <iframe
          key={iframeKey}
          src={gameUrl}
          title="Win Go Live Game Full Display"
          className="w-full h-full border-0 bg-[#090414] block"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          allow="autoplay; fullscreen"
          onError={() => setHasError(true)}
        />

        {hasError && (
          <div className="absolute inset-0 bg-[#0b0318]/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <AlertCircle className="w-12 h-12 text-pink-400 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">সরাসরি গেমটি ব্রাউজারে দেখতে পারেন</h3>
            <p className="text-xs text-purple-200 max-w-sm mb-4">
              নেটওয়ার্ক সিকিউরিটি বা রেস্ট্রিকশনের কারণে নিচের বাটনে ক্লিক করে সরাসরি গেম সাইটে ঢুকুন।
            </p>
            <a
              href={gameUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#ff3366] via-[#ba38ca] to-[#7928ca] text-white shadow-lg flex items-center gap-2"
            >
              <span>ওয়েবসাইটে প্রবেশ করুন (Open Game)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Visual Indicator of Lift */}
      <div className="w-full text-center py-0.5 bg-[#0a0314] text-[9px] text-purple-400/80 font-mono">
        ওয়েবসাইট ভিউ উপরে তোলা আছে · নিচে নেভিগেশন বারের সাথে ফাঁকা রাখা হয়েছে
      </div>
    </div>
  );
};
