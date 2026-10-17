import React, { useState } from 'react';
import { Radio, Trophy, XCircle, Sparkles, Trash2, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { PredictionRecord, OverallStats } from '../types';

interface HistoryViewProps {
  stats: OverallStats;
  predictions: PredictionRecord[];
  onClearHistory?: () => void;
  selectedInterval: number;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  stats,
  predictions,
  onClearHistory,
  selectedInterval
}) => {
  const [filterType, setFilterType] = useState<'all' | 'win' | 'loss' | 'double'>('all');

  const filteredPredictions = predictions.filter((p) => {
    if (filterType === 'all') return true;
    if (filterType === 'win') return p.status === 'Win';
    if (filterType === 'loss') return p.status === 'Loss';
    if (filterType === 'double') return p.status === 'Double Win';
    return true;
  });

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* 3D Page Title Banner */}
      <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 border-2 border-[#ba38ca]/60 bg-gradient-to-r from-[#240a3d] via-[#16062b] to-[#2c0e44] shadow-[0_10px_30px_rgba(186,56,202,0.35),inset_0_1px_2px_rgba(255,255,255,0.4)] text-center">
        {/* Glow orb */}
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-[#ff3366]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black tracking-widest text-[#ffd66b] uppercase shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
            <span>3D PRO REAL-TIME ENGINE ANALYTICS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-[#e0aaff] mt-1.5 uppercase drop-shadow-[0_2px_8px_rgba(255,51,102,0.6)]">
            HESTORI · সিগন্যাল ও রেজাল্ট হিস্টরি
          </h2>
          <div className="text-xs text-purple-200/90 font-medium mt-0.5 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              {selectedInterval === 60 ? '১ মিনিট উইনগো হিস্টোরি (1 MIN)' : '৩০ সেকেন্ড উইনগো হিস্টোরি (30 SEC)'}
            </span>
            <span className="text-purple-400">·</span>
            <span className="text-[#00e676] font-bold">100% ফাস্ট সেভ সিঙ্ক</span>
          </div>
        </div>
      </div>

      {/* 4 Main 3D KPI Cards:
          মোট সিগনাল, মোট উইন, মোট লস, মোট ডাবল উইন/জ্যাকফুট */}
      <div className="grid grid-cols-2 gap-3">
        {/* মোট সিগনাল (Total Signals) */}
        <div className="group relative rounded-2xl p-3.5 border-2 border-[#ff3366]/60 bg-gradient-to-b from-[#2b0d3e] to-[#140624] shadow-[0_8px_20px_rgba(255,51,102,0.25),inset_0_2px_4px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between text-purple-200">
            <span className="text-[11px] font-black uppercase tracking-wider text-pink-200 drop-shadow">
              মোট সিগনাল
            </span>
            <div className="p-1.5 rounded-lg bg-[#ff3366]/20 border border-[#ff3366]/40 shadow-inner">
              <Radio className="w-4 h-4 text-[#ff85c0] animate-pulse" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-1 font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]">
            {stats.totalSignals}
          </div>
          <div className="text-[10px] text-purple-300/80 mt-1 flex items-center justify-between font-semibold">
            <span>Total Signals</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> লাইভ সিঙ্ক
            </span>
          </div>
        </div>

        {/* মোট উইন (Total Wins) */}
        <div className="group relative rounded-2xl p-3.5 border-2 border-emerald-500/70 bg-gradient-to-b from-[#0e3b22] to-[#071d11] shadow-[0_8px_20px_rgba(16,185,129,0.3),inset_0_2px_4px_rgba(255,255,255,0.25)] transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between text-emerald-200">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 drop-shadow">
              মোট উইন
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 shadow-inner">
              <Trophy className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#00ff88] mt-1 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(0,255,136,0.6)]">
            {stats.totalWins}
          </div>
          <div className="text-[10px] text-emerald-300/80 mt-1 flex items-center justify-between font-semibold">
            <span>Total Wins</span>
            <span className="text-yellow-300 font-black">{stats.winRate}% হার</span>
          </div>
        </div>

        {/* মোট লস (Total Losses) */}
        <div className="group relative rounded-2xl p-3.5 border-2 border-rose-500/70 bg-gradient-to-b from-[#3d0f1e] to-[#1c060d] shadow-[0_8px_20px_rgba(244,63,94,0.3),inset_0_2px_4px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between text-rose-200">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-300 drop-shadow">
              মোট লস
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-400/40 shadow-inner">
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400 mt-1 font-mono tracking-tight drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]">
            {stats.totalLosses}
          </div>
          <div className="text-[10px] text-rose-300/80 mt-1 flex items-center justify-between font-semibold">
            <span>Total Losses</span>
            <span className="text-pink-300 font-bold">রিকভারি সমর্থিত</span>
          </div>
        </div>

        {/* মোট ডাবল উইন (Total Double Wins) */}
        <div className="group relative rounded-2xl p-3.5 border-2 border-[#c056d6]/80 bg-gradient-to-b from-[#3a1352] to-[#1c082b] shadow-[0_8px_20px_rgba(192,86,214,0.35),inset_0_2px_4px_rgba(255,255,255,0.25)] transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between text-pink-200">
            <span className="text-[11px] font-black uppercase tracking-wider text-pink-300 drop-shadow">
              মোট ডাবল উইন
            </span>
            <div className="p-1.5 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/40 shadow-inner">
              <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#ff85c0] mt-1 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(255,133,192,0.7)]">
            {stats.totalJackpots}
          </div>
          <div className="text-[10px] text-pink-300/80 mt-1 flex items-center justify-between font-semibold">
            <span>B/S + কালার ম্যাচ</span>
            <span className="text-yellow-300 font-black">ডাবল প্রফিট</span>
          </div>
        </div>
      </div>

      {/* 3D Win Accuracy Bar */}
      <div className="rounded-2xl p-3.5 border border-[#ba38ca]/40 bg-gradient-to-r from-[#17082c] via-[#100520] to-[#17082c] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_4px_15px_rgba(186,56,202,0.2)]">
        <div className="flex justify-between items-center text-xs text-purple-200 mb-1.5 font-bold">
          <span>সামগ্রিক উইন একুরেসি (WIN ACCURACY RATE)</span>
          <span className="text-emerald-400 font-mono font-black text-sm drop-shadow-[0_0_6px_#10b981]">
            {stats.winRate}%
          </span>
        </div>
        <div className="w-full h-3 bg-[#0a0314] rounded-full overflow-hidden border border-purple-800/60 p-0.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#ff3366] via-[#ffd66b] to-[#00e676] transition-all duration-700 rounded-full shadow-[0_0_12px_rgba(0,230,118,0.8)]"
            style={{ width: `${Math.min(100, Math.max(0, stats.winRate))}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs & Quick Action */}
      <div className="flex items-center justify-between gap-1 pt-1 flex-wrap">
        <div className="flex gap-1 bg-[#140626] p-1 rounded-xl border border-[#5a189a]/50 shadow-inner">
          {(['all', 'win', 'loss', 'double'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-gradient-to-r from-[#ff3366] via-[#ba38ca] to-[#7928ca] text-white shadow-[0_0_12px_rgba(255,51,102,0.5)] border border-[#ff85c0]/60'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              {t === 'all'
                ? 'সবগুলো'
                : t === 'win'
                ? 'উইন'
                : t === 'loss'
                ? 'লস'
                : 'ডাবল'}
            </button>
          ))}
        </div>

        {onClearHistory && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1 text-[11px] text-purple-300/80 hover:text-rose-400 px-2.5 py-1.5 rounded-lg hover:bg-rose-950/40 border border-purple-800/40 transition-colors cursor-pointer"
            title="Clear saved prediction history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>মুছুন</span>
          </button>
        )}
      </div>

      {/* 3D Detailed Signal History Table with B/S and Color Columns */}
      <div className="rounded-2xl border-2 border-[#7928ca]/60 overflow-hidden shadow-[0_10px_35px_rgba(121,40,202,0.3)] bg-[#0f041d]">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-[#ba38ca] via-[#7928ca] to-[#5a189a] text-white text-xs font-black tracking-wide border-b border-[#ba38ca]/40">
              <th className="py-3 px-2">পিরিয়ড</th>
              <th className="py-3 px-2">সিগনাল (B/S ও কালার)</th>
              <th className="py-3 px-2">রেজাল্ট</th>
              <th className="py-3 px-2">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#32134f] text-xs">
            {filteredPredictions.map((item, idx) => {
              const status = item.status;
              const isDoubleWin = status === 'Double Win';
              const isWin = status === 'Win';
              const isLoss = status === 'Loss';

              return (
                <tr key={`${item.period}-${idx}`} className="hover:bg-purple-950/40 transition-colors">
                  {/* Period */}
                  <td className="py-3 px-2 font-mono text-purple-200 font-bold">
                    {item.period.slice(-6)}
                  </td>

                  {/* Prediction: B/S + Color */}
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {/* B/S */}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase shadow-sm border ${
                        item.prediction === 'Big'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black border-amber-300'
                          : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black border-cyan-200'
                      }`}>
                        {item.prediction}
                      </span>

                      {/* Color */}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase shadow-sm border ${
                        item.colorPrediction === 'Green'
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-black border-emerald-300'
                          : 'bg-gradient-to-r from-rose-500 to-red-600 text-white border-rose-300'
                      }`}>
                        {item.colorPrediction}
                      </span>
                    </div>
                  </td>

                  {/* Actual Result */}
                  <td className="py-3 px-2">
                    {item.actual ? (
                      <div className="flex items-center justify-center gap-1">
                        {item.actualNumber !== undefined && (
                          <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black text-white shadow ${
                            item.actualNumber === 0 || item.actualNumber === 5
                              ? 'bg-[#b5179e]'
                              : item.actualNumber % 2 === 0
                              ? 'bg-[#ff385c]'
                              : 'bg-[#00e676] text-black font-extrabold'
                          }`}>
                            {item.actualNumber}
                          </span>
                        )}
                        <span className="font-bold text-white text-[11px]">
                          {item.actualSize || ''} {item.actualColor ? `(${item.actualColor})` : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-purple-400/60 font-medium">অপেক্ষমাণ...</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-2">
                    {isDoubleWin ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black text-[11px] shadow-[0_0_10px_rgba(217,70,239,0.7)] border border-pink-300 animate-pulse">
                        <Sparkles className="w-3 h-3 text-yellow-300" />
                        ডাবল উইন
                      </span>
                    ) : isWin ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300 font-black text-[11px] shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                        ✅ উইন
                      </span>
                    ) : isLoss ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-500 text-rose-300 font-black text-[11px]">
                        ❌ লস
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/60 text-amber-300 font-bold text-[10px]">
                        ⏳ অপেক্ষমাণ
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredPredictions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-purple-400/60 font-medium">
                  কোনো রেকর্ড পাওয়া যায়নি
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
