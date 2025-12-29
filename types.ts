
export interface Point {
  x: number;
  y: number;
}

export interface Worm {
  id: string;
  name: string;
  segments: Point[];
  angle: number;
  speed: number;
  balance: number;
  color: string;
  isPlayer: boolean;
  isDead: boolean;
}

export interface Food {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
}

export interface KillEvent {
  id: string;
  killerName: string;
  victimName: string;
  lootAmount: number;
  timestamp: number;
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'LOOT_WIN' | 'LOOT_LOSS';
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  date: number;
  utr?: string;
  upiId?: string;
}

export interface MatchHistory {
  id: string;
  date: number;
  earnings: number;
  kills: number;
  duration: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  balance: number;
  totalWon: number;
}

export type AppTab = 'HOME' | 'ACTIVITY' | 'ACCOUNT' | 'GAME' | 'ADMIN';
