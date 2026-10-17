export type NavTab = 'home' | 'game' | 'hestori' | 'profile';

export interface HistoryItem {
  issue: string;
  num: number;
}

export type ColorType = 'Green' | 'Red' | 'Violet';
export type SizeType = 'Big' | 'Small';

export interface PredictionRecord {
  period: string;
  prediction: SizeType;
  colorPrediction: 'Green' | 'Red';
  actualSize?: SizeType;
  actualColor?: ColorType | string;
  actualNumber?: number;
  actual?: string;
  status: 'Win' | 'Loss' | 'Double Win' | 'Pending';
  logicId?: number;
  timestamp?: number;
}

export interface OverallStats {
  totalSignals: number;
  totalWins: number;
  totalLosses: number;
  totalJackpots: number; // Used for Double Win (Big/Small + Color match)
  winRate: number;
}
