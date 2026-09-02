import React, { useState, useRef, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { GameOverModal } from './components/GameOverModal';
import { SuitSelector } from './components/SuitSelector';
import { LevelSelectModal } from './components/LevelSelectModal';
import { SpiderGameEngine } from './utils/gameEngine';
import { SPIDER_SUITS } from './utils/suits';
import { GameStats, Suit, CityTheme } from './types';
import { soundFx } from './utils/audio';
import { Smartphone } from 'lucide-react';

export default function App() {
  const [selectedSuit, setSelectedSuit] = useState<Suit>(SPIDER_SUITS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  // Level Progression System (100+ Levels)
  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    return parseInt(localStorage.getItem('spidey_saved_level') || '1', 10);
  });
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => {
    return Math.max(
      parseInt(localStorage.getItem('spidey_saved_level') || '1', 10),
      parseInt(localStorage.getItem('spidey_max_unlocked_level') || '1', 10)
    );
  });

  // Modals
  const [isSuitsOpen, setIsSuitsOpen] = useState<boolean>(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);

  // Stats
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: parseInt(localStorage.getItem('spidey_high_score') || '0', 10),
    villainsDefeated: 0,
    coinsCollected: 0,
    totalCoins: parseInt(localStorage.getItem('spidey_total_coins') || '0', 10),
    distance: 0,
    speed: 3.4,
    combo: 0,
    maxCombo: 0,
    ultimateCharge: 40,
    shieldActive: false,
    magnetActive: false,
    theme: 'sunset_rooftop',
    currentLevel: currentLevel,
    levelProgress: 0,
    playerHp: 100,
    maxPlayerHp: 100,
    isCombatMode: false,
    warningEdgeActive: false,
    activeBoss: null,
    gyroTilt: 0,
    isGyroActive: false,
  });

  const engineRef = useRef<SpiderGameEngine | null>(null);

  // Check device orientation for landscape enforcement
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        setIsPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 768);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleStartGame = () => {
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
  };

  const handlePauseToggle = () => {
    setIsPaused((prev) => !prev);
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundFx.setMuted(newMuted);
  };

  const handleGameOver = (finalStats: GameStats) => {
    setStats(finalStats);
    setIsPlaying(false);
    setIsGameOver(true);
  };

  const handleStatsUpdate = (newStats: GameStats) => {
    setStats(newStats);
    if (newStats.currentLevel !== currentLevel) {
      setCurrentLevel(newStats.currentLevel);
      if (newStats.currentLevel > maxUnlockedLevel) {
        setMaxUnlockedLevel(newStats.currentLevel);
        localStorage.setItem('spidey_max_unlocked_level', newStats.currentLevel.toString());
      }
    }
  };

  const handleSelectLevel = (levelNum: number) => {
    setCurrentLevel(levelNum);
    localStorage.setItem('spidey_saved_level', levelNum.toString());
    if (engineRef.current) {
      engineRef.current.setLevel(levelNum);
    }
  };

  const handleTriggerUltimate = () => {
    if (engineRef.current && isPlaying && !isPaused) {
      engineRef.current.triggerUltimate();
    }
  };

  const handleChangeTheme = (theme: CityTheme) => {
    if (engineRef.current) {
      engineRef.current.setTheme(theme);
    }
  };

  // Controller Actions
  const handleJumpPress = () => {
    if (engineRef.current && isPlaying && !isPaused) {
      engineRef.current.jump();
    }
  };

  const handleShootPress = () => {
    if (engineRef.current && isPlaying && !isPaused) {
      engineRef.current.shootWeb();
    }
  };

  const handleSwingPress = () => {
    if (engineRef.current && isPlaying && !isPaused) {
      engineRef.current.toggleSwing();
    }
  };

  const handleShieldPress = () => {
    if (engineRef.current && isPlaying && !isPaused) {
      engineRef.current.activateShield();
    }
  };

  return (
    <main className="fixed inset-0 w-screen h-screen overflow-hidden bg-black select-none touch-none font-sans">
      {/* Fullscreen Edge-to-Edge Game Canvas */}
      <GameCanvas
        selectedSuit={selectedSuit}
        isPlaying={isPlaying}
        isPaused={isPaused}
        onStatsUpdate={handleStatsUpdate}
        onGameOver={handleGameOver}
        engineRef={engineRef}
      />

      {/* Console-Grade Landscape HUD & Start Menu */}
      <HUD
        stats={stats}
        isPlaying={isPlaying}
        isPaused={isPaused}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onPauseToggle={handlePauseToggle}
        onStartGame={handleStartGame}
        onOpenSuits={() => setIsSuitsOpen(true)}
        onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
        onTriggerUltimate={handleTriggerUltimate}
        onChangeTheme={handleChangeTheme}
        onJumpPress={handleJumpPress}
        onShootPress={handleShootPress}
        onSwingPress={handleSwingPress}
        onShieldPress={handleShieldPress}
      />

      {/* Game Over Screen */}
      <GameOverModal
        isOpen={isGameOver}
        stats={stats}
        onRestart={handleStartGame}
        onOpenLevelSelect={() => {
          setIsGameOver(false);
          setIsLevelSelectOpen(true);
        }}
        onOpenSuits={() => {
          setIsGameOver(false);
          setIsSuitsOpen(true);
        }}
      />

      {/* Campaign Map (100+ Levels) Modal */}
      {isLevelSelectOpen && (
        <LevelSelectModal
          currentLevel={currentLevel}
          maxUnlockedLevel={maxUnlockedLevel}
          totalCoins={stats.totalCoins}
          onSelectLevel={handleSelectLevel}
          onClose={() => setIsLevelSelectOpen(false)}
        />
      )}

      {/* Wardrobe Modal */}
      <SuitSelector
        isOpen={isSuitsOpen}
        onClose={() => setIsSuitsOpen(false)}
        selectedSuit={selectedSuit}
        onSelectSuit={(suit) => {
          setSelectedSuit(suit);
          setIsSuitsOpen(false);
        }}
        highScore={stats.highScore}
      />

      {/* Landscape Rotation Overlay (if portrait mobile) */}
      {isPortrait && (
        <aside
          aria-label="Rotate device suggestion"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-red-600 to-amber-600 text-white px-4 py-2 rounded-full border border-amber-300 shadow-2xl flex items-center gap-2 text-xs font-bold pointer-events-none animate-pulse"
        >
          <Smartphone className="w-4 h-4 rotate-90" />
          <span>Rotate phone to Landscape mode for full screen gameplay! 📱</span>
        </aside>
      )}
    </main>
  );
}
