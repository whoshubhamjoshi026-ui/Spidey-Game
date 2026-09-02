import React, { useState } from 'react';
import { X, Trophy, Lock, Play, Shield, Skull } from 'lucide-react';
import { CHAPTERS, getLevelConfig } from '../utils/levels';

interface LevelSelectModalProps {
  currentLevel: number;
  maxUnlockedLevel: number;
  totalCoins: number;
  onSelectLevel: (level: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  currentLevel,
  maxUnlockedLevel,
  totalCoins,
  onSelectLevel,
  onClose,
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<number>(() => {
    return Math.floor((currentLevel - 1) / 20) + 1;
  });

  const activeChapter = CHAPTERS.find((c) => c.id === selectedChapterId) || CHAPTERS[0];
  const startLevelNum = (activeChapter.id - 1) * 20 + 1;
  const levelsInChapter = Array.from({ length: 20 }, (_, i) => startLevelNum + i);

  return (
    <div
      id="level-select-modal"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 text-white select-none animate-fadeIn"
    >
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-xl">
              🗺️
            </div>
            <div>
              <h2 className="font-black text-base sm:text-xl tracking-wide uppercase flex items-center gap-2">
                MISSION CAMPAIGN <span className="text-xs text-amber-400 font-mono">100+ SECTORS</span>
              </h2>
              <p className="text-xs text-slate-400">
                Select any unlocked patrol sector or boss battle to deploy Spider-Man.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-yellow-400 font-mono font-bold flex items-center gap-1.5">
              <span>🪙</span>
              <span>{totalCoins}</span>
            </div>

            <button
              id="btn-close-level-select"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chapter Tabs */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-950/40 border-b border-slate-800 overflow-x-auto">
          {CHAPTERS.map((ch) => {
            const isSelected = ch.id === selectedChapterId;
            const chStartLevel = (ch.id - 1) * 20 + 1;
            const isUnlocked = maxUnlockedLevel >= chStartLevel;

            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChapterId(ch.id)}
                className={`px-4 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-950/60'
                    : isUnlocked
                    ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800 opacity-60'
                }`}
              >
                <span>{ch.id === 1 ? '🏙️' : ch.id === 2 ? '🏢' : ch.id === 3 ? '⚡' : ch.id === 4 ? '🌩️' : '🕷️'}</span>
                <span>Ch. {ch.id}: {ch.name.split(':')[1]?.trim() || ch.name}</span>
                {!isUnlocked && <Lock className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>

        {/* Level Grid */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-slate-200">{activeChapter.name}</h3>
            <p className="text-xs text-slate-400">{activeChapter.subtitle} • Final Boss: <strong className="text-red-400">{activeChapter.bossName}</strong></p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {levelsInChapter.map((lvlNum) => {
              const cfg = getLevelConfig(lvlNum);
              const isUnlocked = lvlNum <= maxUnlockedLevel;
              const isCurrent = lvlNum === currentLevel;
              const isBoss = !!cfg.boss;

              return (
                <button
                  key={lvlNum}
                  disabled={!isUnlocked}
                  onClick={() => {
                    if (isUnlocked) {
                      onSelectLevel(lvlNum);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer relative overflow-hidden ${
                    isCurrent
                      ? 'bg-gradient-to-b from-red-600/30 to-red-950/80 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                      : isUnlocked
                      ? isBoss
                        ? 'bg-gradient-to-b from-amber-600/20 to-amber-950/60 border-amber-500/60 hover:border-amber-400 shadow-md'
                        : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-700 hover:border-slate-500'
                      : 'bg-slate-900/40 border-slate-800/60 opacity-40 cursor-not-allowed'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="font-bold">LVL {lvlNum}</span>
                    {isBoss ? (
                      <span className="text-red-400 font-bold flex items-center gap-0.5">
                        <Skull className="w-3 h-3" /> BOSS
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold">+{cfg.rewardCoins}🪙</span>
                    )}
                  </div>

                  {/* Icon */}
                  <div className="my-2 text-2xl sm:text-3xl">
                    {isUnlocked ? (
                      isBoss ? (
                        '💀'
                      ) : (
                        '🏙️'
                      )
                    ) : (
                      <Lock className="w-6 h-6 text-slate-600 mx-auto" />
                    )}
                  </div>

                  {/* Level Name */}
                  <span className="text-[11px] font-bold text-slate-200 line-clamp-1">
                    {cfg.name.split(':')[1]?.trim() || `Stage ${lvlNum}`}
                  </span>

                  {/* Target Distance */}
                  <span className="text-[10px] font-mono text-slate-400 mt-1">
                    {cfg.targetDistance}m
                  </span>

                  {/* Current Active Indicator */}
                  {isCurrent && (
                    <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Max Unlocked Level: <strong className="text-amber-300 font-mono">Level {maxUnlockedLevel}</strong> / 100</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
          >
            Close Map
          </button>
        </footer>
      </div>
    </div>
  );
};
