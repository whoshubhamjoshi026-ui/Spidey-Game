import React, { useState } from 'react';
import {
  Pause,
  Play,
  Shield,
  Zap,
  Flame,
  Sun,
  Moon,
  CloudLightning,
  Volume2,
  VolumeX,
  Award,
  Crosshair,
  Radio,
  AlertTriangle,
  Map,
  Skull,
  Compass,
  Music,
} from 'lucide-react';
import { GameStats, CityTheme } from '../types';
import { soundFx } from '../utils/audio';

interface HUDProps {
  stats: GameStats;
  isPlaying: boolean;
  isPaused: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onPauseToggle: () => void;
  onStartGame: () => void;
  onOpenSuits: () => void;
  onOpenLevelSelect?: () => void;
  onTriggerUltimate?: () => void;
  onChangeTheme?: (theme: CityTheme) => void;
  onJumpPress?: () => void;
  onShootPress?: () => void;
  onSwingPress?: () => void;
  onShieldPress?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  isPlaying,
  isPaused,
  isMuted = false,
  onToggleMute,
  onPauseToggle,
  onStartGame,
  onOpenSuits,
  onOpenLevelSelect,
  onTriggerUltimate,
  onChangeTheme,
  onJumpPress,
  onShootPress,
  onSwingPress,
  onShieldPress,
}) => {
  const [jumpPressed, setJumpPressed] = useState(false);
  const [swingPressed, setSwingPressed] = useState(false);
  const [shootPressed, setShootPressed] = useState(false);

  // --- AAA CINEMATIC START MENU (STRICT LANDSCAPE NATIVE) ---
  if (!isPlaying) {
    return (
      <div
        id="hud-start-menu"
        className="fixed inset-0 z-30 bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/95 backdrop-blur-lg flex flex-col justify-between p-4 sm:p-6 text-white select-none overflow-hidden"
      >
        {/* Top Stark OS Brand Bar */}
        <header className="w-full flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-950 border border-red-400/80 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center text-2xl">
              🕷️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-lg tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 drop-shadow-sm">
                  MARVEL'S SPIDER-MAN
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-red-600/30 text-red-300 border border-red-500/50 font-bold uppercase tracking-wider">
                  100+ SECTORS
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
                Sector {stats.currentLevel} Ready • Native Mobile Landscape
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-play-spider-theme"
              onClick={() => {
                if (soundFx.isThemePlaying) {
                  soundFx.stopSpiderManThemeSong();
                } else {
                  soundFx.playSpiderManThemeSong();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500/60 text-red-200 transition-all shadow-lg active:scale-95 cursor-pointer text-xs font-bold"
              title="Play Iconic Spider-Man Theme Song"
            >
              <Music className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
              <span className="hidden sm:inline">SPIDER THEME</span>
            </button>

            {onToggleMute && (
              <button
                id="btn-toggle-mute-start"
                onClick={onToggleMute}
                className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-all shadow-lg active:scale-95 cursor-pointer"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            )}
          </div>
        </header>

        {/* Center Mission Hero Banner & Launch Podium */}
        <main className="flex flex-col items-center justify-center max-w-xl mx-auto text-center my-auto px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-[11px] font-bold text-red-300 uppercase tracking-widest mb-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>SECTOR {stats.currentLevel} • OSCORP EMERGENCY DISPATCH</span>
          </div>

          <h1 className="font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight uppercase drop-shadow-[0_4px_30px_rgba(239,68,68,0.7)] leading-none mb-3">
            SPIDER-MAN <span className="text-red-500">2099</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-5 font-medium">
            Swing across skyscrapers with gyroscope tilt physics, foil Green Goblin, Doc Ock, Electro & Venom, trigger Stark Nano-Shields, and unleash the Venom Ultimate Blast!
          </p>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 gap-3 mb-5 w-full max-w-sm">
            <div className="bg-slate-900/90 border border-slate-800/80 p-3 rounded-2xl flex items-center gap-3 shadow-xl">
              <Award className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 font-mono block leading-none">ALL-TIME HIGH</span>
                <span className="font-mono font-black text-base sm:text-lg text-amber-300">{stats.highScore}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 p-3 rounded-2xl flex items-center gap-3 shadow-xl">
              <span className="text-xl">🪙</span>
              <div className="text-left">
                <span className="text-[10px] text-slate-400 font-mono block leading-none">SPIDER TOKENS</span>
                <span className="font-mono font-black text-base sm:text-lg text-yellow-400">{stats.totalCoins}</span>
              </div>
            </div>
          </div>

          {/* Big Launch Mission Button */}
          <button
            id="btn-launch-mission"
            onClick={onStartGame}
            className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-base sm:text-lg tracking-wider shadow-[0_0_35px_rgba(239,68,68,0.6)] border border-red-400/60 transition-all transform hover:scale-102 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>DEPLOY SECTOR {stats.currentLevel}</span>
          </button>
        </main>

        {/* Bottom Fast Action Bar */}
        <footer className="w-full flex items-center justify-between text-xs text-slate-400 pointer-events-auto">
          <div className="flex items-center gap-2">
            {onOpenLevelSelect && (
              <button
                id="btn-open-level-select-start"
                onClick={onOpenLevelSelect}
                className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-bold rounded-xl border border-amber-500/40 flex items-center gap-2 transition-all shadow-lg cursor-pointer active:scale-95"
              >
                <Map className="w-4 h-4 text-amber-400" />
                <span>Campaign Map (100+ Levels)</span>
              </button>
            )}

            <button
              id="btn-open-suits-start"
              onClick={onOpenSuits}
              className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold rounded-xl border border-slate-700/80 flex items-center gap-2 transition-all shadow-lg cursor-pointer active:scale-95"
            >
              <Shield className="w-4 h-4 text-red-400" />
              <span>Suit Armory</span>
            </button>
          </div>

          {/* Gyroscope Status & Controls Hint */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Compass className="w-3.5 h-3.5" />
              <span>GYRO SWING: ACTIVE</span>
            </div>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Jump: [SPACE]</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Swing: [S]</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Thwip Web: [F / ENTER]</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Venom Nuke: [E]</span>
          </div>
        </footer>
      </div>
    );
  }

  // --- AAA CONSOLE-GRADE IN-GAME HUD ---
  return (
    <div
      id="hud-in-game"
      className="fixed inset-0 p-3 sm:p-4 z-20 pointer-events-none flex flex-col justify-between overflow-hidden select-none"
    >
      {/* 0. DANGER / BOSS COMBAT EDGE HAZARD FLASH */}
      {stats.warningEdgeActive && (
        <div className="fixed inset-0 pointer-events-none z-30 border-4 sm:border-8 border-red-500/80 shadow-[inset_0_0_60px_rgba(239,68,68,0.85)] animate-pulse flex items-center justify-center">
          <div className="bg-red-600/95 text-white font-black px-5 py-2 rounded-2xl text-xs sm:text-sm tracking-widest uppercase border border-red-300 shadow-2xl animate-bounce flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-300 animate-spin" />
            <span>⚠️ COMBAT ENCOUNTER HAZARD DETECTED! ⚠️</span>
          </div>
        </div>
      )}

      {/* 1. FUTURISTIC GLOWING HEX-FORCEFIELD SHIELD BORDER */}
      {stats.shieldActive && (
        <div
          id="hud-shield-border-overlay"
          className="absolute inset-0 border-4 border-sky-400/80 shadow-[inset_0_0_40px_rgba(56,189,248,0.4)] pointer-events-none animate-pulse"
        >
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-sky-500/30 backdrop-blur-md px-4 py-1 rounded-full border border-sky-400/80 text-sky-200 text-xs font-black font-mono tracking-widest uppercase flex items-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.5)]">
            <Shield className="w-4 h-4 text-sky-300" />
            <span>NANO-SHIELD FORCEFIELD ONLINE (1 IMPACT SHIELDED)</span>
          </div>
        </div>
      )}

      {/* 2. DIRECTIONAL INCOMING BOSS & THREAT INDICATORS ON RIGHT EDGE */}
      {stats.incomingThreats && stats.incomingThreats.length > 0 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none z-30">
          {stats.incomingThreats.map((threat) => (
            <div
              key={threat.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-md border shadow-2xl animate-bounce ${
                threat.isBoss
                  ? 'bg-red-950/90 border-red-500/90 text-red-200 shadow-[0_0_25px_rgba(239,68,68,0.6)]'
                  : 'bg-amber-950/80 border-amber-500/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-red-400 animate-spin" />
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold block uppercase tracking-wider">
                  ⚠️ {threat.name}
                </span>
                <span className="text-xs font-mono font-black text-amber-300">
                  DISTANCE: {threat.distance}m ➔
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. TOP HOLOGRAPHIC NAVIGATION CLUSTER & LEVEL PROGRESSION */}
      <header className="flex items-start justify-between gap-2">
        {/* Left Stats Cluster & Active Power-Up Timers */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {/* Holographic Score Pod */}
            <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center gap-2.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                SCORE
              </span>
              <span className="font-black text-xl sm:text-2xl text-white font-mono tracking-tight">
                {stats.score}
              </span>
            </div>

            {/* Tokens Pod */}
            <div className="bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center gap-1.5">
              <span className="text-base">🪙</span>
              <span className="font-black text-sm sm:text-base text-yellow-400 font-mono">
                {stats.coinsCollected}
              </span>
            </div>

            {/* Dynamic Combo & Multiplier Heat Meter */}
            {stats.combo > 1 && (
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-300/80 shadow-[0_0_25px_rgba(239,68,68,0.7)] flex items-center gap-1.5 animate-pulse">
                <Flame className="w-4 h-4 text-yellow-200 fill-current" />
                <span className="font-black text-xs sm:text-sm text-white tracking-wider">
                  x{stats.combo} STREAK!
                </span>
              </div>
            )}

            {/* Gyroscope Real-Time Tilt Indicator Meter */}
            <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/80 flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">TILT:</span>
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                <div
                  className="w-2.5 h-full bg-sky-400 rounded-full absolute top-0 transition-all duration-75"
                  style={{
                    left: `${Math.max(0, Math.min(100, (0.5 + (stats.gyroTilt || 0) * 0.5) * 100 - 10))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Spider-Man Suit Vitality / HP Bar */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/80 shadow-lg flex items-center gap-2.5">
              <span className="text-xs font-black text-red-500">❤️</span>
              <div className="flex flex-col">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold gap-3">
                  <span className="text-slate-300 tracking-wider">SPIDER-MAN</span>
                  <span className="text-emerald-400 font-black">
                    {stats.playerHp !== undefined ? stats.playerHp : 100} / {stats.maxPlayerHp || 100} HP
                  </span>
                </div>
                <div className="w-28 sm:w-36 h-2 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700 mt-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 via-amber-400 to-emerald-400 transition-all duration-200"
                    style={{
                      width: `${Math.max(0, Math.min(100, ((stats.playerHp !== undefined ? stats.playerHp : 100) / (stats.maxPlayerHp || 100)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
              {stats.shieldActive && (
                <span className="bg-sky-500/30 text-sky-300 text-[9px] px-1.5 py-0.5 rounded font-mono font-black border border-sky-400 animate-pulse">
                  SHIELD
                </span>
              )}
            </div>
          </div>

          {/* Active Power-Up Timers (Magnet Rush, 2X Multiplier, Web Wings) */}
          <div className="flex items-center gap-2">
            {stats.magnetActive && (
              <div className="bg-yellow-500/25 backdrop-blur-md px-3 py-1 rounded-xl border border-yellow-400/90 text-[11px] font-black text-yellow-200 flex items-center gap-1.5 shadow-[0_0_15px_rgba(234,179,8,0.4)] animate-pulse">
                <span>🧲 COIN MAGNET ({stats.magnetTimeRemaining || 0}s)</span>
              </div>
            )}

            {stats.doubleScoreActive && (
              <div className="bg-emerald-500/25 backdrop-blur-md px-3 py-1 rounded-xl border border-emerald-400/90 text-[11px] font-black text-emerald-200 flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.4)] animate-pulse">
                <span>⭐ 2X MULTIPLIER ({stats.doubleScoreTimeRemaining || 0}s)</span>
              </div>
            )}

            {stats.webWingsActive && (
              <div className="bg-pink-500/25 backdrop-blur-md px-3 py-1 rounded-xl border border-pink-400/90 text-[11px] font-black text-pink-200 flex items-center gap-1.5 shadow-[0_0_15px_rgba(236,72,153,0.4)] animate-pulse">
                <span>🦅 WEB WINGS ({stats.webWingsTimeRemaining || 0}s)</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Dedicated Boss Health Bar or Level Progress Ribbon */}
        <div className="flex flex-col items-center gap-1.5 max-w-sm sm:max-w-md w-full px-2">
          {stats.activeBoss ? (
            /* Boss Encounter HP Bar */
            <div className="w-full bg-slate-950/95 backdrop-blur-md p-2 rounded-2xl border-2 border-red-500/90 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-red-200 mb-1 px-1">
                <span className="flex items-center gap-1 text-red-400 font-black">
                  <Skull className="w-4 h-4 text-red-500 animate-spin" /> {stats.activeBoss.name}
                </span>
                <span className="text-amber-300">
                  {stats.activeBoss.hp} / {stats.activeBoss.maxHp} HP
                </span>
              </div>
              <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-red-900/80 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.max(0, (stats.activeBoss.hp / stats.activeBoss.maxHp) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            /* Level Progress Bar */
            <div className="w-full bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/80 shadow-xl">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-300 mb-1">
                <span className="text-sky-300">SECTOR {stats.currentLevel}</span>
                <span className="text-amber-400">{Math.floor(stats.levelProgress)}% REACHED</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${stats.levelProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Active Alert Ribbon */}
          {stats.activeAlert && (
            <div
              className="px-4 py-1.5 rounded-2xl backdrop-blur-lg border shadow-2xl flex items-center gap-2 mt-1 animate-bounce"
              style={{
                backgroundColor: `${stats.activeAlert.color}22`,
                borderColor: `${stats.activeAlert.color}99`,
                boxShadow: `0 0 25px ${stats.activeAlert.color}66`,
              }}
            >
              <span className="text-lg">{stats.activeAlert.icon}</span>
              <span
                className="font-black text-xs block tracking-wide uppercase leading-tight"
                style={{ color: stats.activeAlert.color }}
              >
                {stats.activeAlert.title}
              </span>
            </div>
          )}
        </div>

        {/* Right Settings & Controls Cluster */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Atmosphere Theme Switcher */}
          {onChangeTheme && (
            <div className="bg-slate-950/85 backdrop-blur-md p-1 rounded-2xl border border-slate-800 flex items-center gap-1 shadow-lg">
              <button
                id="btn-theme-night"
                onClick={() => onChangeTheme('neon_night')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  stats.theme === 'neon_night' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Neon Cyber Night"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-theme-sunset"
                onClick={() => onChangeTheme('sunset_rooftop')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  stats.theme === 'sunset_rooftop' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Sunset Rooftop"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-theme-storm"
                onClick={() => onChangeTheme('thunder_storm')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  stats.theme === 'thunder_storm' ? 'bg-slate-700 text-sky-300 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Thunder Tempest"
              >
                <CloudLightning className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Sound Toggle */}
          {onToggleMute && (
            <button
              id="btn-toggle-mute-ingame"
              onClick={onToggleMute}
              className="p-2.5 rounded-2xl bg-slate-950/85 hover:bg-slate-900 text-white border border-slate-700/80 backdrop-blur-md shadow-xl transition-all active:scale-90 cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          )}

          {/* Pause Button */}
          <button
            id="btn-pause-toggle"
            onClick={onPauseToggle}
            className="p-2.5 rounded-2xl bg-slate-950/85 hover:bg-slate-900 text-white border border-slate-700/80 backdrop-blur-md shadow-xl transition-all active:scale-90 cursor-pointer"
            title={isPaused ? 'Resume Mission' : 'Pause Mission'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400 fill-current" /> : <Pause className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </header>

      {/* 4. BOTTOM HUD: ADVANCED DUAL-THUMB TOUCH CONTROLS & VENOM ULTIMATE GAUGE */}
      <footer className="flex items-end justify-between gap-4 pointer-events-auto">
        {/* Left Thumb Virtual Touch Controls (JUMP & SWING) */}
        <div className="flex items-center gap-3">
          {/* Big Jump / Double Somersault Button */}
          <button
            id="btn-touch-jump"
            onClick={onJumpPress}
            onTouchStart={(e) => {
              e.preventDefault();
              setJumpPressed(true);
              onJumpPress?.();
            }}
            onTouchEnd={() => setJumpPressed(false)}
            onMouseDown={() => setJumpPressed(true)}
            onMouseUp={() => setJumpPressed(false)}
            className={`w-18 h-18 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-sky-500/90 to-blue-700/90 border-2 border-sky-300/90 shadow-[0_0_25px_rgba(56,189,248,0.5)] flex flex-col items-center justify-center text-white transition-all select-none backdrop-blur-md cursor-pointer ${
              jumpPressed ? 'scale-90 bg-sky-400 shadow-[0_0_35px_rgba(56,189,248,0.8)]' : ''
            }`}
          >
            <span className="text-2xl sm:text-3xl">⚡</span>
            <span className="font-black text-[11px] sm:text-xs tracking-wider">JUMP</span>
          </button>

          {/* Skyscraper Web Swing Button */}
          <button
            id="btn-touch-swing"
            onClick={onSwingPress}
            onTouchStart={(e) => {
              e.preventDefault();
              setSwingPressed(true);
              onSwingPress?.();
            }}
            onTouchEnd={() => setSwingPressed(false)}
            onMouseDown={() => setSwingPressed(true)}
            onMouseUp={() => setSwingPressed(false)}
            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-600/90 shadow-xl flex flex-col items-center justify-center text-slate-200 transition-all select-none backdrop-blur-md cursor-pointer ${
              swingPressed ? 'scale-90 bg-slate-700 border-sky-400' : ''
            }`}
          >
            <span className="text-xl">🏙️</span>
            <span className="font-black text-[9px] tracking-wider text-slate-300">SWING</span>
          </button>
        </div>

        {/* Center: Distance Telemetry & Ultimate Venom Gauge */}
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          {/* Pulsating Holographic Venom Blast Trigger */}
          {onTriggerUltimate && (
            <div className="pointer-events-auto">
              {stats.ultimateCharge >= 100 ? (
                <button
                  id="btn-trigger-ultimate-ready"
                  onClick={onTriggerUltimate}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    onTriggerUltimate();
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white font-black text-xs sm:text-sm tracking-wider shadow-[0_0_35px_rgba(245,158,11,0.9)] border-2 border-yellow-300 animate-bounce active:scale-90 flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-5 h-5 fill-current text-yellow-200 animate-spin" />
                  <span>⚡ DETONATE VENOM NUKE ⚡</span>
                </button>
              ) : (
                <div className="bg-slate-950/90 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-slate-700/80 flex items-center gap-2.5 shadow-xl">
                  <span className="text-[10px] font-mono text-amber-400 font-black">ULTIMATE</span>
                  <div className="w-24 sm:w-36 h-2.5 rounded-full bg-slate-800/90 overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-400 transition-all duration-300"
                      style={{ width: `${stats.ultimateCharge}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-amber-400 font-mono font-black">
                    {Math.floor(stats.ultimateCharge)}%
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-950/85 backdrop-blur-md px-3.5 py-1 rounded-xl border border-slate-800 text-[10px] text-slate-300 font-mono font-bold">
            DISTANCE: {stats.distance}m • SPEED: {stats.speed} km/h
          </div>
        </div>

        {/* Right Thumb Virtual Touch Controls (RAPID WEB SHOOTER & NANO-SHIELD) */}
        <div className="flex items-center gap-2.5">
          {/* Nano-Shield Touch Button */}
          {onShieldPress && (
            <button
              id="btn-touch-shield"
              onClick={onShieldPress}
              onTouchStart={(e) => {
                e.preventDefault();
                onShieldPress?.();
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-sky-600/90 to-cyan-800/90 border border-cyan-300/80 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex flex-col items-center justify-center text-white transition-all select-none backdrop-blur-md cursor-pointer active:scale-90"
              title="Activate Stark Nano-Shield [D]"
            >
              <Shield className="w-5 h-5 text-cyan-200" />
              <span className="font-black text-[9px] tracking-wider text-cyan-100 mt-0.5">SHIELD</span>
            </button>
          )}

          {/* Big Thwip Web Shooter Button */}
          <button
            id="btn-touch-shoot"
            onClick={onShootPress}
            onTouchStart={(e) => {
              e.preventDefault();
              setShootPressed(true);
              onShootPress?.();
            }}
            onTouchEnd={() => setShootPressed(false)}
            onMouseDown={() => setShootPressed(true)}
            onMouseUp={() => setShootPressed(false)}
            className={`w-18 h-18 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-red-600 via-rose-600 to-red-800 border-2 border-red-300/90 shadow-[0_0_30px_rgba(239,68,68,0.6)] flex flex-col items-center justify-center text-white transition-all select-none backdrop-blur-md cursor-pointer ${
              shootPressed ? 'scale-90 bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.9)]' : ''
            }`}
          >
            <Crosshair className="w-7 h-7 text-white" />
            <span className="font-black text-[11px] sm:text-xs tracking-wider mt-0.5">THWIP</span>
          </button>
        </div>
      </footer>

      {/* 4.5 LEVEL 1 TRAINING OVERLAY HELPER */}
      {stats.currentLevel === 1 && stats.distance < 110 && isPlaying && !isPaused && (
        <div
          id="hud-level1-tutorial"
          className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-slate-950/90 backdrop-blur-md px-5 py-2 rounded-2xl border border-sky-400/80 text-sky-200 text-xs font-mono font-bold shadow-2xl flex items-center gap-2.5 animate-pulse"
        >
          <span className="text-base">🎮</span>
          <span className="text-slate-300">
            Sector 1 Patrol: <strong className="text-white">Tilt phone</strong> to steer • Tap{' '}
            <strong className="text-sky-300">JUMP</strong> to leap • Tap{' '}
            <strong className="text-red-400">THWIP</strong> to shoot webs!
          </span>
        </div>
      )}

      {/* 5. SUSPENDED MISSION PAUSE MENU OVERLAY */}
      {isPaused && (
        <div
          id="hud-pause-overlay"
          className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white pointer-events-auto"
        >
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-xs w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto text-2xl">
              ⏸️
            </div>
            <div>
              <h3 className="font-black text-xl text-white">Mission Suspended</h3>
              <p className="text-xs text-slate-400 mt-1">Sector {stats.currentLevel} in progress.</p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                id="btn-resume-mission"
                onClick={onPauseToggle}
                className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-950/60 transition-all cursor-pointer"
              >
                RESUME MISSION
              </button>
              {onOpenLevelSelect && (
                <button
                  id="btn-pause-campaign-map"
                  onClick={onOpenLevelSelect}
                  className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  Campaign Map (100+ Levels)
                </button>
              )}
              <button
                id="btn-pause-theme-toggle"
                onClick={() => {
                  if (soundFx.isThemePlaying) {
                    soundFx.stopSpiderManThemeSong();
                  } else {
                    soundFx.playSpiderManThemeSong();
                  }
                }}
                className="w-full py-2.5 rounded-2xl bg-red-950/60 hover:bg-red-900/80 text-red-200 text-xs font-semibold border border-red-800/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Music className="w-3.5 h-3.5 text-amber-300" />
                <span>Spider-Man Theme Song</span>
              </button>
              <button
                id="btn-pause-armory"
                onClick={onOpenSuits}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                Suit Armory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
