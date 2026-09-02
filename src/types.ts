export type CityTheme = 
  | 'sunset_rooftop' 
  | 'neon_night' 
  | 'golden_hour' 
  | 'thunder_storm' 
  | 'crimson_dawn' 
  | 'oscorp_lab';

export interface Suit {
  id: string;
  name: string;
  title: string;
  primaryColor: string;
  secondaryColor: string;
  eyeColor: string;
  trailColor: string;
  glowColor: string;
  unlocked: boolean;
  unlockedAtScore: number;
  description: string;
  specialAbility: string;
  stats: {
    speed: number;
    jump: number;
    power: number;
  };
}

export type VillainType = 
  | 'green_goblin' 
  | 'doc_ock' 
  | 'electro' 
  | 'venom' 
  | 'rhino' 
  | 'oscorp_drone'
  | 'pumpkin_bomb'
  | 'electro_zap'
  | 'symbiote_spike'
  | 'rooftop_barrier';

export type ObstacleType = VillainType;

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  color: string;
  hp: number;
  maxHp: number;
  speed: number;
  vy?: number;
  sinOffset?: number;
  isAirborne?: boolean;
  isBoss?: boolean;
  bossPhase?: number;
  bossName?: string;
  stateTimer?: number;
  attackTimer?: number;
  subProjectiles?: { x: number; y: number; vx: number; vy: number; radius: number; color: string; isLaser?: boolean }[];
  tentacles?: { angle: number; length: number; targetX: number; targetY: number }[];
  chargeRatio?: number;
}

export interface WebShot {
  id: string;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  vx: number;
  vy: number;
  length: number;
  isAttached?: boolean;
  isMega?: boolean;
  color?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type?: 'smoke' | 'spark' | 'ember' | 'web' | 'comic_text' | 'ring' | 'lightning' | 'speed_line' | 'hex_shard' | 'shockwave' | 'glider_smoke' | 'electric_arc';
  text?: string;
  scale?: number;
  rotation?: number;
}

export type PowerUpType = 'spider_shield' | 'magnet_rush' | 'double_score' | 'web_wings';

export interface PowerUpItem {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
  radius: number;
  rotation: number;
}

export interface Coin {
  id: string;
  x: number;
  y: number;
  collected: boolean;
  isSuper?: boolean;
  rotation?: number;
}

export interface ActiveEventAlert {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  type: 'boss' | 'powerup' | 'shield' | 'combo' | 'level_complete';
  duration: number; // in frames
}

export interface IncomingThreat {
  id: string;
  name: string;
  type: ObstacleType;
  x: number;
  y: number;
  distance: number;
  isBoss: boolean;
}

export interface LevelConfig {
  id: number;
  chapter: number;
  chapterName: string;
  name: string;
  theme: CityTheme;
  targetDistance: number;
  speed: number;
  obstacleSpawnInterval: number;
  villains: VillainType[];
  boss?: {
    type: VillainType;
    name: string;
    hp: number;
    title: string;
  };
  rewardCoins: number;
  description: string;
}

export interface GameStats {
  score: number;
  highScore: number;
  villainsDefeated: number;
  coinsCollected: number;
  totalCoins: number;
  distance: number;
  speed: number;
  combo: number;
  maxCombo: number;
  ultimateCharge: number; // 0 to 100
  shieldActive: boolean;
  playerHp?: number; // 0 to 100
  maxPlayerHp?: number; // 100
  isCombatMode?: boolean;
  warningEdgeActive?: boolean;
  magnetActive: boolean;
  magnetTimeRemaining?: number; // seconds
  doubleScoreActive?: boolean;
  doubleScoreTimeRemaining?: number; // seconds
  webWingsActive?: boolean;
  webWingsTimeRemaining?: number;
  theme: CityTheme;
  activeAlert?: ActiveEventAlert | null;
  incomingThreats?: IncomingThreat[];
  bulletTime?: boolean;
  currentLevel: number;
  levelProgress: number; // 0 to 100%
  levelComplete?: boolean;
  activeBoss?: {
    name: string;
    hp: number;
    maxHp: number;
    type: VillainType;
  } | null;
  gyroTilt?: number; // -1 to +1 normalized tilt
  isGyroActive?: boolean;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'level_select';
