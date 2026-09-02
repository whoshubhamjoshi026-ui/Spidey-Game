import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Award, Map, Shield } from 'lucide-react';
import { GameStats } from '../types';

interface GameOverModalProps {
  isOpen: boolean;
  stats: GameStats;
  onRestart: () => void;
  onOpenLevelSelect?: () => void;
  onOpenSuits?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  stats,
  onRestart,
  onOpenLevelSelect,
  onOpenSuits,
}) => {
  useEffect(() => {
    if (isOpen && stats.score > 0 && stats.score >= stats.highScore) {
      // Trigger celebration confetti for high score
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
      });
    }
  }, [isOpen, stats]);

  if (!isOpen) return null;

  const isNewHighScore = stats.score > 0 && stats.score >= stats.highScore;

  // Calculate Superhero Combat Rank
  let rankBadge = 'C-RANK ROOKIE';
  let rankColor = 'text-slate-300 border-slate-600 bg-slate-800';
  let bugleHeadline = 'WEB-SLINGER RETREATS FROM OSCORP PATROLS!';

  if (stats.score >= 500) {
    rankBadge = 'S-RANK SUPREME AVENGER';
    rankColor = 'text-amber-300 border-amber-400/80 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20';
    bugleHeadline = 'DAILY BUGLE: SPIDER-MAN LIBERATES MANHATTAN!';
  } else if (stats.score >= 250) {
    rankBadge = 'A-RANK AMAZING HERO';
    rankColor = 'text-red-300 border-red-400/80 bg-red-500/20';
    bugleHeadline = 'DAILY BUGLE: GREEN GOBLIN SQUAD DECIMATED!';
  } else if (stats.score >= 100) {
    rankBadge = 'B-RANK VIGILANTE';
    rankColor = 'text-sky-300 border-sky-400/80 bg-sky-500/20';
    bugleHeadline = 'DAILY BUGLE: HERO DISRUPTS SHADOW DRONES!';
  }

  return (
    <div
      id="modal-gameover-backdrop"
      className="fixed inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="modal-gameover-card"
        className="w-full max-w-sm max-h-[95vh] overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-2xl text-center text-white space-y-3.5 animate-in fade-in zoom-in duration-200"
      >
        {/* Daily Bugle Banner Header */}
        <div className="bg-amber-400 text-black px-3 py-1 rounded-xl font-serif text-[10px] font-black tracking-widest uppercase shadow-md flex items-center justify-between">
          <span>THE DAILY BUGLE</span>
          <span>SPECIAL EDITION</span>
        </div>

        {/* Headline */}
        <div>
          <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-tight">
            {bugleHeadline}
          </h3>
          {/* Superhero Rank Stamp */}
          <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black tracking-wider uppercase shadow-lg ${rankColor}`}>
            <Award className="w-4 h-4 text-amber-400" />
            <span>{rankBadge}</span>
          </div>
        </div>

        {/* High Score Celebration Badge */}
        {isNewHighScore && (
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 rounded-2xl p-2 flex items-center justify-center gap-2 text-xs text-amber-300 font-bold animate-pulse">
            <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>NEW MANHATTAN HIGH SCORE!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-left">
          <div className="bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800">
            <span className="text-[9px] text-slate-400 font-mono block">FINAL SCORE</span>
            <p className="text-lg font-black text-white font-mono mt-0.5">{stats.score}</p>
          </div>

          <div className="bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800">
            <span className="text-[9px] text-slate-400 font-mono block">BEST RECORD</span>
            <p className="text-lg font-black text-amber-400 font-mono mt-0.5">{stats.highScore}</p>
          </div>

          <div className="bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800">
            <span className="text-[9px] text-slate-400 font-mono block">VILLAINS FOILED</span>
            <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
              {stats.villainsDefeated} 💥
            </p>
          </div>

          <div className="bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800">
            <span className="text-[9px] text-slate-400 font-mono block">COINS LOOTED</span>
            <p className="text-sm font-bold text-yellow-400 font-mono mt-0.5">
              +{stats.coinsCollected} 🪙
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            id="btn-restart-gameover"
            onClick={onRestart}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm shadow-xl shadow-red-950/60 border border-red-400/30 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RELAUNCH MISSION (SECTOR {stats.currentLevel})</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {onOpenLevelSelect && (
              <button
                id="btn-open-level-select-gameover"
                onClick={onOpenLevelSelect}
                className="py-2.5 px-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold border border-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Map className="w-3.5 h-3.5 text-amber-400" />
                <span>Sector Map</span>
              </button>
            )}

            {onOpenSuits && (
              <button
                id="btn-open-suits-gameover"
                onClick={onOpenSuits}
                className="py-2.5 px-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span>Suit Armory</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
