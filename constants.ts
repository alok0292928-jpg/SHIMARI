
export const WORLD_SIZE = 4000;
export const BASE_SPEED = 2.8;
export const BOOST_SPEED = 5.2;
export const SEGMENT_DISTANCE = 15;
export const DEFAULT_ENTRY_FEE = 10.00;
export const FOOD_VALUE = 0.50;
export const MIN_RIVALS = 20;
export const FOOD_COUNT = 1000;

export const GAME_MODES = [10, 50, 100, 500, 1000];

export const CATEGORIES = [
  { id: 'ARENA', name: 'Snake Arena', icon: '🐍' },
  { id: 'BETTING', name: 'AI Betting', icon: '🎰' }
];

export const GAMES = [
  // FLAGSHIP MODES
  { id: 'WORM', cat: 'ARENA', name: 'Worm Hunter', description: 'Infinite Survival & Loot', color: 'from-[#f39c12] to-[#d35400]', image: 'https://cdn-icons-png.flaticon.com/512/2829/2829107.png', tag: 'CLASSIC' },
  { id: 'SNAKE_RUSH', cat: 'ARENA', name: 'Snake Rush BR', description: '10-Player Winner Takes All', color: 'from-[#34d399] to-[#064e3b]', image: 'https://cdn-icons-png.flaticon.com/512/2829/2829107.png', tag: 'MASSIVE' },

  // BETTING MODES
  { id: 'CHICKEN_ROAD', cat: 'BETTING', name: 'Chicken Road', description: 'Risk the Crossing • 100x', color: 'from-green-500 to-green-900', image: 'https://cdn-icons-png.flaticon.com/512/2829/2829871.png', tag: 'NEW' },
  { id: 'ROCKET', cat: 'BETTING', name: 'Aviator', description: 'Real-Time Crash Multiplier', color: 'from-red-600 to-red-900', image: 'https://i.ibb.co/Lz0xS9m/aviator-icon.png', tag: 'HOT' },
  { id: 'DRAGON_TIGER', cat: 'BETTING', name: 'Dragon vs Tiger', description: 'Global Multiplayer Poker', color: 'from-indigo-600 to-purple-900', image: 'https://cdn-icons-png.flaticon.com/512/1055/1055813.png', tag: 'NEW' },
  { id: 'RED_LIGHT', cat: 'BETTING', name: 'Red Light', description: 'Green Light Survivor • 4.5x', color: 'from-amber-600 to-red-900', image: 'https://cdn-icons-png.flaticon.com/512/6128/6128682.png', tag: 'POPULAR' },
  { id: 'DALGONA', cat: 'BETTING', name: 'Dalgona Survivor', description: 'Squid Game • 9x Payout', color: 'from-pink-600 to-pink-950', image: 'https://cdn-icons-png.flaticon.com/512/6128/6128682.png', tag: 'POPULAR' },
  { id: 'CROWD_BREAKER', cat: 'BETTING', name: 'Crowd Breaker', description: 'Minority Wins • Tug of War', color: 'from-green-600 to-red-600', image: 'https://cdn-icons-png.flaticon.com/512/3504/3504547.png', tag: 'NEW' }
];

export const COLORS = {
  gold: '#f39c12',
  goldDark: '#d35400',
  bg: '#0a0e17',
  card: '#161d2b',
  cardLight: '#1e293b',
  textDim: '#94a3b8',
  success: '#28a745', 
  danger: '#e91e63',  
  aviatorBg: '#1b1c1d',
  aviatorPanel: '#2c2d2e'
};

export const WORM_COLORS = ['#34d399', '#60a5fa', '#f87171', '#fbbf24', '#a78bfa', '#f472b6'];
export const THEME = COLORS;

export const NAMES = [
  'ViperPro', 'AceHunter', 'GoldSnake', 'NeonWraith',
  'CryptoKing', 'LootLegend', 'ApexBeast', 'ShikaarGod',
  'ShadowScale', 'SwiftFang', 'VenomStrike', 'VoidRacer',
  'MumbaiMaverick', 'BetMaster', 'StrikeZen'
];

export const DEPOSIT_AMOUNTS = [100, 500, 1000, 5000, 10000];
