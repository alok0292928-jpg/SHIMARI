
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
  spawnTime?: number;
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
  type: 'DEPOSIT' | 'WITHDRAW' | 'LOOT_WIN' | 'LOOT_LOSS' | 'REFERRAL_BONUS';
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
  kills?: number;
  gameType: string;
  duration?: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  balance: number;
  totalWon: number;
  referralCode: string;
  invitedCount: number;
  luck?: number; 
}

export type GameID = 
  // Arena
  'WORM' | 'SNAKE_RUSH' |
  // Betting
  'ROCKET' | 'MINES' | 'DRAGON_TIGER' | 'CROWD_BREAKER' | 'DALGONA' | 'RED_LIGHT' | 'CHICKEN_ROAD' |
  // Legacy/Others
  'TOWER' | 'PLINKO' | 'TEEN_PATTI' | 'ANDAR_BAHAR' | 'QUIZ';

export interface Point {
  x: number;
  y: number;
}

export type AppTab = 'HOME' | 'ACTIVITY' | 'ACCOUNT' | 'GAME' | 'ADMIN';
