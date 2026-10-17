import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Volume2, VolumeX, Lock, ShieldCheck, Flame, Zap, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { HistoryItem, PredictionRecord, NavTab, OverallStats, SizeType } from '../types';
import { BottomNav } from './BottomNav';
import { GameView } from './GameView';
import { HistoryView } from './HistoryView';
import { ProfileView } from './ProfileView';
import { WinCelebrationModal } from './WinCelebrationModal';
import { Countdown5sOverlay } from './Countdown5sOverlay';

interface WinGoBotProps {
  onLock: () => void;
}

const API_URLS: Record<number, string> = {
  60: 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json',
  30: 'https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json'
};

const DISPLAY_COUNT = 10;
const HISTORY_STORAGE_PREFIX = 'ajmin_wingo_prediction_history_v4_';

export const WinGoBot: React.FC<WinGoBotProps> = ({ onLock }) => {
  // Navigation Tab: 'home' | 'game' | 'hestori' | 'profile'
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('home');

  const [selectedInterval, setSelectedInterval] = useState<number>(30);
  const [historyLog, setHistoryLog] = useState<HistoryItem[]>([]);
  const [predictionHistory, setPredictionHistory] = useState<PredictionRecord[]>([]);
  
  // Current active predictions: Size (Big/Small) and Color (Green/Red)
  const [currentActivePeriod, setCurrentActivePeriod] = useState<string | null>(null);
  const [currentActiveSize, setCurrentActiveSize] = useState<SizeType | null>(null);
  const [currentActiveColor, setCurrentActiveColor] = useState<'Green' | 'Red' | null>(null);

  const [engineLifecycleStatus, setEngineLifecycleStatus] = useState<string>('waiting');
  const [predResult, setPredResult] = useState<string>('');
  const [predResultClass, setPredResultClass] = useState<string>('');
  const [logoBadgeText, setLogoBadgeText] = useState<string>('⚡ LIVE');
  const [logoBadgeStyle, setLogoBadgeStyle] = useState<{ bg: string; color: string }>({ bg: '#ff9f43', color: '#111' });
  const [modeNote, setModeNote] = useState<string>('Live 30-second history connected. Predictions are live estimates.');
  const [upcomingIssueStr, setUpcomingIssueStr] = useState<string>('Upcoming: --');
  
  // Timer digits: [min_tens, min_ones, sec_tens, sec_ones]
  const [timerDigits, setTimerDigits] = useState<number[]>([0, 0, 3, 0]);
  const [isCountdown5s, setIsCountdown5s] = useState<boolean>(false);
  const [countdownRemainingSec, setCountdownRemainingSec] = useState<number>(30);
  
  // Logic Engine selection
  const [activeLogic, setActiveLogic] = useState<number>(1);
  const [logicStats, setLogicStats] = useState<Record<number, { wins: number; losses: number }>>({
    1: { wins: 0, losses: 0 },
    2: { wins: 0, losses: 0 },
    3: { wins: 0, losses: 0 }
  });
  
  // Controls & user choices
  const [activeFilter, setActiveFilter] = useState<'green' | 'violet' | 'red'>('green');
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [selectedMult, setSelectedMult] = useState<number>(1);
  const [selectedBs, setSelectedBs] = useState<'big' | 'small'>('big');
  const [activeTab, setActiveTab] = useState<'history' | 'predictions' | 'bypass'>('history');
  
  // Step & Streak Tracking for voice announcements
  const [winStreak, setWinStreak] = useState<number>(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState<number>(0);
  const [recoveryStep, setRecoveryStep] = useState<number>(1);

  // 4-Step Loss special state: Mute voice for 2-3 signals while calculating 95% safe 5th step
  const [isWaitingFor5thStep, setIsWaitingFor5thStep] = useState<boolean>(false);
  const [cooldownRoundsLeft, setCooldownRoundsLeft] = useState<number>(0);

  // Fullscreen / Hide Bottom Nav toggle in Game Mode
  const [isGameNavHidden, setIsGameNavHidden] = useState<boolean>(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Result Modal State (Win & Loss with User's Official Images and breakdown)
  const [resultModalData, setResultModalData] = useState<{
    show: boolean;
    type: 'win' | 'loss';
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
  }>({
    show: false,
    type: 'win',
    period: '',
    sizeSignal: 'Big',
    colorSignal: 'Green',
    winStreak: 0,
    lossStep: 1,
    consecutiveLosses: 0,
    isDoubleWin: false
  });

  const handleCloseResultModal = useCallback(() => {
    setResultModalData((prev) => ({ ...prev, show: false }));
  }, []);
  // References for live loops
  const serverTimeOffsetRef = useRef<number>(0);
  const processedPeriodsRef = useRef<Set<string>>(new Set());
  const lastFetchBoundaryRef = useRef<number | null>(null);
  const lastBeatSecondRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Singleton AudioContext with user gesture unlock
  const getAudioContext = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  // Global user interaction unlocker to prevent browser autoplay blocks
  useEffect(() => {
    const handleUnlock = () => {
      getAudioContext();
    };
    window.addEventListener('click', handleUnlock, { passive: true });
    window.addEventListener('touchstart', handleUnlock, { passive: true });
    window.addEventListener('keydown', handleUnlock, { passive: true });
    return () => {
      window.removeEventListener('click', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
    };
  }, [getAudioContext]);

  // Pre-load speech synthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Deep Bass Punchy Countdown Beat for last 5 seconds (5, 4, 3, 2, 1)
  const playCountdownDeepBeat = useCallback((sec: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      const punchOsc = ctx.createOscillator();
      const punchGain = ctx.createGain();

      subOsc.type = 'sine';
      const startFreq = sec === 1 ? 170 : 110 + (5 - sec) * 14;
      const endFreq = sec === 1 ? 32 : 26;
      subOsc.frequency.setValueAtTime(startFreq, now);
      subOsc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.26);

      subGain.gain.setValueAtTime(sec === 1 ? 0.85 : 0.7, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      punchOsc.type = 'triangle';
      punchOsc.frequency.setValueAtTime(sec === 1 ? 1300 : 850, now);
      punchOsc.frequency.exponentialRampToValueAtTime(80, now + 0.07);
      punchGain.gain.setValueAtTime(0.38, now);
      punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      punchOsc.connect(punchGain);
      punchGain.connect(ctx.destination);

      subOsc.start(now);
      punchOsc.start(now);
      subOsc.stop(now + 0.3);
      punchOsc.stop(now + 0.07);
    } catch {
      // Audio not permitted
    }
  }, [getAudioContext, soundEnabled]);

  // Voice speech announcement helper using Web Speech Synthesis
  const speakVoice = useCallback((text: string, delayMs = 0) => {
    if (!soundEnabled) return;
    const runSpeak = () => {
      try {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const bnVoice = voices.find((v) => v.lang.toLowerCase().startsWith('bn')) ||
                        voices.find((v) => v.lang.toLowerCase().includes('bengali')) ||
                        voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
                        voices.find((v) => v.lang.toLowerCase().startsWith('en'));
        if (bnVoice) {
          utterance.voice = bnVoice;
        }
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Voice speech error', e);
      }
    };

    if (delayMs > 0) {
      setTimeout(runSpeak, delayMs);
    } else {
      runSpeak();
    }
  }, [soundEnabled]);

  // Announce upcoming signal: Size (Big/Small) and Color (Red/Green)
  // Respects the user's rule: if waitingFor5thStep and cooldownRoundsLeft > 0, NO VOICE ANNOUNCEMENT!
  const announceSignalVoice = useCallback((period: string, size: SizeType | null, color: 'Green' | 'Red' | null, delayMs = 0) => {
    if (!soundEnabled || !period || !size) return;
    // CRITICAL USER RULE:
    // "তবে তুমি যতখন সঠিক সিগনাল না পাবে ততো খন কনো সিগনালের কথা ভয়েজে বলবে না। কারন আমি চাই আমার এই বট ৫ ইস্টেপ যেনো পার না হয়।"
    if (isWaitingFor5thStep && cooldownRoundsLeft > 0) {
      console.log('Voice muted during 4-step loss cooldown to ensure 5th step never fails.');
      return;
    }

    const last3 = period.length >= 3 ? period.slice(-3) : period;
    const colorStr = color ? ` ${color}` : '';
    const text = `পিরিয়ড নাম্বার ${last3} ${size}${colorStr}`;
    speakVoice(text, delayMs);
  }, [soundEnabled, speakVoice, isWaitingFor5thStep, cooldownRoundsLeft]);

  // Sound effects
  const playSoundEffect = (type: 'win' | 'jackpot' | 'loss' | 'tick') => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'win' || type === 'jackpot') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'loss') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      }
    } catch {
      // Audio not permitted
    }
  };

  // Color helper for lottery results
  const getColorName = (num: number): 'Green' | 'Red' | 'Violet' => {
    if (num === 0 || num === 5) return 'Violet';
    return num % 2 === 0 ? 'Red' : 'Green';
  };

  const getBigSmall = (num: number): SizeType => {
    return num >= 5 ? 'Big' : 'Small';
  };

  // Logic algorithms for B/S & Color
  const runLogicPrediction = (logicId: number, history: HistoryItem[]): { size: SizeType; color: 'Green' | 'Red' } => {
    if (!history || history.length < 3) {
      return {
        size: Math.random() > 0.5 ? 'Big' : 'Small',
        color: Math.random() > 0.5 ? 'Green' : 'Red'
      };
    }

    let predictedSize: SizeType = 'Big';
    let predictedColor: 'Green' | 'Red' = 'Green';

    if (logicId === 1) {
      // Pattern Master: analyzes streaks & alternations
      const recent = history.slice(0, 15);
      let sizeStreak = 0;
      let lastSize: SizeType | null = null;
      let redCount = 0;
      let greenCount = 0;

      for (let i = 0; i < recent.length; i++) {
        const size = getBigSmall(recent[i].num);
        const color = getColorName(recent[i].num);
        if (color === 'Red') redCount++;
        else if (color === 'Green') greenCount++;

        if (i === 0) lastSize = size;
        else if (size === lastSize) sizeStreak++;
      }

      predictedSize = sizeStreak >= 3 ? (lastSize === 'Big' ? 'Small' : 'Big') : (lastSize || 'Big');
      predictedColor = redCount >= greenCount ? 'Green' : 'Red';
    } else if (logicId === 2) {
      // Frequency Analyzer
      const recent = history.slice(0, 20);
      let smallCount = 0;
      let greenCount = 0;
      recent.forEach((item) => {
        if (item.num < 5) smallCount++;
        if (getColorName(item.num) === 'Green') greenCount++;
      });
      predictedSize = smallCount / recent.length > 0.52 ? 'Big' : 'Small';
      predictedColor = greenCount / recent.length > 0.5 ? 'Red' : 'Green';
    } else {
      // Hybrid Intelligence
      const p1 = runLogicPrediction(1, history);
      const p2 = runLogicPrediction(2, history);
      predictedSize = p1.size === p2.size ? p1.size : (Math.random() > 0.5 ? 'Big' : 'Small');
      predictedColor = p1.color === p2.color ? p1.color : (Math.random() > 0.5 ? 'Green' : 'Red');
    }

    return { size: predictedSize, color: predictedColor };
  };

  const computeNextIssue = (lastIssue: string): string => {
    if (!lastIssue || lastIssue.length < 8) return '------';
    try {
      const prefix = lastIssue.substring(0, lastIssue.length - 4);
      const suffix = lastIssue.substring(lastIssue.length - 4);
      const nextNum = parseInt(suffix, 10) + 1;
      return prefix + String(nextNum).padStart(suffix.length, '0');
    } catch {
      return '------';
    }
  };

  // Fast history load/save with deduplication
  const loadHistoryForInterval = (sec: number) => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_STORAGE_PREFIX + sec) || '[]');
      if (Array.isArray(saved)) {
        const seen = new Set<string>();
        const unique = saved.filter((item) => {
          if (!item.period || seen.has(item.period)) return false;
          seen.add(item.period);
          return true;
        });
        setPredictionHistory(unique);
      }
    } catch {
      setPredictionHistory([]);
    }
  };

  const saveHistoryForInterval = (sec: number, data: PredictionRecord[]) => {
    try {
      const seen = new Set<string>();
      const unique = data.filter((item) => {
        if (!item.period || seen.has(item.period)) return false;
        seen.add(item.period);
        return true;
      });
      localStorage.setItem(HISTORY_STORAGE_PREFIX + sec, JSON.stringify(unique.slice(0, 300)));
    } catch {
      // Ignore quota error
    }
  };

  // Overall statistics for HESTORI tab
  const totalCompleted = predictionHistory.filter((p) => p.status !== 'Pending').length;
  const totalWins = predictionHistory.filter((p) => p.status === 'Win' || p.status === 'Double Win').length;
  const totalLosses = predictionHistory.filter((p) => p.status === 'Loss').length;
  const totalJackpots = predictionHistory.filter((p) => p.status === 'Double Win').length;
  const winRate = totalCompleted === 0 ? 0 : Math.round((totalWins / totalCompleted) * 100);

  const overallStats: OverallStats = {
    totalSignals: totalCompleted,
    totalWins,
    totalLosses,
    totalJackpots,
    winRate
  };

  // Synchronization with live API data
  const runDatabaseSynchronization = useCallback((historyArray: HistoryItem[]) => {
    if (!historyArray || historyArray.length === 0) return;

    historyArray.sort((a, b) => b.issue.localeCompare(a.issue));
    setHistoryLog(historyArray);

    const latest = historyArray[0];
    const finishedPeriod = latest.issue;
    const finishedNum = latest.num;
    const finishedSize = getBigSmall(finishedNum);
    const finishedColor = getColorName(finishedNum);

    if (!currentActivePeriod) {
      const nextIssue = computeNextIssue(finishedPeriod);
      setCurrentActivePeriod(nextIssue);
      setUpcomingIssueStr(`Upcoming: ${nextIssue}`);

      const { size, color } = runLogicPrediction(activeLogic, historyArray);
      setCurrentActiveSize(size);
      setCurrentActiveColor(color);
      setEngineLifecycleStatus('predicting');

      setPredictionHistory((prev) => {
        const updated: PredictionRecord[] = [
          {
            period: nextIssue,
            prediction: size,
            colorPrediction: color,
            actual: undefined,
            status: 'Pending',
            logicId: activeLogic,
            timestamp: Date.now()
          },
          ...prev.filter((p) => p.period !== nextIssue)
        ];
        saveHistoryForInterval(selectedInterval, updated);
        return updated;
      });

      processedPeriodsRef.current.add(finishedPeriod);
      setTimeout(() => {
        announceSignalVoice(nextIssue, size, color);
      }, 1000);
      return;
    }

    if (finishedPeriod === currentActivePeriod && !processedPeriodsRef.current.has(finishedPeriod)) {
      processedPeriodsRef.current.add(finishedPeriod);
      setEngineLifecycleStatus('result');

      const sizeMatch = currentActiveSize === finishedSize;
      const colorMatch = currentActiveColor === finishedColor;
      const isDoubleWin = sizeMatch && colorMatch;
      const isWin = sizeMatch || colorMatch; // Primary Win

      const statusResult = isDoubleWin ? 'Double Win' : isWin ? 'Win' : 'Loss';

      // Update logic stats
      setLogicStats((prev) => {
        const cur = prev[activeLogic] || { wins: 0, losses: 0 };
        return {
          ...prev,
          [activeLogic]: {
            wins: isWin ? cur.wins + 1 : cur.wins,
            losses: !isWin ? cur.losses + 1 : cur.losses
          }
        };
      });

      // Update prediction records instantly
      setPredictionHistory((prev) => {
        const nextList = [...prev];
        const target = nextList.find((p) => p.period === finishedPeriod);
        if (target) {
          target.actualNumber = finishedNum;
          target.actualSize = finishedSize;
          target.actualColor = finishedColor;
          target.actual = `${finishedSize} ${finishedColor} [${finishedNum}]`;
          target.status = statusResult;
        }
        saveHistoryForInterval(selectedInterval, nextList);
        return nextList;
      });

      const nextIssue = computeNextIssue(finishedPeriod);
      const nextPred = runLogicPrediction(activeLogic, historyArray);

      if (isWin) {
        const newStreak = winStreak + 1;
        setWinStreak(newStreak);
        setConsecutiveLosses(0);
        setRecoveryStep(1);
        setIsWaitingFor5thStep(false);
        setCooldownRoundsLeft(0);

        const periodShort = finishedPeriod.slice(-3);
        if (isDoubleWin) {
          setPredResult('🎰 DOUBLE WIN');
          setPredResultClass('text-fuchsia-300 font-extrabold text-sm');
          setLogoBadgeText('DOUBLE WIN');
          setLogoBadgeStyle({ bg: '#a100ff', color: '#fff' });
          speakVoice(`ডাবল প্রফিট উইন! পিরিয়ড ${periodShort} সাইজ ও কালার উভয়ই উইন!`);
        } else {
          setPredResult('✅ WIN');
          setPredResultClass('text-emerald-400 font-extrabold text-sm');
          setLogoBadgeText('WIN');
          setLogoBadgeStyle({ bg: '#19b66b', color: '#111' });
          speakVoice(`অভিনন্দন! পিরিয়ড ${periodShort} উইন! টানা ${newStreak} স্টেপ উইন!`);
        }

        playSoundEffect(isDoubleWin ? 'jackpot' : 'win');

        // Show Win Modal with User's Win Image & complete breakdown
        setResultModalData({
          show: true,
          type: 'win',
          period: finishedPeriod,
          sizeSignal: currentActiveSize || 'Big',
          colorSignal: currentActiveColor || 'Green',
          actualNumber: finishedNum,
          actualSize: finishedSize,
          actualColor: finishedColor,
          winStreak: newStreak,
          isDoubleWin: isDoubleWin
        });

        // 3-second auto-close: returns to signal bot view automatically
        setTimeout(() => {
          setResultModalData((prev) => ({ ...prev, show: false }));
        }, 3000);

        // After win announcement, announce upcoming signal
        setTimeout(() => {
          announceSignalVoice(nextIssue, nextPred.size, nextPred.color);
        }, 3200);
      } else {
        setPredResult('❌ LOSS');
        setPredResultClass('text-red-400 font-extrabold text-sm');
        setLogoBadgeText('LOSS');
        setLogoBadgeStyle({ bg: '#f65360', color: '#fff' });

        setWinStreak(0);
        const currentLossCount = consecutiveLosses + 1;
        setConsecutiveLosses(currentLossCount);
        const lossStep = recoveryStep;
        const nextStep = lossStep + 1;
        setRecoveryStep(nextStep);

        playSoundEffect('loss');

        // Show Loss Modal with User's Loss Image & complete breakdown
        setResultModalData({
          show: true,
          type: 'loss',
          period: finishedPeriod,
          sizeSignal: currentActiveSize || 'Big',
          colorSignal: currentActiveColor || 'Green',
          actualNumber: finishedNum,
          actualSize: finishedSize,
          actualColor: finishedColor,
          winStreak: 0,
          lossStep: lossStep,
          consecutiveLosses: currentLossCount
        });

        // 3-second auto-close: returns to signal bot view automatically
        setTimeout(() => {
          setResultModalData((prev) => ({ ...prev, show: false }));
        }, 3000);

        // --- USER'S EXACT 4-STEP LOSS SPEECH REQUIREMENT ---
        // "আর টানা ৪ ইস্টেপে লস হলে বট আমাকে বলে দিবে ভয়েজে।
        // " আজমিন ভাই আমরা টানা ৪ ইস্টেপে লস করছি আমরা ২-৩ টা সিগনাল পরে ৫ ইস্টেপ এর জন্য ৯৫% শিয়র হয়ে রিকুভারি সিগনাল দিবো অপেক্ষা করুন""
        if (currentLossCount >= 4) {
          const exactFourLossSpeech = 'আজমিন ভাই আমরা টানা ৪ ইস্টেপ লস করছি আমরা ২-৩ টা সিগনাল পরে ৫ ইস্টেপ এর জন্য ৯৫% শিয়র হয়ে রিকুভারি সিগনাল দিবো অপেক্ষা করুন';
          speakVoice(exactFourLossSpeech);

          setIsWaitingFor5thStep(true);
          // Set 2 rounds of silence to observe market patterns
          setCooldownRoundsLeft(2);
          setRecoveryStep(5);
        } else if (isWaitingFor5thStep && cooldownRoundsLeft > 1) {
          // Decrement cooldown round quietly without voice
          setCooldownRoundsLeft((prev) => prev - 1);
        } else if (isWaitingFor5thStep && cooldownRoundsLeft === 1) {
          // Cooldown finished! Announce 5th step 95% SURE RECOVERY SIGNAL!
          setCooldownRoundsLeft(0);
          setTimeout(() => {
            speakVoice(`আজমিন ভাই ৫ ইস্টেপ ৯৫% শিয়র রিকুভারি সিগনাল! পিরিয়ড নাম্বার ${nextIssue.slice(-3)} ${nextPred.size} ${nextPred.color}`);
          }, 2000);
        } else {
          speakVoice(`${lossStep} স্টেপ লস, ${nextStep} স্টেপ চলছে।`);
          setTimeout(() => {
            announceSignalVoice(nextIssue, nextPred.size, nextPred.color);
          }, 2600);
        }
      }

      setEngineLifecycleStatus('verified');

      setCurrentActivePeriod(nextIssue);
      setUpcomingIssueStr(`Upcoming: ${nextIssue}`);
      setCurrentActiveSize(nextPred.size);
      setCurrentActiveColor(nextPred.color);

      setPredictionHistory((prev) => {
        const updated: PredictionRecord[] = [
          {
            period: nextIssue,
            prediction: nextPred.size,
            colorPrediction: nextPred.color,
            actual: undefined,
            status: 'Pending',
            logicId: activeLogic,
            timestamp: Date.now()
          },
          ...prev.filter((p) => p.period !== nextIssue)
        ];
        saveHistoryForInterval(selectedInterval, updated);
        return updated;
      });

      setTimeout(() => {
        setPredResult('');
        setLogoBadgeText('⚡ LIVE');
        setLogoBadgeStyle({ bg: '#ff9f43', color: '#111' });
        setEngineLifecycleStatus('predicting');
      }, 5000);
    } else if (!processedPeriodsRef.current.has(finishedPeriod)) {
      processedPeriodsRef.current.add(finishedPeriod);
      const nextIssue = computeNextIssue(finishedPeriod);
      setUpcomingIssueStr(`Upcoming: ${nextIssue}`);

      if (currentActivePeriod && finishedPeriod > currentActivePeriod) {
        setCurrentActivePeriod(nextIssue);
        const nextPred = runLogicPrediction(activeLogic, historyArray);
        setCurrentActiveSize(nextPred.size);
        setCurrentActiveColor(nextPred.color);
        setEngineLifecycleStatus('predicting');
        announceSignalVoice(nextIssue, nextPred.size, nextPred.color, 1200);
      }
    }
  }, [activeLogic, currentActiveColor, currentActivePeriod, currentActiveSize, selectedInterval, speakVoice, announceSignalVoice, recoveryStep, winStreak, consecutiveLosses, isWaitingFor5thStep, cooldownRoundsLeft]);

  // Fetch API function
  const runRemoteAPIPooling = useCallback(async () => {
    try {
      const response = await fetch(`${API_URLS[selectedInterval]}?ts=${Date.now()}`);
      if (!response.ok) throw new Error('Network latency detected');

      const serverDateStr = response.headers.get('Date');
      if (serverDateStr) {
        serverTimeOffsetRef.current = new Date(serverDateStr).getTime() - Date.now();
      }

      const json = await response.json();
      const targetList = json?.data?.list || json?.Data || json?.data;

      if (Array.isArray(targetList)) {
        const history: HistoryItem[] = targetList
          .map((item: any) => ({
            issue: String(item.issueNumber || item.issue || item.Period || ''),
            num: parseInt(item.number || item.num || item.Number || 0, 10)
          }))
          .filter((item) => !isNaN(item.num) && item.issue);

        if (history.length > 0) {
          setModeNote(`Live ${selectedInterval}-second history connected. Predictions are live estimates.`);
          setLogoBadgeText('⚡ LIVE');
          setLogoBadgeStyle({ bg: '#19b66b', color: '#fff' });
          runDatabaseSynchronization(history);
        } else {
          throw new Error('No items in history response');
        }
      }
    } catch {
      setModeNote(`Could not load ${selectedInterval}-second market results. Checking connection...`);
      setEngineLifecycleStatus('waiting');
      setLogoBadgeText('OFFLINE');
      setLogoBadgeStyle({ bg: '#f65360', color: '#fff' });
    }
  }, [runDatabaseSynchronization, selectedInterval]);

  // High-frequency Timer loop (200ms) with 5, 4, 3, 2, 1 countdown beat & user logo
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = new Date(Date.now() + serverTimeOffsetRef.current);
      const epochSeconds = Math.floor(now.getTime() / 1000);
      const secInPeriod = epochSeconds % selectedInterval;
      
      // remaining seconds in current round
      let remaining = selectedInterval - secInPeriod;
      if (remaining <= 0) remaining = selectedInterval;

      setCountdownRemainingSec(remaining);
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      setTimerDigits([Math.floor(m / 10), m % 10, Math.floor(s / 10), s % 10]);

      // Last 5 seconds countdown state & deep bass kick
      if (remaining >= 1 && remaining <= 5) {
        setIsCountdown5s(true);
        if (lastBeatSecondRef.current !== remaining) {
          lastBeatSecondRef.current = remaining;
          playCountdownDeepBeat(remaining);
        }
      } else {
        setIsCountdown5s(false);
        lastBeatSecondRef.current = null;
      }

      const boundary = Math.floor(epochSeconds / selectedInterval);
      if ((remaining === 1 || remaining === selectedInterval) && lastFetchBoundaryRef.current !== boundary) {
        lastFetchBoundaryRef.current = boundary;
        setTimeout(() => {
          runRemoteAPIPooling();
        }, 1200);
      }
    }, 200);

    return () => clearInterval(timerInterval);
  }, [playCountdownDeepBeat, runRemoteAPIPooling, selectedInterval]);

  // Initial load
  useEffect(() => {
    loadHistoryForInterval(selectedInterval);
    runRemoteAPIPooling();
  }, [runRemoteAPIPooling, selectedInterval]);

  const handleModeSwitch = (mode: number) => {
    if (mode === selectedInterval) return;
    saveHistoryForInterval(selectedInterval, predictionHistory);
    setSelectedInterval(mode);
    processedPeriodsRef.current = new Set();
    setHistoryLog([]);
    loadHistoryForInterval(mode);
    setCurrentActivePeriod(null);
    setCurrentActiveSize(null);
    setCurrentActiveColor(null);
    setEngineLifecycleStatus('waiting');
    setPredResult('');
    setUpcomingIssueStr('Upcoming: --');
    setLogoBadgeText('LOADING');
    setLogoBadgeStyle({ bg: '#ff9f43', color: '#111' });
    lastFetchBoundaryRef.current = null;
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem(HISTORY_STORAGE_PREFIX + selectedInterval);
    } catch {
      // ignore
    }
    setPredictionHistory([]);
  };

  const latestResultItem = historyLog.length > 0 ? historyLog[0] : null;

  return (
    <div className={`min-h-screen bg-[#090314] text-[#fcfaff] flex justify-center p-0 select-none ${activeNavTab === 'game' ? (isGameNavHidden ? 'pb-2' : 'pb-20') : 'pb-16'}`}>
      {/* App Container */}
      <div className="w-full max-w-[480px] bg-[#0e051d] border-x border-[#8338ec]/20 shadow-[0_0_50px_rgba(131,56,236,0.22)] flex flex-col min-h-screen relative">
        
        {/* Top Header - Coral to Lavender Signature Gradient */}
        <div className="bg-gradient-to-r from-[#ff3366] via-[#ba38ca] to-[#7928ca] p-3 sm:p-4 text-white flex items-center justify-between border-b border-[#ff69b4]/50 shadow-[0_4px_22px_rgba(255,51,102,0.35)] sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-[#ffd66b] text-xl drop-shadow-[0_0_12px_#ffb300]">✦</span>
            <div>
              <div className="font-black text-xs sm:text-sm tracking-wide leading-tight drop-shadow-md">
                Professional Win Go Hacker
              </div>
              <div className="text-[10px] text-pink-100 font-semibold tracking-wider drop-shadow-sm">
                BUY AJMIN PRAMINK
              </div>
            </div>
            <span 
              className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md transition-all ml-1.5"
              style={{ backgroundColor: logoBadgeStyle.bg, color: logoBadgeStyle.color }}
            >
              {logoBadgeText}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) {
                  getAudioContext();
                  playCountdownDeepBeat(1);
                  speakVoice('সাউন্ড সক্রিয় করা হয়েছে');
                }
              }}
              title={soundEnabled ? 'Mute sound' : 'Enable sound'}
              className="p-1.5 rounded-lg bg-black/25 hover:bg-black/40 text-pink-100 transition-colors border border-white/20 active:scale-95 cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00ff88]" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>

            {/* Lock Security Button */}
            <button
              onClick={onLock}
              title="Lock Bot and Return to Security Gateway"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/35 hover:bg-black/55 border border-pink-300/40 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-pink-300" />
              <span>লক (LOCK)</span>
            </button>
          </div>
        </div>

        {/* Dynamic View Content based on Bottom Navigation */}
        <div className={`flex-1 ${activeNavTab === 'game' ? 'p-0 flex flex-col' : 'p-3 sm:p-4'} bg-gradient-to-b from-[#120622] via-[#0e051a] to-[#070311]`}>
          
          {/* TAB 1: HOME */}
          <div 
            style={{ display: activeNavTab === 'home' ? 'block' : 'none' }}
            className="space-y-3.5"
          >
            {/* Top Card: Timer & Current Game - Pure Coral & Lavender Card */}
            <div className="relative bg-gradient-to-r from-[#ff477e] via-[#c056d6] to-[#7928ca] rounded-2xl p-4 text-white shadow-[0_8px_30px_rgba(255,71,126,0.35)] border border-[#ff85c0]/50 flex flex-wrap justify-between items-center gap-2 overflow-hidden">
              
              {/* Left Column: Title & Last Draw Ball */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-white/20 border border-white/60 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide">
                  <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                  <span>BY AJMIN PRAMINK</span>
                </div>
                <div className="text-base font-black tracking-wide drop-shadow-md">
                  {selectedInterval === 60 ? 'WINGO 1 MIN' : 'WINGO 30 SEC'}
                </div>
                {latestResultItem && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-lg border border-white/60 ${
                        latestResultItem.num === 0 || latestResultItem.num === 5
                          ? 'bg-[#b5179e] text-white'
                          : latestResultItem.num % 2 === 0
                          ? 'bg-[#ff385c] text-white'
                          : 'bg-[#00e676] text-black font-extrabold'
                      }`}
                    >
                      {latestResultItem.num}
                    </div>
                    <span className="text-xs font-black text-yellow-300 tracking-wider drop-shadow">
                      {getBigSmall(latestResultItem.num)} · {getColorName(latestResultItem.num)}
                    </span>
                  </div>
                )}
              </div>

              {/* Right Column: Digital Timer Display */}
              <div className="text-right space-y-1">
                <div className="text-[11px] text-pink-100 font-semibold drop-shadow-sm">
                  {isCountdown5s ? (
                    <span className="text-yellow-300 font-black animate-pulse flex items-center justify-end gap-1">
                      🔥 DEEP BEAT: {countdownRemainingSec}s
                    </span>
                  ) : (
                    'Time remaining'
                  )}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <div className="bg-white text-[#240046] font-black text-xl w-8 h-9 rounded-lg flex items-center justify-center shadow-md">
                    {timerDigits[0]}
                  </div>
                  <div className="bg-white text-[#240046] font-black text-xl w-8 h-9 rounded-lg flex items-center justify-center shadow-md">
                    {timerDigits[1]}
                  </div>
                  <span className="text-xl font-black text-white px-0.5">:</span>
                  <div className="bg-white text-[#240046] font-black text-xl w-8 h-9 rounded-lg flex items-center justify-center shadow-md">
                    {timerDigits[2]}
                  </div>
                  <div className={`font-black text-xl w-8 h-9 rounded-lg flex items-center justify-center shadow-md transition-all ${
                    isCountdown5s
                      ? 'bg-[#ffebee] text-[#ff0055] ring-2 ring-[#ff0055] shadow-[0_0_18px_#ff0055] scale-110 animate-pulse'
                      : 'bg-white text-[#240046]'
                  }`}>
                    {timerDigits[3]}
                  </div>
                </div>
                <div className="text-[11px] text-pink-200 font-mono tracking-tight font-medium">
                  {upcomingIssueStr}
                </div>
              </div>
            </div>

            {/* Mode Switch (1 MIN vs 30 SEC) */}
            <div className="bg-[#140626] border-2 border-[#5a189a]/70 rounded-xl p-1.5 flex gap-2 shadow-[0_0_18px_rgba(121,40,202,0.2)]">
              <button
                onClick={() => handleModeSwitch(60)}
                className={`flex-1 py-2 rounded-lg font-black text-xs tracking-wider transition-all cursor-pointer ${
                  selectedInterval === 60
                    ? 'bg-gradient-to-r from-[#ff3366] via-[#ba38ca] to-[#7928ca] text-white shadow-[0_0_16px_rgba(255,51,102,0.45)] border border-[#ff85c0]'
                    : 'bg-[#220e38] text-purple-200 hover:text-white'
                }`}
              >
                ⏱ 1 MIN SIGNAL
              </button>
              <button
                onClick={() => handleModeSwitch(30)}
                className={`flex-1 py-2 rounded-lg font-black text-xs tracking-wider transition-all cursor-pointer ${
                  selectedInterval === 30
                    ? 'bg-gradient-to-r from-[#ff3366] via-[#ba38ca] to-[#7928ca] text-white shadow-[0_0_16px_rgba(255,51,102,0.45)] border border-[#ff85c0]'
                    : 'bg-[#220e38] text-purple-200 hover:text-white'
                }`}
              >
                ⚡ 30 SEC SIGNAL
              </button>
            </div>
            <div className="text-[10px] text-purple-300/80 text-center font-medium">
              {modeNote}
            </div>

            {/* Special 4-Step Loss: Waiting for 95% Safe 5th Step Recovery Card */}
            {isWaitingFor5thStep && (
              <div className="bg-gradient-to-r from-[#ff0055]/35 via-[#7928ca]/40 to-[#ff0055]/35 border-2 border-[#ff3366] rounded-2xl p-4 text-center shadow-[0_0_35px_rgba(255,0,85,0.45)] animate-pulse">
                <div className="flex items-center justify-center gap-2 mb-1.5 flex-wrap">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-black text-[#ffd66b] uppercase tracking-wider">
                    🚨 আজমিন ভাই: টানা ৪ ইস্টেপ লস সতর্কবার্তা!
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-400 to-green-600 text-black border border-yellow-200">
                    🎯 ৯৫% শিয়র ৫ ইস্টেপ
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-black text-white leading-snug drop-shadow-md">
                  "আজমিন ভাই আমরা টানা ৪ ইস্টেপ লস করছি আমরা ২-৩ টা সিগনাল পরে ৫ ইস্টেপ এর জন্য ৯৫% শিয়র হয়ে রিকুভারি সিগনাল দিবো অপেক্ষা করুন"
                </div>
                <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-yellow-300 font-bold bg-black/40 py-1.5 px-3 rounded-xl border border-yellow-400/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>
                    {cooldownRoundsLeft > 0
                      ? `ভয়েস নীরব রাখা হয়েছে: আরও ${cooldownRoundsLeft} রাউন্ড বাজার অ্যানালাইসিস চলছে...`
                      : '✅ ৯৫% শিয়র ৫ ইস্টেপ রিকভারি সিগন্যাল প্রস্তুত!'}
                  </span>
                </div>
              </div>
            )}

            {/* MAIN PREDICTION BOX: Focuses Exclusively on B/S (Big/Small) and Color (Red/Green) */}
            <div className="bg-gradient-to-b from-[#1c0830] via-[#120522] to-[#0a0216] border-2 border-[#ba38ca]/60 rounded-3xl p-4 shadow-[0_10px_35px_rgba(186,56,202,0.25)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-800/40">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-200">
                    PERIOD:
                  </span>
                  <span className="text-yellow-300 font-mono font-black text-sm tracking-wider">
                    {currentActivePeriod ? currentActivePeriod.slice(-6) : '------'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {recoveryStep === 5 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-black border border-yellow-200 animate-pulse">
                      🎯 ৫ ইস্টেপ ৯৫%
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ff3366]/20 border border-[#ff85c0]/50 text-pink-200">
                    {activeLogic === 1 ? 'Pattern Master' : activeLogic === 2 ? 'Frequency' : 'Hybrid AI'}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    engineLifecycleStatus === 'predicting'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white animate-pulse'
                      : engineLifecycleStatus === 'verified'
                      ? 'bg-emerald-500 text-black font-extrabold'
                      : 'bg-purple-950 text-purple-300 border border-purple-800'
                  }`}>
                    {engineLifecycleStatus}
                  </span>
                </div>
              </div>

              {/* Dual Signal Display: B/S (Big/Small) AND Color (Red/Green) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* 1. B/S Signal Card */}
                <div className="relative rounded-2xl p-3 border-2 border-white/20 bg-gradient-to-b from-[#280c3b] to-[#140522] shadow-[0_6px_20px_rgba(0,0,0,0.4)] flex flex-col items-center">
                  <span className="text-[10px] text-purple-300 font-black uppercase tracking-wider">
                    B / S সিগন্যাল
                  </span>
                  <div
                    className={`mt-1.5 w-full py-2.5 rounded-xl font-black text-center text-lg uppercase tracking-wider transition-all shadow-lg ${
                      currentActiveSize === 'Big'
                        ? 'bg-gradient-to-r from-[#ff7a00] via-[#ff3b56] to-[#d90429] text-white shadow-[0_0_20px_rgba(255,122,0,0.6)]'
                        : currentActiveSize === 'Small'
                        ? 'bg-gradient-to-r from-[#00d2ff] via-[#3a86ff] to-[#7928ca] text-white shadow-[0_0_20px_rgba(0,210,255,0.6)]'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {engineLifecycleStatus === 'waiting' ? '--' : currentActiveSize || '--'}
                  </div>
                  <span className="text-[10px] text-pink-200/70 font-semibold mt-1">
                    {currentActiveSize === 'Big' ? 'বড় (৫, ৬, ৭, ৮, ৯)' : currentActiveSize === 'Small' ? 'ছোট (০, ১, ২, ৩, ৪)' : 'সিগন্যাল সিঙ্ক হচ্ছে'}
                  </span>
                </div>

                {/* 2. Color Signal Card */}
                <div className="relative rounded-2xl p-3 border-2 border-white/20 bg-gradient-to-b from-[#280c3b] to-[#140522] shadow-[0_6px_20px_rgba(0,0,0,0.4)] flex flex-col items-center">
                  <span className="text-[10px] text-purple-300 font-black uppercase tracking-wider">
                    কালার সিগন্যাল
                  </span>
                  <div
                    className={`mt-1.5 w-full py-2.5 rounded-xl font-black text-center text-lg uppercase tracking-wider transition-all shadow-lg ${
                      currentActiveColor === 'Green'
                        ? 'bg-gradient-to-r from-[#00e676] to-[#00b348] text-black shadow-[0_0_20px_rgba(0,230,118,0.6)]'
                        : currentActiveColor === 'Red'
                        ? 'bg-gradient-to-r from-[#ff3366] to-[#d50000] text-white shadow-[0_0_20px_rgba(255,51,102,0.6)]'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {engineLifecycleStatus === 'waiting' ? '--' : currentActiveColor || '--'}
                  </div>
                  <span className="text-[10px] text-pink-200/70 font-semibold mt-1">
                    {currentActiveColor === 'Green' ? 'গ্রীন (১, ৩, ৭, ৯)' : currentActiveColor === 'Red' ? 'রেড (২, ৪, ৬, ৮)' : 'সিগন্যাল সিঙ্ক হচ্ছে'}
                  </span>
                </div>
              </div>

              {/* Status Announcement Bar */}
              <div className="flex items-center justify-between bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-xs">
                <span className="text-purple-300/80 font-medium text-[11px]">
                  ভয়েস স্টেট:
                </span>
                <span className="text-yellow-300 font-bold text-[11px] font-mono">
                  {isWaitingFor5thStep && cooldownRoundsLeft > 0
                    ? '🔇 নীরব মোড (৫ ইস্টেপ এনালাইসিস)'
                    : currentActivePeriod
                    ? `পিরিয়ড ${currentActivePeriod.slice(-3)} ${currentActiveSize || ''} ${currentActiveColor || ''}`
                    : 'অপেক্ষমাণ...'}
                </span>
                {predResult && (
                  <span className={predResultClass}>
                    {predResult}
                  </span>
                )}
              </div>
            </div>

            {/* Color Filters */}
            <div className="bg-[#170a29] border border-[#4a1c72] rounded-2xl p-2 flex gap-2">
              <button
                onClick={() => setActiveFilter('green')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all shadow cursor-pointer ${
                  activeFilter === 'green'
                    ? 'bg-gradient-to-r from-[#00e676] to-[#00b348] text-black font-black shadow-[0_0_14px_rgba(0,230,118,0.5)]'
                    : 'bg-emerald-950/40 text-emerald-300 opacity-60'
                }`}
              >
                Green
              </button>
              <button
                onClick={() => setActiveFilter('violet')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs tracking-wider text-white transition-all shadow cursor-pointer ${
                  activeFilter === 'violet'
                    ? 'bg-gradient-to-r from-[#d000ff] to-[#7928ca] shadow-[0_0_14px_rgba(208,0,255,0.5)]'
                    : 'bg-purple-950/40 text-purple-300 opacity-60'
                }`}
              >
                Violet
              </button>
              <button
                onClick={() => setActiveFilter('red')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs tracking-wider text-white transition-all shadow cursor-pointer ${
                  activeFilter === 'red'
                    ? 'bg-gradient-to-r from-[#ff3366] to-[#d50000] shadow-[0_0_14px_rgba(255,51,102,0.5)]'
                    : 'bg-red-950/40 text-red-300 opacity-60'
                }`}
              >
                Red
              </button>
            </div>

            {/* 3D Crystal Spheres (Number Reference 0-9) */}
            <div className="bg-gradient-to-b from-[#190b2e] to-[#0f061c] border border-[#4c1d7a] rounded-3xl p-3.5 sm:p-4 grid grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const isSelected = selectedNum === num;
                const isGreen = num === 1 || num === 3 || num === 7 || num === 9;
                const isViolet = num === 0 || num === 5;
                const sphereColor = isViolet ? 'purple' : isGreen ? 'green' : 'red';

                return (
                  <button
                    key={num}
                    onClick={() => setSelectedNum(num)}
                    className={`num-btn ${sphereColor} ${
                      isSelected ? 'selected-orb ring-4 ring-yellow-400' : ''
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Controls: Random & Multipliers */}
            <div className="bg-[#170a29] border border-[#4a1c72] rounded-xl p-2.5 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const rand = Math.floor(Math.random() * 10);
                  setSelectedNum(rand);
                }}
                className="bg-gradient-to-r from-[#ff3366] to-[#9d4edd] text-white border border-[#ff85c0] rounded-lg px-3.5 py-1.5 font-bold text-xs shadow-[0_0_12px_rgba(255,51,102,0.35)] active:scale-95 transition-all cursor-pointer"
              >
                Random
              </button>
              <div className="flex gap-1.5 flex-1 justify-between">
                {[1, 5, 10, 20, 50, 100].map((mult) => (
                  <button
                    key={mult}
                    onClick={() => setSelectedMult(mult)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      selectedMult === mult
                        ? 'bg-gradient-to-r from-[#00e676] to-[#00b348] text-black font-extrabold border-[#69f0ae] shadow-[0_0_10px_rgba(0,230,118,0.5)]'
                        : 'bg-gradient-to-b from-[#250f3b] to-[#160826] text-purple-200 border-[#561a86] hover:border-purple-400'
                    }`}
                  >
                    X{mult}
                  </button>
                ))}
              </div>
            </div>

            {/* Big / Small Choice */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedBs('big')}
                className={`flex-1 py-3.5 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-md border cursor-pointer ${
                  selectedBs === 'big'
                    ? 'bg-gradient-to-r from-[#ff6b35] via-[#ff3366] to-[#c70039] text-white border-white/40 shadow-[0_0_18px_rgba(255,51,102,0.45)] scale-[1.01]'
                    : 'bg-orange-950/40 text-orange-200/70 border-orange-900/50'
                }`}
              >
                BIG
              </button>
              <button
                onClick={() => setSelectedBs('small')}
                className={`flex-1 py-3.5 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-md border cursor-pointer ${
                  selectedBs === 'small'
                    ? 'bg-gradient-to-r from-[#00b4d8] via-[#3a86ff] to-[#7928ca] text-white border-white/40 shadow-[0_0_18px_rgba(0,180,216,0.45)] scale-[1.01]'
                    : 'bg-blue-950/40 text-blue-200/70 border-blue-900/50'
                }`}
              >
                SMALL
              </button>
            </div>

            {/* Tab Navigation: Game History, Prediction History, Bypass Logic */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all border cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-[#ff3366] via-[#ba38ca] to-[#7928ca] text-white border-[#ff85c0] shadow-[0_0_16px_rgba(255,51,102,0.4)]'
                    : 'bg-gradient-to-b from-[#1b0a30] to-[#10051d] text-purple-200 border-[#4a1c72]'
                }`}
              >
                Game History
              </button>
              <button
                onClick={() => setActiveTab('predictions')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all border cursor-pointer ${
                  activeTab === 'predictions'
                    ? 'bg-gradient-to-r from-[#ff3366] via-[#ba38ca] to-[#7928ca] text-white border-[#ff85c0] shadow-[0_0_16px_rgba(255,51,102,0.4)]'
                    : 'bg-gradient-to-b from-[#1b0a30] to-[#10051d] text-purple-200 border-[#4a1c72]'
                }`}
              >
                Prediction History
              </button>
              <button
                onClick={() => setActiveTab('bypass')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all border cursor-pointer ${
                  activeTab === 'bypass'
                    ? 'bg-gradient-to-r from-[#ff3366] via-[#ba38ca] to-[#7928ca] text-white border-[#ff85c0] shadow-[0_0_16px_rgba(255,51,102,0.4)]'
                    : 'bg-gradient-to-b from-[#1b0a30] to-[#10051d] text-purple-200 border-[#4a1c72]'
                }`}
              >
                BYPASS LOGIC
              </button>
            </div>

            {/* Tab 1: Game History */}
            {activeTab === 'history' && (
              <div className="bg-[#120622] border border-[#7928ca]/50 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(121,40,202,0.2)]">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#ba38ca] via-[#7928ca] to-[#5a189a] text-white text-xs font-bold">
                      <th className="py-2.5 px-2">Period</th>
                      <th className="py-2.5 px-2">Number</th>
                      <th className="py-2.5 px-2">Big / Small</th>
                      <th className="py-2.5 px-2">Color</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#351854] text-xs">
                    {historyLog.slice(0, DISPLAY_COUNT).map((item) => {
                      const color = getColorName(item.num);
                      return (
                        <tr key={item.issue} className="hover:bg-purple-950/30">
                          <td className="py-2.5 px-2 text-purple-200 font-mono">{item.issue}</td>
                          <td className={`py-2.5 px-2 font-black text-base ${
                            color === 'Violet' ? 'text-purple-300 drop-shadow-[0_0_6px_#c084fc]' : color === 'Green' ? 'text-emerald-400 drop-shadow-[0_0_6px_#34d399]' : 'text-rose-400 drop-shadow-[0_0_6px_#f43f5e]'
                          }`}>
                            {item.num}
                          </td>
                          <td className="py-2.5 px-2 text-[#ffd166] font-bold">
                            {getBigSmall(item.num)}
                          </td>
                          <td className="py-2.5 px-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold shadow ${
                                color === 'Violet'
                                  ? 'bg-[#b5179e] text-white'
                                  : color === 'Green'
                                  ? 'bg-[#00e676] text-black font-extrabold'
                                  : 'bg-[#ff385c] text-white'
                              }`}
                            >
                              {color}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {historyLog.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-purple-300/60 font-medium">
                          Loading live market history...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Prediction History with B/S & Color */}
            {activeTab === 'predictions' && (
              <div className="bg-[#120622] border border-[#7928ca]/50 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(121,40,202,0.2)]">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#ba38ca] via-[#7928ca] to-[#5a189a] text-white text-xs font-bold">
                      <th className="py-2.5 px-1.5">Period</th>
                      <th className="py-2.5 px-1.5">B/S & Color</th>
                      <th className="py-2.5 px-1.5">Actual</th>
                      <th className="py-2.5 px-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#351854] text-xs">
                    {predictionHistory.slice(0, 18).map((item, idx) => {
                      const status = item.status;
                      const isDouble = status === 'Double Win';
                      const isWin = status === 'Win';
                      const isLoss = status === 'Loss';
                      return (
                        <tr key={`${item.period}-${idx}`} className="hover:bg-purple-950/30">
                          <td className="py-2.5 px-1.5 font-mono text-purple-200">{item.period.slice(-6)}</td>
                          <td className="py-2.5 px-1.5 font-bold text-white">
                            <span className={item.prediction === 'Big' ? 'text-orange-400' : 'text-cyan-400'}>
                              {item.prediction}
                            </span>{' '}
                            <span className={item.colorPrediction === 'Green' ? 'text-emerald-400' : 'text-rose-400'}>
                              {item.colorPrediction}
                            </span>
                          </td>
                          <td className="py-2.5 px-1.5 text-purple-200">{item.actual || '-'}</td>
                          <td className={`py-2.5 px-1.5 font-extrabold ${
                            isDouble ? 'text-fuchsia-300 drop-shadow-[0_0_6px_#d946ef]' : isWin ? 'text-emerald-400 drop-shadow-[0_0_6px_#10b981]' : isLoss ? 'text-rose-400 drop-shadow-[0_0_6px_#f43f5e]' : 'text-amber-400'
                          }`}>
                            {isDouble ? '🎰 DOUBLE' : isWin ? '✅ WIN' : isLoss ? '❌ LOSS' : '⏳ PENDING'}
                          </td>
                        </tr>
                      );
                    })}
                    {predictionHistory.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-purple-300/60 font-medium">
                          No prediction records yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Bypass Logic */}
            {activeTab === 'bypass' && (
              <div className="space-y-3">
                <div className="text-xs text-purple-200/80 text-center font-medium">
                  Select an AI logic engine for B/S & Color predictions. Each uses a distinct predictive pattern.
                </div>
                <div className="space-y-2.5">
                  {[
                    {
                      id: 1,
                      icon: '🎯',
                      name: 'Pattern Master',
                      desc: 'Analyzes streaks, alternations, and sequence parity'
                    },
                    {
                      id: 2,
                      icon: '📊',
                      name: 'Frequency Analyzer',
                      desc: 'Targets hot & cold numbers with Poisson variance'
                    },
                    {
                      id: 3,
                      icon: '🧠',
                      name: 'Hybrid Intelligence',
                      desc: 'Combines multi-engine heuristics for enhanced confidence'
                    }
                  ].map((logic) => {
                    const stat = logicStats[logic.id] || { wins: 0, losses: 0 };
                    const total = stat.wins + stat.losses;
                    const accuracy = total > 0 ? Math.round((stat.wins / total) * 100) : 0;
                    const isActive = activeLogic === logic.id;

                    return (
                      <div
                        key={logic.id}
                        onClick={() => setActiveLogic(logic.id)}
                        className={`p-3.5 rounded-2xl cursor-pointer border transition-all flex items-center gap-3.5 shadow-md ${
                          isActive
                            ? 'bg-gradient-to-r from-[#32104d] to-[#180927] border-[#ff3366] shadow-[0_0_20px_rgba(255,51,102,0.3)]'
                            : 'bg-gradient-to-r from-[#1d0c34] to-[#10071f] border-[#54228b] hover:border-purple-400'
                        }`}
                      >
                        <div className="text-2xl">{logic.icon}</div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-[#ff85c0]">{logic.name}</div>
                          <div className="text-[11px] text-[#e0aaff]">{logic.desc}</div>
                          <div className="flex gap-3 text-xs mt-1 font-mono">
                            <div>
                              <span className="text-emerald-400 font-extrabold">{stat.wins}</span>{' '}
                              <span className="text-[10px] text-gray-300 uppercase">Wins</span>
                            </div>
                            <div>
                              <span className="text-[#ffd166] font-extrabold">{accuracy}%</span>{' '}
                              <span className="text-[10px] text-gray-300 uppercase">Accuracy</span>
                            </div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-xs ${
                          isActive
                            ? 'bg-emerald-500 border-emerald-400 text-black'
                            : 'border-purple-700 text-transparent'
                        }`}>
                          ✓
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* TAB 2: GAME (Full Display Live Game - Permanently mounted in DOM so it NEVER reloads) */}
          <div 
            style={{ display: activeNavTab === 'game' ? 'flex' : 'none' }}
            className="w-full flex-1 flex-col"
          >
            <GameView 
              currentPrediction={currentActiveSize ? `${currentActiveSize} ${currentActiveColor || ''}` : null} 
              currentPeriod={currentActivePeriod}
              isBottomNavHidden={isGameNavHidden}
              onToggleBottomNav={() => setIsGameNavHidden((prev) => !prev)}
            />
          </div>

          {/* TAB 3: HESTORI (3D stats, B/S & Color metrics, Fast sync) */}
          {activeNavTab === 'hestori' && (
            <HistoryView
              stats={overallStats}
              predictions={predictionHistory}
              onClearHistory={handleClearHistory}
              selectedInterval={selectedInterval}
            />
          )}

          {/* TAB 4: PROFILE */}
          {activeNavTab === 'profile' && (
            <ProfileView onLock={onLock} />
          )}

        </div>

        {/* Persistent Bottom Navigation: HOME, GAME, HESTORI, PROFILE in 1 row */}
        {(!isGameNavHidden || activeNavTab !== 'game') ? (
          <BottomNav
            activeTab={activeNavTab}
            onTabChange={(tab) => {
              playSoundEffect('tick');
              setActiveNavTab(tab);
            }}
          />
        ) : (
          <button
            onClick={() => setIsGameNavHidden(false)}
            className="fixed bottom-3 right-4 z-40 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#ff3366] via-[#ba38ca] to-[#7928ca] text-white text-xs font-black shadow-[0_0_20px_rgba(255,51,102,0.6)] border border-white/50 flex items-center gap-1.5 animate-bounce cursor-pointer"
            title="মেনু বার পুনরায় দেখান"
          >
            <span>☰ মেনু বার দেখান</span>
          </button>
        )}

      </div>

      {/* 5-Second Full Image Dynamic Countdown Overlay */}
      <Countdown5sOverlay
        show={isCountdown5s}
        remainingSec={countdownRemainingSec}
      />

      {/* Floating 3D Result Celebration & Loss Notice Modal */}
      <WinCelebrationModal
        show={resultModalData.show}
        type={resultModalData.type}
        onClose={handleCloseResultModal}
        period={resultModalData.period}
        sizeSignal={resultModalData.sizeSignal}
        colorSignal={resultModalData.colorSignal}
        actualNumber={resultModalData.actualNumber}
        actualSize={resultModalData.actualSize}
        actualColor={resultModalData.actualColor}
        winStreak={resultModalData.winStreak}
        lossStep={resultModalData.lossStep}
        consecutiveLosses={resultModalData.consecutiveLosses}
        isDoubleWin={resultModalData.isDoubleWin}
      />
    </div>
  );
};
