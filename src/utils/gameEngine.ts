import {
  Obstacle,
  ObstacleType,
  WebShot,
  Particle,
  Coin,
  GameStats,
  Suit,
  PowerUpItem,
  PowerUpType,
  CityTheme,
  ActiveEventAlert,
  IncomingThreat,
  LevelConfig,
} from '../types';
import { soundFx } from './audio';
import { getLevelConfig } from './levels';

export interface GameEngineConfig {
  canvas: HTMLCanvasElement;
  selectedSuit: Suit;
  startLevel?: number;
  onStatsUpdate: (stats: GameStats) => void;
  onGameOver: (finalStats: GameStats) => void;
}

interface Building3D {
  x: number;
  width: number;
  height: number;
  depth: number;
  color: string;
  sideColor: string;
  roofColor: string;
  hasAntenna?: boolean;
  hasWaterTower?: boolean;
  hasNeonSign?: boolean;
  neonText?: string;
  neonColor?: string;
  windows: { col: number; row: number; lit: boolean; color: string }[];
}

export class SpiderGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;

  // Game state
  public isRunning: boolean = false;
  public isPaused: boolean = false;

  // Selected Suit
  private suit: Suit;

  // Level Progression System (100+ Levels)
  public currentLevel: number = 1;
  public levelConfig: LevelConfig;
  public levelDistanceProgress: number = 0;
  public isBossActive: boolean = false;
  public activeBossRef: Obstacle | null = null;

  // Theme & Atmosphere
  public theme: CityTheme = 'sunset_rooftop';

  // Hero Spidey State & Physics
  public playerX: number = 140;
  public playerY: number = 75; // ground level
  public playerWidth: number = 80;
  public playerHeight: number = 80;
  public velocityY: number = 0;
  public velocityX: number = 0;
  public gravity: number = -0.62;
  public isGrounded: boolean = true;
  public jumpCount: number = 0;
  public maxJumps: number = 2;
  public playerRotation: number = 0;
  public runAnimCycle: number = 0;
  public heroPose: 'run' | 'sprint' | 'jump' | 'flip' | 'swing_start' | 'swing' | 'swing_apex' | 'dive' | 'land' | 'ultimate' | 'web_wings' = 'run';
  public eyeSquint: number = 0; // 0 to 1
  public playerTrails: { x: number; y: number; rotation: number; pose: string; alpha: number; color?: string }[] = [];

  // High-Fidelity Skeletal Animation System & Joint Kinematics
  public landingTimer: number = 0;
  public sprintLean: number = 0;
  public heroGlowPulse: number = 0;
  public swingPhase: 'start' | 'mid' | 'apex' = 'mid';
  public skeleton = {
    torsoAngle: 0,
    torsoOffsetY: 0,
    headAngle: 0,
    armLeadUpper: 0,
    armLeadLower: 0,
    armTrailUpper: 0,
    armTrailLower: 0,
    legLeadUpper: 0,
    legLeadLower: 0,
    legTrailUpper: 0,
    legTrailLower: 0,
    webAnchorAngle: 0,
    armLeadGesture: 'thwip' as 'thwip' | 'fist' | 'open' | 'web_grip',
    armTrailGesture: 'fist' as 'thwip' | 'fist' | 'open' | 'web_grip',
  };

  // Gyroscope / Device Orientation Physics
  public gyroTilt: number = 0; // -1.0 (left) to +1.0 (right)
  public isGyroActive: boolean = false;
  private rawGamma: number = 0;
  private keyTilt: number = 0; // Desktop fallback tilt

  // Spidey Vitality & Nano-Defense System
  public playerHp: number = 100;
  public maxPlayerHp: number = 100;
  public isInvulnerable: boolean = false;
  public invulnerableTimer: number = 0;
  public isCombatMode: boolean = false;
  public warningEdgeActive: boolean = false;
  public warningEdgeTimer: number = 0;
  public consecutiveSwings: number = 0;

  // Web-Swinging Mechanics on Skyscrapers (Console-Grade Pendulum Physics)
  public isSwinging: boolean = false;
  public swingAnchorX: number = 0;
  public swingAnchorY: number = 0;
  public swingRopeLength: number = 270;
  public swingAngle: number = -0.75;
  public swingAngularVelocity: number = 0.045;
  public swingTension: number = 1.0;

  // Dynamic Camera System (Cinematic AAA Tracking & Dutch Angles)
  public cameraX: number = 0;
  public cameraY: number = 0;
  public targetCameraY: number = 0;
  public cameraZoom: number = 1.0;
  public targetCameraZoom: number = 1.0;
  public cameraTilt: number = 0; // Dutch angle in radians
  public targetCameraTilt: number = 0;
  public cameraShake: number = 0;
  public cameraShakeDecay: number = 0.88;
  public screenFlash: number = 0;
  public flashColor: string = '#ffffff';

  // Bullet Time (Slow-Motion)
  public timeScale: number = 1.0;
  public targetTimeScale: number = 1.0;
  public bulletTimeTimer: number = 0;

  // World Properties
  public groundHeight: number = 75;
  public gameSpeed: number = 4.5;
  public baseSpeed: number = 4.5;
  public distanceTraveled: number = 0;

  // Game Arrays
  public obstacles: Obstacle[] = [];
  public webs: WebShot[] = [];
  public particles: Particle[] = [];
  public coins: Coin[] = [];
  public powerUps: PowerUpItem[] = [];

  // Combat & Power-Up States
  public combo: number = 0;
  public comboTimer: number = 0;
  public maxCombo: number = 0;
  public ultimateCharge: number = 40; // 0-100
  public shieldActive: boolean = false;
  public magnetTimer: number = 0;
  public doubleScoreTimer: number = 0;
  public webWingsTimer: number = 0;

  // Active Alert Notification
  public activeAlert: ActiveEventAlert | null = null;
  public alertTimer: number = 0;

  // Stats
  public stats: GameStats;

  // Callbacks
  private onStatsUpdate: (stats: GameStats) => void;
  private onGameOver: (finalStats: GameStats) => void;

  // 3D Perspective City Environment
  private stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
  private searchlights: { x: number; angle: number; speed: number; width: number; color: string }[] = [];
  private farBuildings3D: Building3D[] = [];
  private midBuildings3D: Building3D[] = [];
  private rainDrops: { x: number; y: number; len: number; speed: number }[] = [];
  private lightningTimer: number = 0;
  private steamVents: { x: number; y: number; speed: number }[] = [];

  // Frame count & Spawning
  private frameCount: number = 0;
  private lastObstacleSpawnDist: number = 0;
  private lastCoinSpawnDist: number = 0;
  private lastPowerUpSpawnDist: number = 0;

  constructor(config: GameEngineConfig) {
    this.canvas = config.canvas;
    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;

    this.suit = config.selectedSuit;
    this.currentLevel = config.startLevel || parseInt(localStorage.getItem('spidey_saved_level') || '1', 10);
    this.levelConfig = getLevelConfig(this.currentLevel);
    this.theme = this.levelConfig.theme;
    this.gameSpeed = this.levelConfig.speed;
    this.baseSpeed = this.levelConfig.speed;

    this.onStatsUpdate = config.onStatsUpdate;
    this.onGameOver = config.onGameOver;

    const savedHighScore = localStorage.getItem('spidey_high_score');
    const savedCoins = localStorage.getItem('spidey_total_coins');

    this.stats = {
      score: 0,
      highScore: savedHighScore ? parseInt(savedHighScore, 10) : 0,
      villainsDefeated: 0,
      coinsCollected: 0,
      totalCoins: savedCoins ? parseInt(savedCoins, 10) : 0,
      distance: 0,
      speed: this.gameSpeed,
      combo: 0,
      maxCombo: 0,
      ultimateCharge: 40,
      shieldActive: false,
      playerHp: 100,
      maxPlayerHp: 100,
      isCombatMode: false,
      warningEdgeActive: false,
      magnetActive: false,
      magnetTimeRemaining: 0,
      doubleScoreActive: false,
      doubleScoreTimeRemaining: 0,
      webWingsActive: false,
      webWingsTimeRemaining: 0,
      theme: this.theme,
      activeAlert: null,
      incomingThreats: [],
      bulletTime: false,
      currentLevel: this.currentLevel,
      levelProgress: 0,
      activeBoss: null,
      gyroTilt: 0,
      isGyroActive: false,
    };

    this.init3DEnvironment();
    this.bindGyroscopeAndKeyboard();
  }

  // --- GYROSCOPE ORIENTATION & KEYBOARD TILT CONTROLS ---
  private bindGyroscopeAndKeyboard() {
    // 1. Device Orientation (Gyroscope)
    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener(
        'deviceorientation',
        (event) => {
          if (event.gamma !== null && event.gamma !== undefined) {
            this.isGyroActive = true;
            this.rawGamma = event.gamma;
            // In landscape mode, gamma represents physical tilt left/right
            // Normalize -35deg to +35deg to -1.0 to +1.0
            const clamped = Math.max(-35, Math.min(35, event.gamma));
            this.gyroTilt = clamped / 35;
            this.stats.gyroTilt = parseFloat(this.gyroTilt.toFixed(2));
            this.stats.isGyroActive = true;
          }
        },
        true
      );
    }

    // 2. Keyboard & Mouse Tilt Fallback (For Desktop / Non-Gyro Devices)
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          this.keyTilt = -0.8;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          this.keyTilt = 0.8;
        } else if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
          this.jump();
        } else if (e.key === 'f' || e.key === 'Enter') {
          this.shootWeb();
        } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
          this.toggleSwing();
        } else if (e.key === 'e' || e.key === 'E') {
          this.triggerUltimate();
        }
      });

      window.addEventListener('keyup', (e) => {
        if (
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight' ||
          e.key === 'a' ||
          e.key === 'd' ||
          e.key === 'A' ||
          e.key === 'D'
        ) {
          this.keyTilt = 0;
        }
      });

      // Mouse subtle tilt simulation
      window.addEventListener('mousemove', (e) => {
        if (!this.isGyroActive && window.innerWidth > 0) {
          const normX = (e.clientX / window.innerWidth) * 2 - 1; // -1 to +1
          this.gyroTilt = Math.max(-1, Math.min(1, normX * 0.7));
          this.stats.gyroTilt = parseFloat(this.gyroTilt.toFixed(2));
        }
      });
    }
  }

  // --- 3D PERSPECTIVE ENVIRONMENT INITIALIZATION ---
  private init3DEnvironment() {
    const w = this.canvas.width || 1280;
    const h = this.canvas.height || 720;

    this.stars = [];
    for (let i = 0; i < 110; i++) {
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * (h * 0.65),
        size: 1 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.8,
        speed: 0.1 + Math.random() * 0.3,
      });
    }

    this.searchlights = [
      { x: w * 0.15, angle: -0.3, speed: 0.008, width: 140, color: 'rgba(56, 189, 248, 0.16)' },
      { x: w * 0.48, angle: 0.25, speed: -0.006, width: 180, color: 'rgba(239, 68, 68, 0.14)' },
      { x: w * 0.82, angle: -0.15, speed: 0.009, width: 160, color: 'rgba(245, 158, 11, 0.15)' },
    ];

    this.farBuildings3D = [];
    let curFarX = 0;
    while (curFarX < w + 1400) {
      const bw = 110 + Math.random() * 150;
      const bh = 240 + Math.random() * 280;
      const depth = 35 + Math.random() * 25;

      const windows = [];
      const cols = Math.floor(bw / 20);
      const rows = Math.floor(bh / 28);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > 0.4) {
            windows.push({
              col: c,
              row: r,
              lit: true,
              color: Math.random() > 0.8 ? '#38bdf8' : '#fef08a',
            });
          }
        }
      }

      this.farBuildings3D.push({
        x: curFarX,
        width: bw,
        height: bh,
        depth,
        color: this.theme === 'sunset_rooftop' ? '#3b0764' : this.theme === 'crimson_dawn' ? '#450a0a' : '#080d1a',
        sideColor: this.theme === 'sunset_rooftop' ? '#2e1065' : '#030712',
        roofColor: this.theme === 'sunset_rooftop' ? '#4c1d95' : '#0f172a',
        windows,
        hasAntenna: Math.random() > 0.5,
      });

      curFarX += bw + 15 + Math.random() * 30;
    }

    this.midBuildings3D = [];
    let curMidX = 0;
    const neonTexts = ['OSCORP', 'STARK IND', 'DAILY BUGLE', 'WEBMESH 2099', 'ALCHEMAX', 'FISK TOWER'];
    const neonColors = ['#ef4444', '#38bdf8', '#eab308', '#ec4899', '#22c55e', '#a855f7'];

    while (curMidX < w + 1400) {
      const bw = 130 + Math.random() * 170;
      const bh = 170 + Math.random() * 230;
      const depth = 45 + Math.random() * 30;

      const windows = [];
      const cols = Math.floor(bw / 18);
      const rows = Math.floor(bh / 24);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > 0.35) {
            windows.push({
              col: c,
              row: r,
              lit: true,
              color: Math.random() > 0.7 ? '#38bdf8' : Math.random() > 0.5 ? '#fef08a' : '#f43f5e',
            });
          }
        }
      }

      const hasSign = Math.random() > 0.45;
      const signIdx = Math.floor(Math.random() * neonTexts.length);

      this.midBuildings3D.push({
        x: curMidX,
        width: bw,
        height: bh,
        depth,
        color: this.theme === 'sunset_rooftop' ? '#1e1b4b' : '#0f172a',
        sideColor: '#020617',
        roofColor: '#1e293b',
        windows,
        hasWaterTower: Math.random() > 0.6,
        hasNeonSign: hasSign,
        neonText: neonTexts[signIdx],
        neonColor: neonColors[signIdx],
      });

      curMidX += bw + 20 + Math.random() * 40;
    }

    this.rainDrops = [];
    for (let i = 0; i < 90; i++) {
      this.rainDrops.push({
        x: Math.random() * w,
        y: Math.random() * h,
        len: 15 + Math.random() * 20,
        speed: 16 + Math.random() * 12,
      });
    }

    this.steamVents = [
      { x: w * 0.25, y: h - this.groundHeight, speed: 1.5 },
      { x: w * 0.65, y: h - this.groundHeight, speed: 2.0 },
    ];
  }

  // --- START / STOP / PAUSE ---
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.resetPlayer();
    soundFx.playGameStart();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
  }

  public setLevel(levelNum: number) {
    this.currentLevel = Math.max(1, Math.min(100, levelNum));
    this.levelConfig = getLevelConfig(this.currentLevel);
    this.theme = this.levelConfig.theme;
    this.gameSpeed = this.levelConfig.speed;
    this.baseSpeed = this.levelConfig.speed;
    this.levelDistanceProgress = 0;
    this.isBossActive = false;
    this.activeBossRef = null;
    this.stats.currentLevel = this.currentLevel;
    this.stats.theme = this.theme;
    this.stats.levelProgress = 0;
    this.stats.activeBoss = null;
    this.obstacles = [];
    this.coins = [];
    this.powerUps = [];
    this.consecutiveSwings = 0;
    localStorage.setItem('spidey_saved_level', this.currentLevel.toString());

    // Save max unlocked level
    const currentMax = parseInt(localStorage.getItem('spidey_max_unlocked_level') || '1', 10);
    if (this.currentLevel > currentMax) {
      localStorage.setItem('spidey_max_unlocked_level', this.currentLevel.toString());
    }

    this.init3DEnvironment();
    this.triggerAlert(
      `SECTOR ${this.currentLevel}: ${this.levelConfig.name.toUpperCase()}`,
      `Mission: Patrol ${this.levelConfig.targetDistance}m across the skyline!`,
      '🏙️',
      '#38bdf8',
      'level_complete',
      200
    );
  }

  public setTheme(theme: CityTheme) {
    this.theme = theme;
    this.stats.theme = theme;
    this.init3DEnvironment();
  }

  public updateSuit(suit: Suit) {
    this.suit = suit;
  }

  public activateShield() {
    this.shieldActive = true;
    this.stats.shieldActive = true;
    soundFx.playPowerUp();
    this.triggerScreenFlash('#38bdf8');
    this.addComicPopup(this.playerX + 40, this.canvas.height - this.playerY - 40, 'NANO-SHIELD ON!', '#38bdf8');
  }

  private resetPlayer() {
    this.playerX = 140;
    this.playerY = this.groundHeight;
    this.velocityY = 0;
    this.velocityX = 0;
    this.isGrounded = true;
    this.jumpCount = 0;
    this.playerRotation = 0;
    this.heroPose = 'run';
    this.isSwinging = false;
    this.distanceTraveled = 0;
    this.levelDistanceProgress = 0;
    this.isBossActive = false;
    this.activeBossRef = null;

    this.obstacles = [];
    this.webs = [];
    this.particles = [];
    this.coins = [];
    this.powerUps = [];
    this.playerTrails = [];

    this.combo = 0;
    this.comboTimer = 0;
    this.shieldActive = false;
    this.magnetTimer = 0;
    this.doubleScoreTimer = 0;
    this.webWingsTimer = 0;
    this.ultimateCharge = 40;
    this.cameraShake = 0;
    this.cameraTilt = 0;
    this.cameraZoom = 1.0;
    this.timeScale = 1.0;

    this.stats.score = 0;
    this.stats.villainsDefeated = 0;
    this.stats.coinsCollected = 0;
    this.stats.distance = 0;
    this.stats.combo = 0;
    this.stats.maxCombo = 0;
    this.stats.shieldActive = false;
    this.stats.magnetActive = false;
    this.stats.doubleScoreActive = false;
    this.stats.webWingsActive = false;
    this.stats.levelProgress = 0;
    this.stats.activeBoss = null;
  }

  // --- CONTROLLER ACTIONS ---
  public jump() {
    if (!this.isRunning || this.isPaused) return;

    if (this.isSwinging) {
      // Slingshot apex release jump from swing!
      this.releaseSwingWithSlingshot();
      return;
    }

    if (this.isGrounded || this.jumpCount < this.maxJumps) {
      this.jumpCount++;
      const isDouble = this.jumpCount === 2;
      this.velocityY = isDouble ? 14.0 : 16.0;
      this.isGrounded = false;
      this.heroPose = isDouble ? 'flip' : 'jump';
      this.eyeSquint = 0.8;

      soundFx.playJump(isDouble);
      this.createJumpParticles(this.playerX + this.playerWidth / 2, this.canvas.height - this.playerY);

      if (isDouble) {
        this.addComicPopup(this.playerX + 40, this.canvas.height - this.playerY - 40, 'DOUBLE FLIP!', '#38bdf8');
      }
    }
  }

  public shootWeb() {
    if (!this.isRunning || this.isPaused) return;

    const spawnX = this.playerX + this.playerWidth - 10;
    const spawnY = this.canvas.height - (this.playerY + 45);

    const isMega = this.suit.id === 'symbiote' || this.suit.id === 'iron_spider';
    const webSpeed = isMega ? 26 : 22;

    this.webs.push({
      id: Math.random().toString(),
      x: spawnX,
      y: spawnY,
      vx: webSpeed,
      vy: 0,
      length: isMega ? 45 : 35,
      isMega,
      color: this.suit.glowColor,
    });

    soundFx.playThwip(isMega);
    this.eyeSquint = 0.9;

    // Web blast muzzle sparks
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: spawnX,
        y: spawnY,
        vx: 3 + Math.random() * 6,
        vy: (Math.random() - 0.5) * 4,
        size: 2 + Math.random() * 3,
        color: this.suit.glowColor || '#ffffff',
        alpha: 1,
        life: 12,
        maxLife: 12,
        type: 'spark',
      });
    }
  }

  public toggleSwing() {
    if (!this.isRunning || this.isPaused) return;

    if (this.isSwinging) {
      // Chain to next consecutive swing forward seamlessly!
      this.chainWebSwing();
    } else {
      this.startWebSwing();
    }
  }

  private startWebSwing() {
    const canvasH = this.canvas.height;
    this.consecutiveSwings = 1;

    // Attach web anchor to high skyscraper point ahead
    this.swingAnchorX = this.playerX + 220;
    this.swingAnchorY = 70 + Math.random() * 60;

    const currentY = canvasH - this.playerY;
    const dx = this.playerX - this.swingAnchorX;
    const dy = currentY - this.swingAnchorY;
    this.swingRopeLength = Math.max(180, Math.min(360, Math.hypot(dx, dy)));
    this.swingAngle = Math.atan2(dx, dy); // Pendulum angle from vertical
    this.swingAngularVelocity = 0.048 + (this.gameSpeed / 95);

    this.isSwinging = true;
    this.heroPose = 'swing';
    this.isGrounded = false;
    this.eyeSquint = 0.7;

    soundFx.playThwip(true);

    // Dynamic Camera tilts into the swing
    this.targetCameraTilt = 0.08;
    this.targetCameraZoom = 0.92;

    this.addComicPopup(this.playerX + 40, canvasH - this.playerY - 50, 'THWIP! SWING! 🕸️', '#ffffff');
  }

  public chainWebSwing() {
    const canvasH = this.canvas.height;
    this.consecutiveSwings++;

    // Forward momentum boost from detaching previous web
    const effectiveTilt = this.keyTilt !== 0 ? this.keyTilt : this.gyroTilt;
    const boost = 1.0 + Math.min(0.8, this.consecutiveSwings * 0.12);

    // Particle snap and release ring
    soundFx.playThwip(true);
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.playerX + 40,
        y: canvasH - this.playerY - 20,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: 3,
        color: '#38bdf8',
        alpha: 1,
        life: 18,
        maxLife: 18,
        type: 'spark',
      });
    }

    // Target a new building anchor ahead in the city skyline
    this.swingAnchorX = Math.max(this.playerX + 190, this.playerX + 230 + Math.random() * 80);
    this.swingAnchorY = 60 + Math.random() * 70;

    const currentY = canvasH - this.playerY;
    const dx = this.playerX - this.swingAnchorX;
    const dy = currentY - this.swingAnchorY;
    this.swingRopeLength = Math.max(160, Math.min(380, Math.hypot(dx, dy)));
    this.swingAngle = Math.atan2(dx, dy);
    // Preserve & amplify forward angular velocity with gyro influence
    this.swingAngularVelocity = (0.052 + (this.gameSpeed / 90)) * boost;
    if (effectiveTilt > 0.1) this.swingAngularVelocity += 0.015;

    this.isSwinging = true;
    this.heroPose = 'swing';
    this.isGrounded = false;
    this.eyeSquint = 0.85;

    this.stats.score += 20 * this.consecutiveSwings;
    this.ultimateCharge = Math.min(100, this.ultimateCharge + 5);
    this.stats.ultimateCharge = this.ultimateCharge;

    const popups = ['CHAIN SWING! 🕸️', 'AERIAL FLOW! ⚡', 'SPECTACULAR! 🚀', 'MAX MOMENTUM! 💫'];
    const text = popups[Math.min(popups.length - 1, this.consecutiveSwings - 1)];
    this.addComicPopup(this.playerX + 40, canvasH - this.playerY - 50, text, '#38bdf8');

    // Trigger iconic Spider-Man Theme Song on reaching high acrobatic flow!
    if (this.consecutiveSwings === 4) {
      soundFx.playSpiderManThemeSong();
    }

    // Camera zooms out slightly during high-speed air chaining
    this.targetCameraZoom = Math.max(0.86, 0.94 - this.consecutiveSwings * 0.02);
    this.targetCameraTilt = 0.09 * (this.swingAngularVelocity > 0 ? 1 : -1);
  }

  public releaseSwingWithSlingshot() {
    if (!this.isSwinging) return;
    this.isSwinging = false;
    this.heroPose = 'flip';
    this.targetCameraTilt = 0;
    this.targetCameraZoom = 1.0;

    // Gyroscope tilt enhances release power & trajectory!
    const effectiveTilt = this.keyTilt !== 0 ? this.keyTilt : this.gyroTilt;
    const releasePower = (Math.abs(this.swingAngularVelocity) * 280) * (1 + Math.abs(effectiveTilt) * 0.3);
    
    this.velocityY = Math.max(14, releasePower * 0.75);
    this.velocityX = Math.min(9, releasePower * 0.35 + effectiveTilt * 4);

    soundFx.playJump(true);
    this.addComicPopup(this.playerX + 40, this.canvas.height - this.playerY - 60, 'SLINGSHOT! 🚀', '#f59e0b');
  }

  public triggerUltimate() {
    if (!this.isRunning || this.isPaused || this.ultimateCharge < 100) return;

    this.ultimateCharge = 0;
    this.stats.ultimateCharge = 0;
    this.heroPose = 'ultimate';
    this.triggerScreenShake(28);
    this.triggerScreenFlash('#f59e0b');
    this.triggerBulletTime(90, 0.25);

    soundFx.playUltimateBlast();

    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;

    // Clear all non-boss obstacles on screen with massive comic explosion
    this.obstacles.forEach((obs) => {
      if (obs.isBoss) {
        obs.hp -= 220; // Massive damage to boss
      } else {
        obs.hp = 0;
      }
      this.createExplosionParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.color);
    });

    this.stats.villainsDefeated += this.obstacles.filter((o) => !o.isBoss).length;
    this.obstacles = this.obstacles.filter((o) => o.hp > 0);

    // Screen-clearing energy ring particles
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40;
      const speed = 12 + Math.random() * 14;
      this.particles.push({
        x: this.playerX + 40,
        y: canvasH - (this.playerY + 40),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 6,
        color: '#f59e0b',
        alpha: 1,
        life: 45,
        maxLife: 45,
        type: 'shockwave',
      });
    }

    this.addComicPopup(canvasW * 0.5, canvasH * 0.45, '💥 MAXIMUM VENOM BLAST! 💥', '#f59e0b', 2.0);
  }

  // --- CINEMATIC EFFECTS & SCREEN DYNAMICS ---
  public triggerScreenShake(intensity: number = 15) {
    this.cameraShake = Math.max(this.cameraShake, intensity);
  }

  public triggerScreenFlash(color: string = '#ffffff') {
    this.screenFlash = 1.0;
    this.flashColor = color;
  }

  public triggerBulletTime(durationFrames: number = 60, scale: number = 0.3) {
    this.bulletTimeTimer = durationFrames;
    this.targetTimeScale = scale;
    this.stats.bulletTime = true;
  }

  private triggerAlert(title: string, subtitle: string, icon: string, color: string, type: ActiveEventAlert['type'], duration: number = 180) {
    this.activeAlert = {
      id: Math.random().toString(),
      title,
      subtitle,
      icon,
      color,
      type,
      duration,
    };
    this.alertTimer = duration;
    this.stats.activeAlert = this.activeAlert;
  }

  private addComicPopup(x: number, y: number, text: string, color: string = '#ffffff', scale: number = 1.2) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -2.5,
      size: 16,
      color,
      alpha: 1.0,
      life: 45,
      maxLife: 45,
      type: 'comic_text',
      text,
      scale,
    });
  }

  // --- MAIN GAME ENGINE LOOP ---
  private gameLoop = () => {
    if (!this.isRunning) return;

    if (!this.isPaused) {
      this.update();
    }
    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  // --- GAME UPDATE TICK ---
  private update() {
    this.frameCount++;

    // 1. Time Scaling & Bullet-Time
    if (this.bulletTimeTimer > 0) {
      this.bulletTimeTimer--;
      this.timeScale += (this.targetTimeScale - this.timeScale) * 0.2;
      if (this.bulletTimeTimer <= 0) {
        this.targetTimeScale = 1.0;
        this.stats.bulletTime = false;
      }
    } else {
      this.timeScale += (1.0 - this.timeScale) * 0.1;
    }

    const dt = this.timeScale;

    // 2. Camera Shake & Tilt Smoothing (Gyroscope influenced)
    this.cameraShake *= this.cameraShakeDecay;
    if (this.cameraShake < 0.2) this.cameraShake = 0;

    const effectiveTilt = this.keyTilt !== 0 ? this.keyTilt : this.gyroTilt;
    const dynamicDutchAngle = this.targetCameraTilt + effectiveTilt * 0.05;
    this.cameraTilt += (dynamicDutchAngle - this.cameraTilt) * 0.15;
    this.cameraZoom += (this.targetCameraZoom - this.cameraZoom) * 0.1;
    this.screenFlash = Math.max(0, this.screenFlash - 0.05);

    // 3. Distance & Level Progress Tracker (100+ Levels)
    const frameDistance = (this.gameSpeed * dt) / 10;
    this.distanceTraveled += frameDistance;
    this.levelDistanceProgress += frameDistance;
    this.stats.distance = Math.floor(this.distanceTraveled);
    this.stats.speed = parseFloat((this.gameSpeed * (this.isSwinging ? 1.4 : 1.0)).toFixed(1));

    const progressRatio = Math.min(100, (this.levelDistanceProgress / this.levelConfig.targetDistance) * 100);
    this.stats.levelProgress = parseFloat(progressRatio.toFixed(1));

    // Check Level Progression & Boss Spawning
    this.checkLevelMilestones();

    // 4. Score Multipliers & Timers
    if (this.frameCount % 6 === 0) {
      const multiplier = (this.doubleScoreTimer > 0 ? 2 : 1) * (this.combo > 1 ? 1 + this.combo * 0.2 : 1);
      this.stats.score += Math.round(1 * multiplier);
    }

    if (this.magnetTimer > 0) {
      this.magnetTimer -= 1 / 60;
      this.stats.magnetActive = true;
      this.stats.magnetTimeRemaining = Math.ceil(this.magnetTimer);
    } else {
      this.stats.magnetActive = false;
      this.stats.magnetTimeRemaining = 0;
    }

    if (this.doubleScoreTimer > 0) {
      this.doubleScoreTimer -= 1 / 60;
      this.stats.doubleScoreActive = true;
      this.stats.doubleScoreTimeRemaining = Math.ceil(this.doubleScoreTimer);
    } else {
      this.stats.doubleScoreActive = false;
      this.stats.doubleScoreTimeRemaining = 0;
    }

    if (this.webWingsTimer > 0) {
      this.webWingsTimer -= 1 / 60;
      this.stats.webWingsActive = true;
      this.stats.webWingsTimeRemaining = Math.ceil(this.webWingsTimer);
    } else {
      this.stats.webWingsActive = false;
      this.stats.webWingsTimeRemaining = 0;
    }

    // Combo streak decay
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.stats.combo = 0;
      }
    }

    // Alert decay
    if (this.alertTimer > 0) {
      this.alertTimer--;
      if (this.alertTimer <= 0) {
        this.activeAlert = null;
        this.stats.activeAlert = null;
      }
    }

    // 5. Hero Spidey Physics & Motion (with Gyroscope Pendulum physics)
    this.updateHeroPhysics(dt);

    // 6. Projectiles & Webs
    this.updateWebs(dt);

    // 7. Obstacles, Villains & Boss AI
    this.updateObstacles(dt);

    // 8. Coins & Power-Ups
    this.updateCollectibles(dt);

    // 9. Particle FX & Atmospheric Weather
    this.updateParticles(dt);
    this.updateEnvironment(dt);

    // 10. Update Radar & Threat Telemetry for HUD
    this.updateIncomingThreats();

    // 11. Sync Stats callback
    this.onStatsUpdate({ ...this.stats });
  }

  // --- LEVEL MILESTONE CHECKER ---
  private checkLevelMilestones() {
    // Has reached boss distance and boss not yet spawned?
    if (
      this.levelConfig.boss &&
      !this.isBossActive &&
      !this.activeBossRef &&
      this.levelDistanceProgress >= this.levelConfig.targetDistance * 0.75
    ) {
      this.spawnBoss(this.levelConfig.boss);
    }

    // Has level completed (Either distance reached without boss or boss defeated)
    if (this.levelDistanceProgress >= this.levelConfig.targetDistance) {
      if (!this.levelConfig.boss || (this.isBossActive && this.activeBossRef && this.activeBossRef.hp <= 0)) {
        this.completeLevel();
      }
    }
  }

  private spawnBoss(bossData: NonNullable<LevelConfig['boss']>) {
    this.isBossActive = true;
    soundFx.playBossWarning();
    soundFx.playSpiderManThemeSong(); // Play iconic Spider-Man superhero theme during boss fight!

    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;

    const bossObstacle: Obstacle = {
      id: 'boss_' + Math.random().toString(),
      x: canvasW + 120,
      y: canvasH - 320,
      width: 140,
      height: 140,
      type: bossData.type,
      color: bossData.type === 'green_goblin' ? '#22c55e' : bossData.type === 'doc_ock' ? '#ea580c' : bossData.type === 'electro' ? '#38bdf8' : '#090d16',
      hp: bossData.hp,
      maxHp: bossData.hp,
      speed: 0,
      isAirborne: true,
      isBoss: true,
      bossPhase: 1,
      bossName: bossData.name,
      attackTimer: 90,
      stateTimer: 0,
      subProjectiles: [],
      tentacles: [
        { angle: -0.4, length: 120, targetX: 0, targetY: 0 },
        { angle: 0.4, length: 120, targetX: 0, targetY: 0 },
        { angle: -1.2, length: 140, targetX: 0, targetY: 0 },
        { angle: 1.2, length: 140, targetX: 0, targetY: 0 },
      ],
    };

    this.obstacles.push(bossObstacle);
    this.activeBossRef = bossObstacle;

    this.stats.activeBoss = {
      name: bossData.name,
      hp: bossData.hp,
      maxHp: bossData.hp,
      type: bossData.type,
    };

    this.triggerAlert(`⚠️ BOSS ENCOUNTER: ${bossData.name}`, bossData.title, '💀', '#ef4444', 'boss', 200);
    this.triggerScreenShake(20);
  }

  private completeLevel() {
    soundFx.playCombo(8);
    this.stats.totalCoins += this.levelConfig.rewardCoins;
    localStorage.setItem('spidey_total_coins', this.stats.totalCoins.toString());

    this.triggerAlert(
      `🎉 SECTOR ${this.currentLevel} LIBERATED!`,
      `+${this.levelConfig.rewardCoins} Spider Tokens Earned! Advancing to Sector ${this.currentLevel + 1}...`,
      '🏆',
      '#10b981',
      'level_complete',
      180
    );

    this.triggerScreenFlash('#10b981');
    this.triggerBulletTime(80, 0.4);

    setTimeout(() => {
      if (this.isRunning) {
        this.setLevel(this.currentLevel + 1);
      }
    }, 1800);
  }

  // --- HERO PHYSICS ENGINE & PROCEDURAL SKELETAL ANIMATION ---
  private updateHeroPhysics(dt: number) {
    const canvasH = this.canvas.height;
    const effectiveTilt = this.keyTilt !== 0 ? this.keyTilt : this.gyroTilt;

    // Luminous Glow Pulse & Chromatic Motion Blur Trails
    this.heroGlowPulse = 0.5 + Math.sin(this.frameCount * 0.15) * 0.25 + Math.min(0.5, this.combo * 0.05);

    if (this.frameCount % 2 === 0) {
      this.playerTrails.unshift({
        x: this.playerX,
        y: this.playerY,
        rotation: this.playerRotation,
        pose: this.heroPose,
        alpha: 0.65,
        color: this.suit.glowColor || this.suit.primaryColor,
      });
      if (this.playerTrails.length > 8) {
        this.playerTrails.pop();
      }
    }
    this.playerTrails.forEach((t) => (t.alpha -= 0.07 * dt));
    this.playerTrails = this.playerTrails.filter((t) => t.alpha > 0);

    // Web Swinging Pendulum Mechanics with Dynamic Pose Stages
    if (this.isSwinging) {
      const pendulumGravity = 0.0036;
      let angularAcc = -pendulumGravity * Math.sin(this.swingAngle);
      angularAcc += effectiveTilt * 0.0028;

      this.swingAngularVelocity += angularAcc * dt;
      this.swingAngle += this.swingAngularVelocity * dt;
      this.swingAngle = Math.max(-1.45, Math.min(1.45, this.swingAngle));

      // Calculate Player position on swing arc
      const currentSwingX = this.swingAnchorX + Math.sin(this.swingAngle) * this.swingRopeLength;
      const currentSwingY = this.swingAnchorY + Math.cos(this.swingAngle) * this.swingRopeLength;

      this.playerX = currentSwingX - this.playerWidth / 2;
      this.playerY = canvasH - currentSwingY;

      // Dynamic Swing Stage Transitions
      if (this.swingAngle < -0.65 && this.swingAngularVelocity > 0) {
        this.heroPose = 'swing_start';
        this.swingPhase = 'start';
      } else if (this.swingAngle > 0.45 && this.swingAngularVelocity > 0) {
        this.heroPose = 'swing_apex';
        this.swingPhase = 'apex';
      } else {
        this.heroPose = 'swing';
        this.swingPhase = 'mid';
      }

      // Hero body rotates smoothly with pendulum arc
      const targetRotation = this.swingAngle + (this.swingAngularVelocity > 0 ? 0.35 : -0.35);
      this.playerRotation += (targetRotation - this.playerRotation) * 0.2 * dt;

      // Camera dynamic tilt follows swing angle + phone tilt
      this.targetCameraTilt = this.swingAngle * 0.09 + effectiveTilt * 0.04;

      // High-speed swing energy and wind particles
      if (this.frameCount % 3 === 0) {
        this.particles.push({
          x: this.playerX + 15 + Math.random() * 20,
          y: canvasH - this.playerY + 10,
          vx: -this.gameSpeed * 0.8 - Math.random() * 2,
          vy: (Math.random() - 0.5) * 3,
          size: 2.5,
          color: this.suit.glowColor || '#ffffff',
          alpha: 0.8,
          life: 16,
          maxLife: 16,
          type: 'web',
        });
      }

      // Ground collision during swing
      if (this.playerY <= this.groundHeight) {
        this.playerY = this.groundHeight;
        this.isSwinging = false;
        this.isGrounded = true;
        this.jumpCount = 0;
        this.heroPose = 'run';
        this.targetCameraTilt = 0;
      }
      
      this.updateHeroSkeletalAnimation(dt);
      return;
    }

    // Landing Recoil Timer Handling
    if (this.landingTimer > 0) {
      this.landingTimer -= dt;
      if (this.landingTimer <= 0) {
        this.heroPose = (this.gameSpeed >= 5.2 || this.combo >= 3) ? 'sprint' : 'run';
      }
    }

    // Free Flight / Airborne / Falling Physics
    if (!this.isGrounded) {
      const effectiveGravity = this.webWingsTimer > 0 ? this.gravity * 0.32 : this.gravity;
      this.velocityY += effectiveGravity * dt;
      this.playerY += this.velocityY * dt;

      // Gyroscope tilt horizontal nudge during free flight
      if (Math.abs(effectiveTilt) > 0.1) {
        this.velocityX += effectiveTilt * 0.28 * dt;
      }

      if (this.velocityX !== 0) {
        this.playerX = Math.max(80, Math.min(270, this.playerX + this.velocityX * dt));
        this.velocityX *= 0.94;
      } else {
        this.playerX += (140 - this.playerX) * 0.03 * dt;
      }

      // In-Air Poses & Rotations
      if (this.heroPose === 'flip') {
        this.playerRotation += 0.24 * dt;
        if (this.playerRotation >= Math.PI * 2) {
          this.playerRotation = 0;
          this.heroPose = this.velocityY < -4 ? 'dive' : 'jump';
        }
      } else if (this.webWingsTimer > 0) {
        this.heroPose = 'web_wings';
        this.playerRotation = 0.08 + effectiveTilt * 0.12;
      } else if (this.velocityY < -4.5) {
        this.heroPose = 'dive';
        this.playerRotation += (-0.3 - this.playerRotation) * 0.15 * dt;
      } else if (this.velocityY > 2) {
        this.heroPose = 'jump';
        this.playerRotation += (0.08 - this.playerRotation) * 0.15 * dt;
      } else {
        this.playerRotation += (0 - this.playerRotation) * 0.15 * dt;
      }

      // Ground Landing Detection
      if (this.playerY <= this.groundHeight) {
        this.playerY = this.groundHeight;
        const hardLanding = this.velocityY < -7.0;
        this.velocityY = 0;
        this.isGrounded = true;
        this.jumpCount = 0;
        this.playerRotation = 0;
        this.eyeSquint = 0;

        if (hardLanding) {
          this.heroPose = 'land';
          this.landingTimer = 10;
          this.triggerScreenShake(8);
        } else {
          this.heroPose = (this.gameSpeed >= 5.2 || this.combo >= 3) ? 'sprint' : 'run';
        }

        this.createLandingRipples(this.playerX + 40, canvasH - this.groundHeight);
      }
    } else if (this.landingTimer <= 0) {
      // Ground Run & Supersonic Sprint Cycle
      const isSprint = this.gameSpeed >= 5.2 || this.combo >= 3;
      this.heroPose = isSprint ? 'sprint' : 'run';

      const cycleSpeed = (0.28 + (this.gameSpeed / 18)) * dt;
      this.runAnimCycle += cycleSpeed;
      this.playerRotation = Math.sin(this.runAnimCycle) * (isSprint ? 0.08 : 0.04);

      // Run / Sprint Footstep smoke and friction sparks
      if (this.frameCount % (isSprint ? 4 : 7) === 0) {
        this.particles.push({
          x: this.playerX + 20,
          y: canvasH - this.groundHeight - 4,
          vx: -3.5 - Math.random() * 2.5,
          vy: -0.6 - Math.random() * 1.5,
          size: 3 + Math.random() * 3,
          color: isSprint ? (this.suit.glowColor || 'rgba(56, 189, 248, 0.6)') : 'rgba(148, 163, 184, 0.45)',
          alpha: 0.65,
          life: 14,
          maxLife: 14,
          type: isSprint ? 'spark' : 'smoke',
        });
      }
    }

    this.updateHeroSkeletalAnimation(dt);
  }

  // --- PROCEDURAL SKELETAL KINEMATICS & POSE BLENDING ENGINE ---
  private updateHeroSkeletalAnimation(dt: number) {
    const s = this.skeleton;
    const lerpSpeed = 0.22 * dt;
    const runCycle = this.runAnimCycle;

    // Target bone angles calculated based on current heroPose
    let targetTorsoAngle = 0;
    let targetTorsoOffsetY = 0;
    let targetHeadAngle = 0;
    let targetArmLeadUpper = 0;
    let targetArmLeadLower = 0.2;
    let targetArmTrailUpper = 0;
    let targetArmTrailLower = 0.2;
    let targetLegLeadUpper = 0;
    let targetLegLeadLower = -0.2;
    let targetLegTrailUpper = 0;
    let targetLegTrailLower = -0.2;
    let targetArmLeadGesture: 'thwip' | 'fist' | 'open' | 'web_grip' = 'thwip';
    let targetArmTrailGesture: 'thwip' | 'fist' | 'open' | 'web_grip' = 'fist';

    // Calculate angle to web anchor if swinging
    if (this.isSwinging) {
      const heroScreenY = this.canvas.height - this.playerY;
      const dx = this.swingAnchorX - (this.playerX + this.playerWidth / 2);
      const dy = this.swingAnchorY - heroScreenY;
      s.webAnchorAngle = Math.atan2(dy, dx);
    }

    switch (this.heroPose) {
      case 'run':
        targetTorsoAngle = -0.12;
        targetTorsoOffsetY = Math.abs(Math.sin(runCycle)) * 3;
        targetHeadAngle = 0.05;
        targetArmLeadUpper = Math.sin(runCycle) * 0.75;
        targetArmLeadLower = 0.4 + Math.max(0, Math.sin(runCycle)) * 0.3;
        targetArmTrailUpper = Math.sin(runCycle + Math.PI) * 0.75;
        targetArmTrailLower = 0.4 + Math.max(0, Math.sin(runCycle + Math.PI)) * 0.3;
        targetLegLeadUpper = Math.sin(runCycle + Math.PI) * 0.85;
        targetLegLeadLower = -0.3 - Math.max(0, Math.sin(runCycle + Math.PI)) * 0.4;
        targetLegTrailUpper = Math.sin(runCycle) * 0.85;
        targetLegTrailLower = -0.3 - Math.max(0, Math.sin(runCycle)) * 0.4;
        targetArmLeadGesture = 'fist';
        targetArmTrailGesture = 'fist';
        break;

      case 'sprint':
        targetTorsoAngle = -0.32; // Deep athletic forward lean
        targetTorsoOffsetY = 6 + Math.abs(Math.sin(runCycle)) * 3.5;
        targetHeadAngle = 0.18; // Head raised forward
        targetArmLeadUpper = Math.sin(runCycle) * 1.1;
        targetArmLeadLower = 0.6 + Math.max(0, Math.sin(runCycle)) * 0.4;
        targetArmTrailUpper = Math.sin(runCycle + Math.PI) * 1.1;
        targetArmTrailLower = 0.6 + Math.max(0, Math.sin(runCycle + Math.PI)) * 0.4;
        targetLegLeadUpper = Math.sin(runCycle + Math.PI) * 1.15;
        targetLegLeadLower = -0.4 - Math.max(0, Math.sin(runCycle + Math.PI)) * 0.5;
        targetLegTrailUpper = Math.sin(runCycle) * 1.15;
        targetLegTrailLower = -0.4 - Math.max(0, Math.sin(runCycle)) * 0.5;
        targetArmLeadGesture = 'open';
        targetArmTrailGesture = 'open';
        break;

      case 'swing_start':
        targetTorsoAngle = 0.35; // Arching back into swing
        targetTorsoOffsetY = 0;
        targetHeadAngle = -0.25;
        targetArmLeadUpper = -1.7; // Lead arm reaching high for web line
        targetArmLeadLower = 0.1;
        targetArmTrailUpper = 0.8; // Trailing arm flared back
        targetArmTrailLower = 0.4;
        targetLegLeadUpper = -0.7; // Legs tucking in preparation
        targetLegLeadLower = -0.6;
        targetLegTrailUpper = -0.4;
        targetLegTrailLower = -0.5;
        targetArmLeadGesture = 'web_grip';
        targetArmTrailGesture = 'open';
        break;

      case 'swing':
        targetTorsoAngle = 0.2 + this.swingAngle * 0.5;
        targetTorsoOffsetY = 0;
        targetHeadAngle = -0.15;
        targetArmLeadUpper = -1.55;
        targetArmLeadLower = 0.25;
        targetArmTrailUpper = 0.65;
        targetArmTrailLower = 0.5;
        targetLegLeadUpper = 0.45 + this.swingAngle * 0.3;
        targetLegLeadLower = -0.4;
        targetLegTrailUpper = 0.75 + this.swingAngle * 0.3;
        targetLegTrailLower = -0.55;
        targetArmLeadGesture = 'web_grip';
        targetArmTrailGesture = 'open';
        break;

      case 'swing_apex':
        targetTorsoAngle = -0.25; // Snapping forward at apex
        targetTorsoOffsetY = 0;
        targetHeadAngle = 0.2;
        targetArmLeadUpper = -1.2;
        targetArmLeadLower = 0.5;
        targetArmTrailUpper = -0.8;
        targetArmTrailLower = 0.5;
        targetLegLeadUpper = -0.9; // Dynamic kick forward
        targetLegLeadLower = -0.3;
        targetLegTrailUpper = 0.5;
        targetLegTrailLower = -0.6;
        targetArmLeadGesture = 'thwip';
        targetArmTrailGesture = 'thwip';
        break;

      case 'jump':
        targetTorsoAngle = -0.1;
        targetTorsoOffsetY = -2;
        targetHeadAngle = 0.1;
        targetArmLeadUpper = 0.7;
        targetArmLeadLower = 0.5;
        targetArmTrailUpper = -0.7;
        targetArmTrailLower = 0.5;
        targetLegLeadUpper = -0.7;
        targetLegLeadLower = -0.6;
        targetLegTrailUpper = 0.4;
        targetLegTrailLower = -0.5;
        targetArmLeadGesture = 'thwip';
        targetArmTrailGesture = 'fist';
        break;

      case 'flip':
        targetTorsoAngle = 0;
        targetTorsoOffsetY = 0;
        targetHeadAngle = -0.3;
        targetArmLeadUpper = -1.2;
        targetArmLeadLower = 1.0;
        targetArmTrailUpper = -1.2;
        targetArmTrailLower = 1.0;
        targetLegLeadUpper = -1.1;
        targetLegLeadLower = -1.0;
        targetLegTrailUpper = -1.1;
        targetLegTrailLower = -1.0;
        targetArmLeadGesture = 'fist';
        targetArmTrailGesture = 'fist';
        break;

      case 'dive':
        targetTorsoAngle = -0.55; // Aerodynamic head-first dive
        targetTorsoOffsetY = 0;
        targetHeadAngle = 0.35;
        targetArmLeadUpper = 1.45; // Arms pinned back against sides
        targetArmLeadLower = 0.1;
        targetArmTrailUpper = 1.45;
        targetArmTrailLower = 0.1;
        targetLegLeadUpper = 0.2;
        targetLegLeadLower = -0.1;
        targetLegTrailUpper = 0.2;
        targetLegTrailLower = -0.1;
        targetArmLeadGesture = 'open';
        targetArmTrailGesture = 'open';
        break;

      case 'web_wings':
        targetTorsoAngle = -0.22;
        targetTorsoOffsetY = 0;
        targetHeadAngle = 0.15;
        targetArmLeadUpper = -1.35; // Arms outstretched wide
        targetArmLeadLower = 0.15;
        targetArmTrailUpper = 1.35;
        targetArmTrailLower = 0.15;
        targetLegLeadUpper = 0.1;
        targetLegLeadLower = -0.2;
        targetLegTrailUpper = 0.2;
        targetLegTrailLower = -0.2;
        targetArmLeadGesture = 'open';
        targetArmTrailGesture = 'open';
        break;

      case 'land':
        targetTorsoAngle = -0.45; // 3-point superhero landing crouch
        targetTorsoOffsetY = 12;
        targetHeadAngle = 0.45; // Looking forward
        targetArmLeadUpper = 0.6; // Fist touching ground
        targetArmLeadLower = 0.8;
        targetArmTrailUpper = -1.2; // Back arm flared
        targetArmTrailLower = 0.4;
        targetLegLeadUpper = -1.2; // Lead knee deep under chest
        targetLegLeadLower = -1.1;
        targetLegTrailUpper = 0.9; // Back leg extended
        targetLegTrailLower = -0.3;
        targetArmLeadGesture = 'fist';
        targetArmTrailGesture = 'open';
        break;

      case 'ultimate':
        targetTorsoAngle = 0;
        targetTorsoOffsetY = -6;
        targetHeadAngle = -0.1;
        targetArmLeadUpper = -1.4;
        targetArmLeadLower = 0.2;
        targetArmTrailUpper = 1.4;
        targetArmTrailLower = 0.2;
        targetLegLeadUpper = -0.5;
        targetLegLeadLower = -0.4;
        targetLegTrailUpper = 0.5;
        targetLegTrailLower = -0.4;
        targetArmLeadGesture = 'open';
        targetArmTrailGesture = 'open';
        break;
    }

    // Smooth continuous bone interpolation (60fps dampening)
    s.torsoAngle += (targetTorsoAngle - s.torsoAngle) * lerpSpeed;
    s.torsoOffsetY += (targetTorsoOffsetY - s.torsoOffsetY) * lerpSpeed;
    s.headAngle += (targetHeadAngle - s.headAngle) * lerpSpeed;
    s.armLeadUpper += (targetArmLeadUpper - s.armLeadUpper) * lerpSpeed;
    s.armLeadLower += (targetArmLeadLower - s.armLeadLower) * lerpSpeed;
    s.armTrailUpper += (targetArmTrailUpper - s.armTrailUpper) * lerpSpeed;
    s.armTrailLower += (targetArmTrailLower - s.armTrailLower) * lerpSpeed;
    s.legLeadUpper += (targetLegLeadUpper - s.legLeadUpper) * lerpSpeed;
    s.legLeadLower += (targetLegLeadLower - s.legLeadLower) * lerpSpeed;
    s.legTrailUpper += (targetLegTrailUpper - s.legTrailUpper) * lerpSpeed;
    s.legTrailLower += (targetLegTrailLower - s.legTrailLower) * lerpSpeed;
    s.armLeadGesture = targetArmLeadGesture;
    s.armTrailGesture = targetArmTrailGesture;
  }

  // --- WEBS & PROJECTILES UPDATE ---
  private updateWebs(dt: number) {
    const canvasW = this.canvas.width;

    for (let i = this.webs.length - 1; i >= 0; i--) {
      const web = this.webs[i];
      web.x += web.vx * dt;

      // Web smoke trail
      if (this.frameCount % 2 === 0) {
        this.particles.push({
          x: web.x,
          y: web.y,
          vx: -2,
          vy: (Math.random() - 0.5) * 1.5,
          size: 2,
          color: web.color || '#ffffff',
          alpha: 0.6,
          life: 10,
          maxLife: 10,
          type: 'web',
        });
      }

      // Check collision with obstacles
      let hit = false;
      for (const obs of this.obstacles) {
        if (
          web.x >= obs.x &&
          web.x <= obs.x + obs.width &&
          web.y >= obs.y &&
          web.y <= obs.y + obs.height
        ) {
          hit = true;
          const damage = web.isMega ? 55 : 35;
          obs.hp -= damage;

          soundFx.playExplosion();
          this.createExplosionParticles(web.x, web.y, obs.color);

          this.addComicPopup(
            obs.x + obs.width / 2,
            obs.y - 20,
            obs.isBoss ? `CRITICAL! -${damage}HP` : 'THWIP! 💥',
            '#ef4444'
          );

          // Charge ultimate on hit
          this.ultimateCharge = Math.min(100, this.ultimateCharge + (web.isMega ? 12 : 7));
          this.stats.ultimateCharge = this.ultimateCharge;

          // Increment combo
          this.incrementCombo();
          break;
        }
      }

      if (hit || web.x > canvasW + 100) {
        this.webs.splice(i, 1);
      }
    }
  }

  // --- OBSTACLES, VILLAINS & BOSS AI UPDATE ---
  private updateObstacles(dt: number) {
    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;

    // Spawn regular obstacles based on level spawn interval
    if (!this.isBossActive && this.distanceTraveled - this.lastObstacleSpawnDist > this.levelConfig.obstacleSpawnInterval) {
      this.spawnRandomObstacle();
      this.lastObstacleSpawnDist = this.distanceTraveled;
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      // Boss AI Behavior
      if (obs.isBoss) {
        this.updateBossAI(obs, dt);
      } else {
        // Regular villain / obstacle movement
        obs.x -= (this.gameSpeed + (obs.speed || 0)) * dt;

        // Airborne sin-wave floating
        if (obs.isAirborne && obs.sinOffset !== undefined) {
          obs.sinOffset += 0.05 * dt;
          obs.y += Math.sin(obs.sinOffset) * 2.2 * dt;
        }
      }

      // Check collision with hero (generous forgiving collision box)
      const heroBox = {
        x: this.playerX + 22,
        y: canvasH - (this.playerY + this.playerHeight - 20),
        w: this.playerWidth - 44,
        h: this.playerHeight - 38,
      };

      if (
        heroBox.x < obs.x + obs.width - 10 &&
        heroBox.x + heroBox.w > obs.x + 10 &&
        heroBox.y < obs.y + obs.height - 10 &&
        heroBox.y + heroBox.h > obs.y + 10
      ) {
        this.handleHeroHit(obs);
      }

      // Sub-projectiles (Pumpkin bombs / lasers from boss)
      if (obs.subProjectiles && obs.subProjectiles.length > 0) {
        for (let pIdx = obs.subProjectiles.length - 1; pIdx >= 0; pIdx--) {
          const proj = obs.subProjectiles[pIdx];
          proj.x += proj.vx * dt;
          proj.y += proj.vy * dt;

          // Check collision with hero
          if (
            proj.x >= heroBox.x &&
            proj.x <= heroBox.x + heroBox.w &&
            proj.y >= heroBox.y &&
            proj.y <= heroBox.y + heroBox.h
          ) {
            obs.subProjectiles.splice(pIdx, 1);
            this.handleHeroHit(obs);
            continue;
          }

          if (proj.x < -50 || proj.y > canvasH + 50) {
            obs.subProjectiles.splice(pIdx, 1);
          }
        }
      }

      // Defeated villain / boss
      if (obs.hp <= 0) {
        this.createExplosionParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.color, obs.isBoss ? 45 : 18);
        this.stats.villainsDefeated++;
        this.stats.totalCoins += obs.isBoss ? 100 : 15;
        this.stats.score += obs.isBoss ? 500 : 50;

        if (obs.isBoss) {
          this.isBossActive = false;
          this.activeBossRef = null;
          this.stats.activeBoss = null;
          this.triggerAlert('💥 BOSS DEFEATED!', `Threat Neutralized! +100 Tokens`, '⭐', '#10b981', 'boss', 160);
          this.triggerScreenShake(30);
          this.triggerBulletTime(90, 0.25);
        }

        this.obstacles.splice(i, 1);
        continue;
      }

      // Despawn off screen
      if (obs.x < -obs.width - 200 && !obs.isBoss) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  // --- BOSS AI & MULTI-STAGE ATTACK PATTERNS ---
  private updateBossAI(boss: Obstacle, dt: number) {
    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;

    // Hover in front of player on right side of screen
    const targetX = canvasW - 200;
    boss.x += (targetX - boss.x) * 0.05 * dt;

    boss.stateTimer = (boss.stateTimer || 0) + dt;
    boss.y = canvasH - 320 + Math.sin(boss.stateTimer * 0.04) * 65;

    // Sync Boss HUD
    if (this.stats.activeBoss) {
      this.stats.activeBoss.hp = Math.max(0, boss.hp);
    }

    // Boss Attack Cooldown
    boss.attackTimer = (boss.attackTimer || 0) - dt;

    if (boss.attackTimer <= 0) {
      boss.attackTimer = Math.max(80, 130 - Math.min(50, this.currentLevel));

      // Execute attack based on Boss Type
      if (boss.type === 'green_goblin') {
        // Goblin Pumpkin Cluster Bomb Barrage
        soundFx.playExplosion();
        for (let i = 0; i < 2; i++) {
          boss.subProjectiles?.push({
            x: boss.x,
            y: boss.y + 40,
            vx: -7 - Math.random() * 3,
            vy: -3 + i * 4,
            radius: 12,
            color: '#f97316',
          });
        }
        this.addComicPopup(boss.x, boss.y - 20, '🎃 PUMPKIN BOMB!', '#f97316');
      } else if (boss.type === 'doc_ock') {
        // Tentacle Laser Swipe
        soundFx.playZap();
        for (let i = 0; i < 2; i++) {
          boss.subProjectiles?.push({
            x: boss.x - 20,
            y: boss.y + 20 + i * 40,
            vx: -13,
            vy: (Math.random() - 0.5) * 3,
            radius: 14,
            color: '#ef4444',
            isLaser: true,
          });
        }
        this.addComicPopup(boss.x, boss.y - 20, '⚡ TENTACLE SURGE!', '#ea580c');
      } else if (boss.type === 'electro') {
        // Screen-wide Plasma Arc
        soundFx.playZap();
        this.triggerScreenFlash('#38bdf8');
        for (let i = 0; i < 3; i++) {
          boss.subProjectiles?.push({
            x: boss.x,
            y: boss.y + i * 35,
            vx: -11 - i * 2,
            vy: Math.sin(i) * 3,
            radius: 16,
            color: '#38bdf8',
          });
        }
        this.addComicPopup(boss.x, boss.y - 20, '⚡ PLASMA OVERDRIVE!', '#38bdf8');
      } else if (boss.type === 'venom') {
        // Symbiote Spike Cluster
        soundFx.playExplosion();
        for (let i = 0; i < 3; i++) {
          boss.subProjectiles?.push({
            x: boss.x,
            y: canvasH - this.groundHeight - 20,
            vx: -9 - i * 3,
            vy: -2,
            radius: 18,
            color: '#a855f7',
          });
        }
        this.addComicPopup(boss.x, boss.y - 20, '🕷️ SYMBIOTE CRUSH!', '#a855f7');
      }
    }
  }

  // --- SPAWN REGULAR OBSTACLES (BALANCED LEVEL 1-100) ---
  private spawnRandomObstacle() {
    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;

    const availableVillains = this.levelConfig.villains;
    const villainType = availableVillains[Math.floor(Math.random() * availableVillains.length)] || 'oscorp_drone';

    let width = 50;
    let height = 70;
    let yPos = canvasH - this.groundHeight - height;
    let isAirborne = false;
    let color = '#22c55e';
    let hp = 25 + this.currentLevel * 2;

    if (villainType === 'oscorp_drone') {
      width = 55;
      height = 40;
      yPos = canvasH - 190 - Math.random() * 100;
      isAirborne = true;
      color = '#38bdf8';
    } else if (villainType === 'pumpkin_bomb') {
      width = 38;
      height = 38;
      yPos = canvasH - this.groundHeight - 40;
      color = '#f97316';
    } else if (villainType === 'rooftop_barrier') {
      width = 45;
      height = 55;
      yPos = canvasH - this.groundHeight - 55;
      color = '#e2e8f0';
      hp = 40;
    } else if (villainType === 'rhino') {
      width = 85;
      height = 95;
      yPos = canvasH - this.groundHeight - 95;
      color = '#64748b';
      hp = 85;
    } else if (villainType === 'doc_ock') {
      width = 70;
      height = 80;
      yPos = canvasH - 180 - Math.random() * 80;
      isAirborne = true;
      color = '#ea580c';
    } else if (villainType === 'electro') {
      width = 60;
      height = 70;
      yPos = canvasH - 200 - Math.random() * 90;
      isAirborne = true;
      color = '#38bdf8';
    } else if (villainType === 'venom') {
      width = 80;
      height = 90;
      yPos = canvasH - this.groundHeight - 90;
      color = '#090d16';
      hp = 110;
    }

    this.obstacles.push({
      id: Math.random().toString(),
      x: canvasW + 60,
      y: yPos,
      width,
      height,
      type: villainType,
      color,
      hp,
      maxHp: hp,
      speed: Math.random() * 1.5,
      isAirborne,
      sinOffset: Math.random() * 10,
    });
  }

  // --- HERO IMPACT & DAMAGE HANDLING ---
  private handleHeroHit(obs: Obstacle) {
    if (this.shieldActive) {
      // Shield absorbs hit
      this.shieldActive = false;
      this.stats.shieldActive = false;
      soundFx.playShieldBreak();
      this.triggerScreenShake(18);
      this.triggerScreenFlash('#38bdf8');
      this.addComicPopup(this.playerX + 40, this.canvas.height - this.playerY - 40, 'NANO-SHIELD BLOCKED!', '#38bdf8');
      obs.hp = 0;
      return;
    }

    // Hero Defeated - Game Over
    soundFx.playExplosion();
    this.triggerScreenShake(30);
    this.triggerScreenFlash('#ef4444');
    this.createExplosionParticles(this.playerX + 40, this.canvas.height - this.playerY, '#ef4444', 35);

    this.isRunning = false;

    // Check & Save High Score
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      localStorage.setItem('spidey_high_score', this.stats.highScore.toString());
    }

    this.stats.totalCoins += this.stats.coinsCollected;
    localStorage.setItem('spidey_total_coins', this.stats.totalCoins.toString());

    this.onGameOver({ ...this.stats });
  }

  // --- COLLECTIBLES (COINS & POWER-UPS) ---
  private updateCollectibles(dt: number) {
    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;

    // Spawn Coins (generous spacing)
    if (this.distanceTraveled - this.lastCoinSpawnDist > 130) {
      this.spawnCoinArc();
      this.lastCoinSpawnDist = this.distanceTraveled;
    }

    // Spawn Power-Ups
    if (this.distanceTraveled - this.lastPowerUpSpawnDist > 550) {
      this.spawnPowerUp();
      this.lastPowerUpSpawnDist = this.distanceTraveled;
    }

    const heroCenter = {
      x: this.playerX + 40,
      y: canvasH - (this.playerY + 40),
    };

    // Update Coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.x -= this.gameSpeed * dt;

      // Magnet pull towards hero
      if (this.magnetTimer > 0) {
        const dx = heroCenter.x - coin.x;
        const dy = heroCenter.y - coin.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 320) {
          coin.x += (dx / dist) * 16 * dt;
          coin.y += (dy / dist) * 16 * dt;
        }
      }

      // Collect Coin
      const distToHero = Math.hypot(heroCenter.x - coin.x, heroCenter.y - coin.y);
      if (distToHero < 48) {
        soundFx.playCoin(coin.isSuper);
        this.stats.coinsCollected += coin.isSuper ? 5 : 1;
        this.stats.score += coin.isSuper ? 25 : 5;
        this.ultimateCharge = Math.min(100, this.ultimateCharge + (coin.isSuper ? 8 : 2));
        this.stats.ultimateCharge = this.ultimateCharge;

        this.createCoinPickupParticles(coin.x, coin.y);
        this.coins.splice(i, 1);
        continue;
      }

      if (coin.x < -50) {
        this.coins.splice(i, 1);
      }
    }

    // Update Power-Ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.x -= this.gameSpeed * dt;
      pu.rotation += 0.05 * dt;

      const distToHero = Math.hypot(heroCenter.x - pu.x, heroCenter.y - pu.y);
      if (distToHero < 52) {
        this.activatePowerUp(pu.type);
        this.powerUps.splice(i, 1);
        continue;
      }

      if (pu.x < -60) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  private spawnCoinArc() {
    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;
    const baseY = canvasH - this.groundHeight - 40;
    const arcHeight = 120;
    const count = 5;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * i) / (count - 1);
      const coinY = baseY - Math.sin(angle) * arcHeight;
      this.coins.push({
        id: Math.random().toString(),
        x: canvasW + 40 + i * 36,
        y: coinY,
        collected: false,
        isSuper: i === 2 && Math.random() > 0.6,
      });
    }
  }

  private spawnPowerUp() {
    const types: PowerUpType[] = ['spider_shield', 'magnet_rush', 'double_score', 'web_wings'];
    const selectedType = types[Math.floor(Math.random() * types.length)];

    this.powerUps.push({
      id: Math.random().toString(),
      x: this.canvas.width + 60,
      y: this.canvas.height - 180 - Math.random() * 80,
      type: selectedType,
      radius: 24,
      rotation: 0,
    });
  }

  private activatePowerUp(type: PowerUpType) {
    soundFx.playPowerUp();
    this.triggerScreenFlash('#38bdf8');

    if (type === 'spider_shield') {
      this.shieldActive = true;
      this.stats.shieldActive = true;
      this.triggerAlert('🛡️ NANO-SHIELD ONLINE', 'Protective kinetic forcefield active', '🛡️', '#38bdf8', 'shield', 140);
    } else if (type === 'magnet_rush') {
      this.magnetTimer = 12; // 12 seconds
      this.triggerAlert('🧲 COIN MAGNET ACTIVE', 'Looting all tokens within range (12s)', '🧲', '#eab308', 'powerup', 140);
    } else if (type === 'double_score') {
      this.doubleScoreTimer = 15; // 15 seconds
      this.triggerAlert('⭐ 2X SCORE MULTIPLIER', 'Double points awarded (15s)', '⭐', '#10b981', 'powerup', 140);
    } else if (type === 'web_wings') {
      this.webWingsTimer = 10; // 10 seconds
      this.triggerAlert('🦅 WEB WINGS GLIDE', 'Low-gravity high altitude soaring (10s)', '🦅', '#f59e0b', 'powerup', 140);
    }
  }

  private incrementCombo() {
    this.combo++;
    this.comboTimer = 120; // 2 seconds
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
      this.stats.maxCombo = this.maxCombo;
    }
    this.stats.combo = this.combo;

    if (this.combo % 3 === 0) {
      soundFx.playCombo(this.combo);
      this.addComicPopup(this.playerX + 40, this.canvas.height - this.playerY - 70, `x${this.combo} COMBO STREAK! 🔥`, '#f59e0b', 1.4);
    }
  }

  // --- THREAT RADAR TELEMETRY FOR HUD ---
  private updateIncomingThreats() {
    const threats: IncomingThreat[] = [];

    this.obstacles.forEach((obs) => {
      const distance = Math.max(0, Math.floor((obs.x - this.playerX) / 10));
      if (distance > 0 && distance < 80) {
        threats.push({
          id: obs.id,
          name: obs.bossName || (obs.type === 'oscorp_drone' ? 'Oscorp Drone' : obs.type === 'pumpkin_bomb' ? 'Pumpkin Bomb' : obs.type),
          type: obs.type,
          x: obs.x,
          y: obs.y,
          distance,
          isBoss: !!obs.isBoss,
        });
      }
    });

    threats.sort((a, b) => a.distance - b.distance);
    this.stats.incomingThreats = threats.slice(0, 3);
  }

  // --- PARTICLE EMITTERS ---
  private createJumpParticles(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 4,
        size: 2 + Math.random() * 3,
        color: this.suit.glowColor || '#ffffff',
        alpha: 0.8,
        life: 16,
        maxLife: 16,
        type: 'spark',
      });
    }
  }

  private createLandingRipples(x: number, y: number) {
    this.triggerScreenShake(6);
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 2,
        size: 3 + Math.random() * 4,
        color: 'rgba(148, 163, 184, 0.6)',
        alpha: 0.7,
        life: 18,
        maxLife: 18,
        type: 'smoke',
      });
    }
  }

  private createExplosionParticles(x: number, y: number, color: string, count: number = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1.0,
        life: 25,
        maxLife: 25,
        type: 'spark',
      });
    }
  }

  private createCoinPickupParticles(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -3 - Math.random() * 3,
        size: 2 + Math.random() * 2,
        color: '#fde047',
        alpha: 1.0,
        life: 15,
        maxLife: 15,
        type: 'spark',
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateEnvironment(dt: number) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Parallax scrolling for Far buildings
    this.farBuildings3D.forEach((b) => {
      b.x -= this.gameSpeed * 0.3 * dt;
    });
    if (this.farBuildings3D.length > 0 && this.farBuildings3D[0].x + this.farBuildings3D[0].width < -100) {
      const first = this.farBuildings3D.shift()!;
      const last = this.farBuildings3D[this.farBuildings3D.length - 1];
      first.x = (last ? last.x + last.width : w) + 20 + Math.random() * 30;
      this.farBuildings3D.push(first);
    }

    // Parallax scrolling for Mid buildings
    this.midBuildings3D.forEach((b) => {
      b.x -= this.gameSpeed * 0.65 * dt;
    });
    if (this.midBuildings3D.length > 0 && this.midBuildings3D[0].x + this.midBuildings3D[0].width < -100) {
      const first = this.midBuildings3D.shift()!;
      const last = this.midBuildings3D[this.midBuildings3D.length - 1];
      first.x = (last ? last.x + last.width : w) + 25 + Math.random() * 40;
      this.midBuildings3D.push(first);
    }

    // Searchlights rotation
    this.searchlights.forEach((sl) => {
      sl.angle += sl.speed * dt;
      if (sl.angle > 0.45 || sl.angle < -0.45) {
        sl.speed = -sl.speed;
      }
    });

    // Thunderstorm Rain
    if (this.theme === 'thunder_storm') {
      this.rainDrops.forEach((r) => {
        r.y += r.speed * dt;
        r.x -= 4 * dt;
        if (r.y > h) {
          r.y = -20;
          r.x = Math.random() * w;
        }
      });

      // Periodic Lightning
      this.lightningTimer += dt;
      if (this.lightningTimer > 180 + Math.random() * 200) {
        this.lightningTimer = 0;
        this.triggerScreenFlash('rgba(224, 242, 254, 0.85)');
        soundFx.playZap();
      }
    }
  }

  // =========================================================================
  // --- RENDERING PIPELINE (ULTRA-REALISTIC GRAPHICS & DYNAMIC CAMERA) ---
  // =========================================================================
  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    // 1. Dynamic Cinematic Camera Setup (Pan, Zoom, Dutch Angle, Spring Shake)
    ctx.translate(w / 2, h / 2);
    if (this.cameraShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.cameraShake * 2;
      const shakeY = (Math.random() - 0.5) * this.cameraShake * 2;
      ctx.translate(shakeX, shakeY);
    }
    ctx.rotate(this.cameraTilt);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.translate(-w / 2, -h / 2);

    // 2. Sky Atmosphere Gradient
    this.renderAtmosphericSky(w, h);

    // 3. Volumetric Searchlights
    this.renderSearchlights(h);

    // 4. Far Parallax 3D Skyline
    this.renderParallaxSkyline(this.farBuildings3D, h, 0.45);

    // 5. Mid Parallax 3D Skyline with Illuminated Windows & Holograms
    this.renderParallaxSkyline(this.midBuildings3D, h, 0.75, true);

    // 6. Rooftop Ground Surface
    this.renderRooftopGround(w, h);

    // 7. Web Lines & Tensile Anchor Strands
    this.renderWebLines(h);

    // 8. Collectibles (Coins & Power-Ups)
    this.renderCollectibles();

    // 9. Obstacles & Intimidating Villains (Goblin, Doc Ock, Electro, Venom)
    this.renderObstacles(h);

    // 10. REALISTIC SPIDER-MAN CHARACTER MODEL
    this.renderSpiderManHero(h);

    // 11. Particle FX & Weather (Sparks, Comic Popups, Rain)
    this.renderParticlesAndWeather(w, h);

    // 12. Fullscreen Screen Flash Overlay
    if (this.screenFlash > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.screenFlash * 0.7;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }

  // --- SKY GRADIENT ---
  private renderAtmosphericSky(w: number, h: number) {
    const ctx = this.ctx;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);

    if (this.theme === 'sunset_rooftop') {
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.35, '#581c87');
      skyGrad.addColorStop(0.65, '#c026d3');
      skyGrad.addColorStop(0.85, '#f97316');
      skyGrad.addColorStop(1, '#fbbf24');
    } else if (this.theme === 'crimson_dawn') {
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.4, '#450a0a');
      skyGrad.addColorStop(0.75, '#991b1b');
      skyGrad.addColorStop(1, '#ea580c');
    } else if (this.theme === 'golden_hour') {
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.4, '#854d0e');
      skyGrad.addColorStop(0.8, '#d97706');
      skyGrad.addColorStop(1, '#fde047');
    } else if (this.theme === 'thunder_storm') {
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#0f172a');
      skyGrad.addColorStop(0.8, '#1e293b');
      skyGrad.addColorStop(1, '#334155');
    } else {
      // Neon Cyber Night
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.4, '#090d16');
      skyGrad.addColorStop(0.8, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = '#ffffff';
    this.stars.forEach((s) => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }

  // --- VOLUMETRIC SEARCHLIGHTS ---
  private renderSearchlights(h: number) {
    const ctx = this.ctx;
    this.searchlights.forEach((sl) => {
      ctx.save();
      ctx.translate(sl.x, h - this.groundHeight);
      ctx.rotate(sl.angle);

      const grad = ctx.createLinearGradient(0, 0, 0, -h * 0.9);
      grad.addColorStop(0, sl.color);
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(-sl.width, -h * 0.9);
      ctx.lineTo(sl.width, -h * 0.9);
      ctx.lineTo(15, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  // --- 3D BUILDINGS & BILLBOARDS ---
  private renderParallaxSkyline(buildings: Building3D[], h: number, alpha: number, hasBillboards: boolean = false) {
    const ctx = this.ctx;
    const groundY = h - this.groundHeight;

    buildings.forEach((b) => {
      const topY = groundY - b.height;

      // Front Face
      ctx.fillStyle = b.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(b.x, topY, b.width, b.height);

      // Top Roof Slope
      ctx.fillStyle = b.roofColor;
      ctx.beginPath();
      ctx.moveTo(b.x, topY);
      ctx.lineTo(b.x + b.depth, topY - b.depth * 0.4);
      ctx.lineTo(b.x + b.width + b.depth, topY - b.depth * 0.4);
      ctx.lineTo(b.x + b.width, topY);
      ctx.closePath();
      ctx.fill();

      // Right Side Depth Extrusion
      ctx.fillStyle = b.sideColor;
      ctx.beginPath();
      ctx.moveTo(b.x + b.width, topY);
      ctx.lineTo(b.x + b.width + b.depth, topY - b.depth * 0.4);
      ctx.lineTo(b.x + b.width + b.depth, groundY - b.depth * 0.4);
      ctx.lineTo(b.x + b.width, groundY);
      ctx.closePath();
      ctx.fill();

      // Illuminated Windows
      b.windows.forEach((win) => {
        const wx = b.x + 12 + win.col * 22;
        const wy = topY + 16 + win.row * 26;
        if (wx < b.x + b.width - 12 && wy < groundY - 14) {
          ctx.fillStyle = win.color;
          ctx.globalAlpha = alpha * 0.85;
          ctx.fillRect(wx, wy, 10, 14);
        }
      });

      // Holographic Neon Billboards
      if (hasBillboards && b.hasNeonSign && b.neonText) {
        const signY = topY + 30;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(b.x + 10, signY, b.width - 20, 32);

        ctx.fillStyle = b.neonColor || '#ef4444';
        ctx.shadowColor = b.neonColor || '#ef4444';
        ctx.shadowBlur = 12;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.neonText, b.x + b.width / 2, signY + 20);
        ctx.shadowBlur = 0;
      }
    });

    ctx.globalAlpha = 1.0;
  }

  // --- ROOFTOP GROUND SURFACE ---
  private renderRooftopGround(w: number, h: number) {
    const ctx = this.ctx;
    const groundY = h - this.groundHeight;

    // Roof Concrete Base
    const roofGrad = ctx.createLinearGradient(0, groundY, 0, h);
    roofGrad.addColorStop(0, '#1e293b');
    roofGrad.addColorStop(0.2, '#0f172a');
    roofGrad.addColorStop(1, '#020617');

    ctx.fillStyle = roofGrad;
    ctx.fillRect(0, groundY, w, this.groundHeight);

    // Neon Edge Trim
    ctx.strokeStyle = this.theme === 'sunset_rooftop' ? '#f43f5e' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // --- WEB LINES ---
  private renderWebLines(h: number) {
    const ctx = this.ctx;

    // Active Skyscraper Web Swing Line
    if (this.isSwinging) {
      const heroHandX = this.playerX + this.playerWidth / 2 + 10;
      const heroHandY = h - (this.playerY + this.playerHeight * 0.65);

      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(this.swingAnchorX, this.swingAnchorY);
      // Elastic tensile curve
      const midX = (this.swingAnchorX + heroHandX) / 2;
      const midY = (this.swingAnchorY + heroHandY) / 2 + 15;
      ctx.quadraticCurveTo(midX, midY, heroHandX, heroHandY);
      ctx.stroke();

      // Glowing Anchor Node
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(this.swingAnchorX, this.swingAnchorY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Shot Web Projectiles
    this.webs.forEach((web) => {
      ctx.save();
      ctx.strokeStyle = web.color || '#ffffff';
      ctx.lineWidth = web.isMega ? 5 : 3.5;
      ctx.shadowColor = web.color || '#38bdf8';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(web.x - web.length, web.y);
      ctx.lineTo(web.x, web.y);
      ctx.stroke();

      // Web head ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(web.x, web.y, web.isMega ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // --- COLLECTIBLES ---
  private renderCollectibles() {
    const ctx = this.ctx;

    // Coins
    this.coins.forEach((coin) => {
      ctx.save();
      ctx.translate(coin.x, coin.y);

      // Pulsating Gold Glow
      ctx.shadowColor = coin.isSuper ? '#f59e0b' : '#eab308';
      ctx.shadowBlur = 12;
      ctx.fillStyle = coin.isSuper ? '#f59e0b' : '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, coin.isSuper ? 16 : 12, 0, Math.PI * 2);
      ctx.fill();

      // Inner Coin Rim
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, coin.isSuper ? 11 : 8, 0, Math.PI * 2);
      ctx.fill();

      // Spider Emblem Stamp
      ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${coin.isSuper ? 13 : 9}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🕷', 0, 0);

      ctx.restore();
    });

    // Power-Ups
    this.powerUps.forEach((pu) => {
      ctx.save();
      ctx.translate(pu.x, pu.y);
      ctx.rotate(pu.rotation);

      const colorMap: Record<PowerUpType, string> = {
        spider_shield: '#38bdf8',
        magnet_rush: '#eab308',
        double_score: '#10b981',
        web_wings: '#ec4899',
      };

      const color = colorMap[pu.type] || '#38bdf8';
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;

      // Hexagon Outer Pod
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = Math.cos(angle) * pu.radius;
        const hy = Math.sin(angle) * pu.radius;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Icon
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon =
        pu.type === 'spider_shield'
          ? '🛡️'
          : pu.type === 'magnet_rush'
          ? '🧲'
          : pu.type === 'double_score'
          ? '⭐'
          : '🦅';
      ctx.fillText(icon, 0, 0);

      ctx.restore();
    });
  }

  // --- INTIMIDATING VILLAINS & BOSS RENDERING ---
  private renderObstacles(h: number) {
    const ctx = this.ctx;

    this.obstacles.forEach((obs) => {
      ctx.save();
      ctx.translate(obs.x, obs.y);

      if (obs.type === 'green_goblin') {
        this.renderGreenGoblin(ctx, obs);
      } else if (obs.type === 'doc_ock') {
        this.renderDocOck(ctx, obs);
      } else if (obs.type === 'electro') {
        this.renderElectro(ctx, obs);
      } else if (obs.type === 'venom') {
        this.renderVenom(ctx, obs);
      } else if (obs.type === 'rhino') {
        this.renderRhino(ctx, obs);
      } else if (obs.type === 'oscorp_drone') {
        this.renderOscorpDrone(ctx, obs);
      } else if (obs.type === 'pumpkin_bomb') {
        this.renderPumpkinBomb(ctx, obs);
      } else if (obs.type === 'rooftop_barrier') {
        this.renderRooftopBarrier(ctx, obs);
      }

      // Boss / Villain Health Bar
      if (obs.maxHp > 30) {
        const barW = obs.width;
        const barH = 6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, -14, barW, barH);

        const hpRatio = Math.max(0, obs.hp / obs.maxHp);
        ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(0, -14, barW * hpRatio, barH);
      }

      ctx.restore();

      // Render Sub-Projectiles (Missiles / Lasers)
      if (obs.subProjectiles) {
        obs.subProjectiles.forEach((proj) => {
          ctx.save();
          ctx.shadowColor = proj.color;
          ctx.shadowBlur = 15;
          ctx.fillStyle = proj.color;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }
    });
  }

  // --- VILLAIN 1: GREEN GOBLIN ON GLIDER ---
  private renderGreenGoblin(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const w = obs.width;
    const h = obs.height;

    // 1. Glider Thruster Flames
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.85);
    ctx.lineTo(w * 0.1, h * 0.95 + Math.random() * 8);
    ctx.lineTo(w * 0.35, h * 0.85);
    ctx.fill();

    // 2. Holographic Glider Wing
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.75);
    ctx.lineTo(w * 0.5, h * 0.65);
    ctx.lineTo(w, h * 0.85);
    ctx.lineTo(w * 0.6, h * 0.95);
    ctx.closePath();
    ctx.fill();

    // 3. Goblin Armor Body
    ctx.fillStyle = '#15803d'; // Goblin Emerald
    ctx.fillRect(w * 0.35, h * 0.25, w * 0.3, h * 0.4);

    // 4. Purple Tunic Hood
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.2, 16, 0, Math.PI * 2);
    ctx.fill();

    // 5. Glowing Yellow Menacing Eyes
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 10;
    ctx.fillRect(w * 0.42, h * 0.18, 5, 4);
    ctx.fillRect(w * 0.54, h * 0.18, 5, 4);
  }

  // --- VILLAIN 2: DOC OCK WITH 4 ARTICULATED TENTACLES ---
  private renderDocOck(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const w = obs.width;
    const h = obs.height;

    // Articulated Steel Tentacles with Segmented Rings & Laser Claws
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';

    const time = this.frameCount * 0.08;
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 0.5 * i) + Math.sin(time + i * 1.5) * 0.45;
      const tx = w * 0.5 + Math.cos(angle) * (w * 0.75);
      const ty = h * 0.5 + Math.sin(angle) * (h * 0.75);

      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.5);
      ctx.quadraticCurveTo(w * 0.5 + Math.cos(angle) * (w * 0.45), h * 0.5 + 25, tx, ty);
      ctx.stroke();

      // Glowing Tri-Pinch Titanium Claws
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(tx, ty, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Doc Ock Body & Dark Green Trenchcoat
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.roundRect(w * 0.32, h * 0.28, w * 0.36, h * 0.55, 6);
    ctx.fill();

    // Head with Iconic Round Yellow Sunglasses
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.22, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#eab308';
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(w * 0.43, h * 0.21, 4.5, 0, Math.PI * 2);
    ctx.arc(w * 0.57, h * 0.21, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // --- VILLAIN 3: ELECTRO (HIGH VOLTAGE PLASMA STORM) ---
  private renderElectro(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const w = obs.width;
    const h = obs.height;

    // Pulsing Plasma Sphere Core
    const pulse = 1 + Math.sin(this.frameCount * 0.2) * 0.15;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 28;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';

    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, (w * 0.38) * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Inner Stark White Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, 12, 0, Math.PI * 2);
    ctx.fill();

    // Dynamic Lightning Tendrils Branching Out
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.5);
      const midX = w * 0.5 + (Math.random() - 0.5) * w * 0.6;
      const midY = h * 0.5 + (Math.random() - 0.5) * h * 0.6;
      const endX = w * 0.5 + (Math.random() - 0.5) * w * 1.1;
      const endY = h * 0.5 + (Math.random() - 0.5) * h * 1.1;
      ctx.lineTo(midX, midY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }

  // --- VILLAIN 4: VENOM / SYMBIOTE BEAST ---
  private renderVenom(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const w = obs.width;
    const h = obs.height;

    // Massive Muscular Black Silhouette with Organic Symbiote Sheen
    ctx.fillStyle = '#05070e';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.55, w * 0.42, h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Jagged Spider Logo on Chest
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.25, h * 0.38);
    ctx.lineTo(w * 0.75, h * 0.72);
    ctx.moveTo(w * 0.75, h * 0.38);
    ctx.lineTo(w * 0.25, h * 0.72);
    ctx.stroke();

    // Gaping Monster Jaws & Fangs
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.38, w * 0.28, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Sharp Fangs
    ctx.fillStyle = '#ffffff';
    for (let f = 0; f < 5; f++) {
      const fx = w * 0.3 + f * (w * 0.1);
      ctx.beginPath();
      ctx.moveTo(fx, h * 0.32);
      ctx.lineTo(fx + 4, h * 0.42);
      ctx.lineTo(fx + 8, h * 0.32);
      ctx.fill();
    }

    // Slanted Aggressive Symbiote Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(w * 0.32, h * 0.2);
    ctx.lineTo(w * 0.46, h * 0.26);
    ctx.lineTo(w * 0.34, h * 0.29);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w * 0.68, h * 0.2);
    ctx.lineTo(w * 0.54, h * 0.26);
    ctx.lineTo(w * 0.66, h * 0.29);
    ctx.closePath();
    ctx.fill();
  }

  // --- VILLAIN 5: RHINO JUGGERNAUT ---
  private renderRhino(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const w = obs.width;
    const h = obs.height;

    // Heavy Titanium Grey Armor Body
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(w * 0.18, h * 0.22, w * 0.65, h * 0.7, 8);
    ctx.fill();

    // Armor Shoulder Pads & Seams
    ctx.fillStyle = '#64748b';
    ctx.fillRect(w * 0.12, h * 0.22, w * 0.2, h * 0.35);
    ctx.fillRect(w * 0.68, h * 0.22, w * 0.2, h * 0.35);

    // Deadly Titanium Horn
    ctx.fillStyle = '#e2e8f0';
    ctx.shadowColor = '#e2e8f0';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(w * 0.08, h * 0.32);
    ctx.lineTo(w * 0.32, h * 0.04);
    ctx.lineTo(w * 0.42, h * 0.34);
    ctx.closePath();
    ctx.fill();

    // Glowing Red Combat Visor
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.fillRect(w * 0.25, h * 0.36, w * 0.4, 6);
    ctx.shadowBlur = 0;
  }

  // --- VILLAIN 6: OSCORP HUNTER DRONE ---
  private renderOscorpDrone(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const w = obs.width;
    const h = obs.height;

    // Dual Rotating Propeller Rotors
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h * 0.2);
    ctx.lineTo(w * 0.35, h * 0.2);
    ctx.moveTo(w * 0.65, h * 0.2);
    ctx.lineTo(w * 0.95, h * 0.2);
    ctx.stroke();

    // Carbon Armor Hull
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(w * 0.16, h * 0.28, w * 0.68, h * 0.44, 6);
    ctx.fill();
    ctx.stroke();

    // Glowing Scanner Targeting Eye & Forward Laser
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, 7, 0, Math.PI * 2);
    ctx.fill();

    // Forward Targeting Beam
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.5);
    ctx.lineTo(-w * 0.8, h * 0.5);
    ctx.stroke();
  }

  // --- VILLAIN 7: PUMPKIN BOMB ---
  private renderPumpkinBomb(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const w = obs.width;
    const h = obs.height;

    // Glowing Orange Flame Core
    ctx.fillStyle = '#ea580c';
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, w * 0.46, 0, Math.PI * 2);
    ctx.fill();

    // Jack-o-lantern Glowing Eyes & Menacing Smile
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 10;

    // Eyes
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.35);
    ctx.lineTo(w * 0.43, h * 0.45);
    ctx.lineTo(w * 0.27, h * 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w * 0.65, h * 0.35);
    ctx.lineTo(w * 0.73, h * 0.45);
    ctx.lineTo(w * 0.57, h * 0.45);
    ctx.closePath();
    ctx.fill();

    // Jagged Smile
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.62);
    ctx.lineTo(w * 0.4, h * 0.74);
    ctx.lineTo(w * 0.5, h * 0.62);
    ctx.lineTo(w * 0.6, h * 0.74);
    ctx.lineTo(w * 0.7, h * 0.62);
    ctx.lineTo(w * 0.5, h * 0.8);
    ctx.closePath();
    ctx.fill();
  }

  // --- VILLAIN 8: ROOFTOP BARRIER ---
  private renderRooftopBarrier(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const w = obs.width;
    const h = obs.height;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 4);
    ctx.fill();

    // Hazard Caution Stripes
    ctx.fillStyle = '#f59e0b';
    for (let s = 0; s < 4; s++) {
      ctx.beginPath();
      ctx.moveTo(s * (w * 0.35), 0);
      ctx.lineTo(s * (w * 0.35) + 12, 0);
      ctx.lineTo(s * (w * 0.35) - 10, h);
      ctx.lineTo(s * (w * 0.35) - 22, h);
      ctx.closePath();
      ctx.fill();
    }
  }

  // =========================================================================
  // --- ULTRA-REALISTIC SPIDER-MAN CHARACTER MODEL (AAA SUPERHERO RENDER) ---
  // =========================================================================
  private renderSpiderManHero(h: number) {
    const ctx = this.ctx;
    const heroScreenY = h - this.playerY;
    const suit = this.suit;
    const s = this.skeleton;
    const isSprint = this.heroPose === 'sprint';
    const isSwing = this.isSwinging;

    // Ground dynamic contact shadow (scales with jump elevation & squash)
    if (this.isGrounded) {
      ctx.save();
      const shadowW = 26 + Math.abs(Math.sin(this.runAnimCycle)) * 6;
      const shadowH = 7 - (s.torsoOffsetY > 6 ? 2 : 0);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.5)';
      ctx.beginPath();
      ctx.ellipse(this.playerX + this.playerWidth / 2, h - this.groundHeight + 2, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Projected ground shadow when airborne
      const altitude = Math.max(0, this.playerY - this.groundHeight);
      if (altitude < 350) {
        const shadowScale = Math.max(0.2, 1 - altitude / 350);
        ctx.save();
        ctx.fillStyle = `rgba(2, 6, 23, ${0.35 * shadowScale})`;
        ctx.beginPath();
        ctx.ellipse(this.playerX + this.playerWidth / 2, h - this.groundHeight + 2, 28 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 1. High-Speed Ghost Blur Afterimages with Dynamic Suit Glow
    this.playerTrails.forEach((trail) => {
      ctx.save();
      ctx.translate(trail.x + this.playerWidth / 2, h - trail.y - this.playerHeight / 2);
      ctx.rotate(trail.rotation);
      ctx.globalAlpha = trail.alpha * 0.45;
      ctx.fillStyle = trail.color || suit.glowColor || suit.primaryColor;
      ctx.shadowColor = trail.color || suit.glowColor || suit.primaryColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.playerWidth * 0.46, this.playerHeight * 0.46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 2. Aerodynamic Supersonic Wind Ribbons (High-velocity streaming lines)
    if (isSprint || isSwing || this.heroPose === 'dive') {
      ctx.save();
      const ribbonAlpha = 0.35 + Math.random() * 0.25;
      ctx.strokeStyle = suit.glowColor || '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = suit.glowColor || '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.globalAlpha = ribbonAlpha;

      for (let r = 0; r < 4; r++) {
        const offsetR = (r - 1.5) * 14;
        const trailLen = 35 + Math.random() * 30;
        ctx.beginPath();
        ctx.moveTo(this.playerX + this.playerWidth / 2 - 10, heroScreenY - this.playerHeight / 2 + offsetR);
        ctx.lineTo(this.playerX + this.playerWidth / 2 - 10 - trailLen, heroScreenY - this.playerHeight / 2 + offsetR + (Math.random() - 0.5) * 6);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Spider-Man Root Transformation & Dynamic Pose Pivot
    ctx.save();
    ctx.translate(this.playerX + this.playerWidth / 2, heroScreenY - this.playerHeight / 2 + s.torsoOffsetY);
    ctx.rotate(this.playerRotation + s.torsoAngle);

    const w = this.playerWidth;
    const halfW = w / 2;

    // 3. Multi-Layered Suit Radiant Bloom & Combo Glow Field
    ctx.save();
    const glowIntensity = 10 + this.heroGlowPulse * 12 + (this.combo >= 5 ? 12 : 0);
    ctx.shadowColor = suit.glowColor || suit.primaryColor;
    ctx.shadowBlur = glowIntensity;

    // 4. Nano-Shield Hexagonal Forcefield Aura
    if (this.shieldActive) {
      ctx.save();
      const shieldPulse = 1 + Math.sin(this.frameCount * 0.12) * 0.08;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 24;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + this.frameCount * 0.025;
        const hx = Math.cos(angle) * (w * 0.8 * shieldPulse);
        const hy = Math.sin(angle) * (w * 0.8 * shieldPulse);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fill();
      ctx.restore();
    }

    // 5. Translucent Aerodynamic Web Wings
    if (this.webWingsTimer > 0 || this.heroPose === 'web_wings') {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.strokeStyle = suit.glowColor || '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = suit.glowColor || '#38bdf8';
      ctx.shadowBlur = 10;
      
      // Underarm Wing Fabric
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.4, -6);
      ctx.lineTo(-halfW * 1.6, halfW * 0.7);
      ctx.lineTo(-halfW * 0.2, halfW * 1.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Translucent Wing Web Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.4, -6);
      ctx.lineTo(-halfW * 0.9, halfW * 0.9);
      ctx.moveTo(-halfW * 1.1, halfW * 0.2);
      ctx.lineTo(-halfW * 0.3, halfW * 0.6);
      ctx.stroke();
      ctx.restore();
    }

    // 6. SUIT-SPECIFIC SUPERPOWER VISUALS & EFFECTS
    // A. Miles Morales Bio-Electric Venom Strike Lightning Arcs
    if (suit.id === 'miles' && (isSwing || isSprint || this.combo >= 4 || this.heroPose === 'jump')) {
      ctx.save();
      ctx.strokeStyle = Math.random() > 0.4 ? '#facc15' : '#38bdf8';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 14;

      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        let lx = (Math.random() - 0.5) * 24;
        let ly = (Math.random() - 0.5) * 32;
        ctx.moveTo(lx, ly);
        for (let seg = 0; seg < 3; seg++) {
          lx += (Math.random() - 0.5) * 20;
          ly += (Math.random() - 0.5) * 20;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // B. Iron Spider: 4 Articulated Nanotech Golden Waldoes (Mechanical Spider Legs)
    if (suit.id === 'iron_spider') {
      ctx.save();
      const waldoPulse = Math.sin(this.frameCount * 0.15) * 0.12;
      const waldoAngles = [
        -2.1 + (isSwing ? 0.3 : waldoPulse),
        -1.3 - (isSwing ? 0.2 : waldoPulse),
        1.3 + (isSwing ? 0.2 : waldoPulse),
        2.1 - (isSwing ? 0.3 : waldoPulse),
      ];

      waldoAngles.forEach((baseAngle, idx) => {
        ctx.save();
        ctx.translate(-2, idx < 2 ? -6 : 4);
        ctx.rotate(baseAngle);

        // Waldo Segment 1 (Upper Segment - Gold Armor)
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -18);
        ctx.stroke();

        // Waldo Articulation Joint
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(0, -18, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Waldo Segment 2 (Lower Segment - Sharp Claws)
        ctx.translate(0, -18);
        ctx.rotate(idx < 2 ? -0.7 : 0.7);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -16);
        ctx.stroke();

        // Glowing Cyan Repulsor Tip Node
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, -16, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });
      ctx.restore();
    }

    // C. Symbiote Writhing Living Tendrils
    if (suit.id === 'symbiote' && (isSwing || isSprint || this.combo >= 2)) {
      ctx.save();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 10;

      for (let t = 0; t < 3; t++) {
        const angle = -1.2 + t * 1.2 + Math.sin(this.frameCount * 0.2 + t) * 0.4;
        ctx.beginPath();
        ctx.moveTo(-4, -4 + t * 6);
        const tx = Math.cos(angle) * (20 + Math.sin(this.frameCount * 0.25) * 6);
        const ty = Math.sin(angle) * (20 + Math.cos(this.frameCount * 0.25) * 6);
        ctx.quadraticCurveTo(-15, ty * 0.5, tx, ty);
        ctx.stroke();
      }
      ctx.restore();
    }

    // D. Spider-Man 2099 Holographic Glitch Silhouette
    if (suit.id === 'spiderman_2099' && (this.frameCount % 5 === 0)) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillRect(-12 + (Math.random() - 0.5) * 8, -14, 24, 28);
      ctx.restore();
    }

    // --- ANATOMICAL LIMB SKELETAL KINEMATICS RENDERING ---
    // 1. Back Arm (Trailing Arm)
    this.renderHeroLimb(
      ctx,
      -9,
      -6,
      s.armTrailUpper,
      s.armTrailLower,
      23,
      suit.primaryColor,
      suit.secondaryColor,
      true,
      suit.id,
      s.armTrailGesture
    );

    // 2. Back Leg (Trailing Leg)
    this.renderHeroLimb(
      ctx,
      -6,
      12,
      s.legTrailUpper,
      s.legTrailLower,
      27,
      suit.secondaryColor,
      suit.primaryColor,
      false,
      suit.id
    );

    // 3. Muscular Anatomical Torso & Chest Armor
    ctx.save();
    
    // Torso Base (Primary Color: Crimson / Stealth Black / Cyber Navy)
    ctx.fillStyle = suit.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-11, -12);
    ctx.lineTo(13, -12);
    ctx.lineTo(9, 14);
    ctx.lineTo(-8, 14);
    ctx.closePath();
    ctx.fill();

    // Chest Pectoral & Abdominal Contours
    ctx.fillStyle = suit.primaryColor;
    ctx.beginPath();
    ctx.ellipse(1, -4, 13, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lateral Ribcage Inlays (Secondary Color: Navy Blue / Gold / Obsidian)
    ctx.fillStyle = suit.secondaryColor;
    ctx.beginPath();
    ctx.moveTo(-11, -6);
    ctx.lineTo(-5, -6);
    ctx.lineTo(-4, 12);
    ctx.lineTo(-9, 12);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(11, -6);
    ctx.lineTo(5, -6);
    ctx.lineTo(4, 12);
    ctx.lineTo(9, 12);
    ctx.closePath();
    ctx.fill();

    // High-Resolution Web Lattice Pattern on Chest
    if (suit.id !== 'symbiote') {
      ctx.strokeStyle = suit.id === 'miles' ? 'rgba(239, 68, 68, 0.4)' : suit.id === 'iron_spider' ? 'rgba(234, 179, 8, 0.5)' : 'rgba(2, 6, 23, 0.65)';
      ctx.lineWidth = 1.2;

      // Vertical radial web lines
      ctx.beginPath();
      ctx.moveTo(1, -12);
      ctx.lineTo(1, 14);
      ctx.moveTo(-6, -10);
      ctx.lineTo(-4, 12);
      ctx.moveTo(7, -10);
      ctx.lineTo(5, 12);
      ctx.stroke();

      // Curved horizontal web cross-bars
      ctx.beginPath();
      ctx.arc(1, -16, 12, 0.3, Math.PI - 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(1, -10, 14, 0.3, Math.PI - 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(1, -2, 13, 0.3, Math.PI - 0.3);
      ctx.stroke();
    }

    // Iconic Comic Spider Emblem on Chest
    ctx.save();
    if (suit.id === 'symbiote') {
      // Bold Stark White Venom Spider Emblem with Spanning Legs
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      // Spider Body
      ctx.ellipse(1, 0, 3.5, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 8 Articulated Legs
      ctx.moveTo(1, -2); ctx.lineTo(-9, -8); ctx.lineTo(-11, -4);
      ctx.moveTo(1, -1); ctx.lineTo(-10, -3); ctx.lineTo(-12, 1);
      ctx.moveTo(1, 1);  ctx.lineTo(-10, 5);  ctx.lineTo(-9, 11);
      ctx.moveTo(1, 3);  ctx.lineTo(-8, 9);   ctx.lineTo(-6, 13);

      ctx.moveTo(1, -2); ctx.lineTo(10, -8);  ctx.lineTo(12, -4);
      ctx.moveTo(1, -1); ctx.lineTo(11, -3);  ctx.lineTo(13, 1);
      ctx.moveTo(1, 1);  ctx.lineTo(11, 5);   ctx.lineTo(10, 11);
      ctx.moveTo(1, 3);  ctx.lineTo(9, 9);    ctx.lineTo(7, 13);
      ctx.stroke();
    } else if (suit.id === 'miles') {
      // Spray-Painted Crimson Spider Logo (Spider-Verse)
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.ellipse(1, 0, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.moveTo(1, -2); ctx.lineTo(-8, -6);
      ctx.moveTo(1, -1); ctx.lineTo(-9, 0);
      ctx.moveTo(1, 1);  ctx.lineTo(-8, 6);
      ctx.moveTo(1, 3);  ctx.lineTo(-6, 11);

      ctx.moveTo(1, -2); ctx.lineTo(9, -6);
      ctx.moveTo(1, -1); ctx.lineTo(10, 0);
      ctx.moveTo(1, 1);  ctx.lineTo(9, 6);
      ctx.moveTo(1, 3);  ctx.lineTo(7, 11);
      ctx.stroke();
    } else if (suit.id === 'iron_spider') {
      // Golden High-Tech Spider Emblem with Nano Arc Core
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-8, -6); ctx.lineTo(1, 0); ctx.lineTo(9, -6);
      ctx.moveTo(-9, 8);  ctx.lineTo(1, 0); ctx.lineTo(10, 8);
      ctx.stroke();

      // Glowing Cyan Arc Core
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(1, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (suit.id === 'spiderman_2099') {
      // Neon Red Cyber Skull-Spider Crest
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(1, -7); ctx.lineTo(-7, -2); ctx.lineTo(-5, 7); ctx.lineTo(1, 4); ctx.lineTo(6, 7); ctx.lineTo(8, -2);
      ctx.closePath();
      ctx.fill();
    } else {
      // Classic Black Spider Emblem
      ctx.strokeStyle = '#020617';
      ctx.fillStyle = '#020617';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(1, 0, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.moveTo(1, -2); ctx.lineTo(-8, -6);
      ctx.moveTo(1, -1); ctx.lineTo(-9, 0);
      ctx.moveTo(1, 1);  ctx.lineTo(-8, 6);
      ctx.moveTo(1, 3);  ctx.lineTo(-6, 11);

      ctx.moveTo(1, -2); ctx.lineTo(9, -6);
      ctx.moveTo(1, -1); ctx.lineTo(10, 0);
      ctx.moveTo(1, 1);  ctx.lineTo(9, 6);
      ctx.moveTo(1, 3);  ctx.lineTo(7, 11);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore(); // Restore Torso

    // 4. Front Leg (Leading Leg)
    this.renderHeroLimb(
      ctx,
      4,
      12,
      s.legLeadUpper,
      s.legLeadLower,
      27,
      suit.secondaryColor,
      suit.primaryColor,
      false,
      suit.id
    );

    // 5. Front Arm (Leading Arm & Web Shooter)
    this.renderHeroLimb(
      ctx,
      8,
      -6,
      s.armLeadUpper,
      s.armLeadLower,
      23,
      suit.primaryColor,
      suit.secondaryColor,
      true,
      suit.id,
      s.armLeadGesture
    );

    // 6. Spider-Man Head, Mask Silhouette & Expressive Mask Lenses
    ctx.save();
    ctx.translate(4, -18);
    ctx.rotate(s.headAngle);

    // Head Base Mask
    ctx.fillStyle = suit.primaryColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mask Web Pattern (Spider-Grid)
    if (suit.id !== 'symbiote') {
      ctx.strokeStyle = suit.id === 'miles' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(2, 6, 23, 0.65)';
      ctx.lineWidth = 1;

      // Concentric web rings
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 13, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Radial spokes radiating from mask center
      for (let i = 0; i < 6; i++) {
        const rad = (Math.PI / 3) * i;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(rad) * 13, Math.sin(rad) * 15);
        ctx.stroke();
      }
    }

    // High-Tech Spider Mask Lenses (Dual Layer: Glossy Bevel Rim + Specular Lens)
    const squintY = this.eyeSquint * 4;

    // Front (Right) Eye Lens
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(3, -7);
    ctx.lineTo(13, -3 + squintY);
    ctx.lineTo(5, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Inner Specular White/Cyan Lens with Radiant Eye Glow
    ctx.fillStyle = suit.eyeColor || '#ffffff';
    ctx.shadowColor = suit.glowColor || suit.eyeColor || '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(11.5, -2 + squintY * 0.8);
    ctx.lineTo(5.5, 3.5);
    ctx.closePath();
    ctx.fill();

    // Specular Glint Highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6, -2, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Back (Left) Eye Lens
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-2, -7);
    ctx.lineTo(-9, -3 + squintY);
    ctx.lineTo(-3, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.fillStyle = suit.eyeColor || '#ffffff';
    ctx.shadowColor = suit.glowColor || suit.eyeColor || '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-2.5, -5);
    ctx.lineTo(-7.5, -2 + squintY * 0.8);
    ctx.lineTo(-3.5, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore(); // Restore Head

    ctx.restore(); // Restore Glow
    ctx.restore(); // Restore Hero Root
  }

  // Articulated 2-segment Limb Renderer with Web-Shooters & Hand Gestures
  private renderHeroLimb(
    ctx: CanvasRenderingContext2D,
    pivotX: number,
    pivotY: number,
    upperAngle: number,
    lowerAngle: number,
    totalLength: number,
    mainColor: string,
    accentColor: string,
    isArm: boolean,
    suitId?: string,
    gesture: 'thwip' | 'fist' | 'open' | 'web_grip' = 'thwip'
  ) {
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(upperAngle);

    const halfLen = totalLength * 0.52;

    // Segment 1: Upper Limb (Bicep / Thigh)
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.roundRect(-4.5, 0, 9, halfLen, 4);
    ctx.fill();

    // Muscle Shading & Specular Contour on Upper Limb
    ctx.fillStyle = 'rgba(2, 6, 23, 0.22)';
    ctx.fillRect(-4.5, 0, 2.5, halfLen);

    // Segment 2: Lower Limb (Forearm & Web Gauntlet / Shin & Boot)
    ctx.save();
    ctx.translate(0, halfLen);
    ctx.rotate(lowerAngle);

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(-4, 0, 8, halfLen, 3);
    ctx.fill();

    if (isArm) {
      // Metallic Web Shooter Wrist Cuff with LED
      ctx.fillStyle = suitId === 'iron_spider' ? '#eab308' : '#e2e8f0';
      ctx.fillRect(-4.5, halfLen - 6, 9, 4);

      // Web Trigger LED Indicator
      const ledColor = suitId === 'iron_spider' ? '#38bdf8' : '#ef4444';
      ctx.fillStyle = ledColor;
      ctx.shadowColor = ledColor;
      ctx.shadowBlur = 6;
      ctx.fillRect(-1.5, halfLen - 5, 3, 2);
      ctx.shadowBlur = 0;

      // Articulated Hand Gesture
      ctx.fillStyle = mainColor;
      ctx.beginPath();
      // Palm
      ctx.roundRect(-3.5, halfLen, 7, 5, 2);
      ctx.fill();

      if (gesture === 'thwip') {
        // Iconic "Thwip!" Sign: Extended Index & Pinky Fingers
        ctx.fillRect(-3.5, halfLen + 4, 2, 4.5); // Index
        ctx.fillRect(1.5, halfLen + 4, 2, 4.5);  // Pinky
      } else if (gesture === 'web_grip') {
        // Grip stance around web line
        ctx.fillStyle = mainColor;
        ctx.fillRect(-4, halfLen + 2, 8, 3.5);
      } else if (gesture === 'open') {
        // Aerodynamic open splayed fingers
        ctx.fillRect(-3.5, halfLen + 4, 2, 4);
        ctx.fillRect(-1, halfLen + 4, 2, 4.5);
        ctx.fillRect(1.5, halfLen + 4, 2, 4);
      } else {
        // Clenched athletic fist
        ctx.beginPath();
        ctx.arc(0, halfLen + 3.5, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Athletic High-Traction Hero Boot Sole
      ctx.fillStyle = '#020617';
      ctx.fillRect(-4.5, halfLen - 2, 9, 3);
    }

    ctx.restore();
    ctx.restore();
  }

  // --- PARTICLES & WEATHER RENDERING ---
  private renderParticlesAndWeather(w: number, h: number) {
    const ctx = this.ctx;

    // Rain Streaks
    if (this.theme === 'thunder_storm') {
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.4)';
      ctx.lineWidth = 1.5;
      this.rainDrops.forEach((r) => {
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - 6, r.y + r.len);
        ctx.stroke();
      });
    }

    // Particles (Sparks, Smoke, Comic Text, Shockwaves)
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'comic_text' && p.text) {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.font = `black ${(p.size || 16) * (p.scale || 1)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.type === 'shockwave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }
}
