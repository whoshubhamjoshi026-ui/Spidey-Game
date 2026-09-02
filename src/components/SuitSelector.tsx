import React from 'react';
import { X, Lock, Check, Shield, Zap } from 'lucide-react';
import { Suit } from '../types';
import { SPIDER_SUITS } from '../utils/suits';

interface SuitSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSuit: Suit;
  onSelectSuit: (suit: Suit) => void;
  highScore: number;
}

export const SuitSelector: React.FC<SuitSelectorProps> = ({
  isOpen,
  onClose,
  selectedSuit,
  onSelectSuit,
  highScore,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-suits-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div
        id="modal-suits-card"
        className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-5 shadow-2xl text-white overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/20 border border-red-500/40 rounded-2xl text-red-400 shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-xl text-white tracking-wide">STARK NANO-ARMORY</h2>
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full font-mono">
                  SUIT PROTOCOL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deploy advanced nanotech suits equipped with combat buffs and special auras.
              </p>
            </div>
          </div>
          <button
            id="btn-close-suits-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suit List */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3.5 custom-scrollbar">
          {SPIDER_SUITS.map((suit) => {
            const isUnlocked = highScore >= suit.unlockedAtScore || suit.unlocked;
            const isSelected = selectedSuit.id === suit.id;

            return (
              <div
                key={suit.id}
                id={`suit-card-${suit.id}`}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectSuit(suit);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 border-red-500 shadow-lg shadow-red-950/40 ring-1 ring-red-500'
                    : isUnlocked
                    ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    : 'bg-slate-950/20 border-slate-900 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Suit Icon & Details */}
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/20 shadow-md relative overflow-hidden shrink-0"
                    style={{ backgroundColor: suit.primaryColor }}
                  >
                    <div
                      className="absolute inset-x-0 bottom-0 h-1/2"
                      style={{ backgroundColor: suit.secondaryColor }}
                    />
                    <div className="z-10 text-white font-black text-lg drop-shadow">🕷️</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-white">{suit.name}</h3>
                      {isSelected && (
                        <span className="text-[9px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">{suit.description}</p>

                    {/* Special Ability & Stats Preview */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-lg text-amber-300 font-mono flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        {suit.specialAbility || 'Acrobatic Mastery'}
                      </span>
                      <span className="text-[10px] text-sky-300 bg-sky-950/40 border border-sky-800/60 px-2 py-0.5 rounded-lg font-mono">
                        Power: {suit.stats?.power ? `${suit.stats.power}/100` : '90/100'}
                      </span>
                      <span className="text-[10px] text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-lg font-mono">
                        Agility: {suit.stats?.speed ? `${suit.stats.speed}/100` : '85/100'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status / Equip CTA */}
                <div className="self-end sm:self-center shrink-0">
                  {isSelected ? (
                    <div className="w-9 h-9 rounded-2xl bg-red-500/20 border border-red-500 text-red-400 flex items-center justify-center shadow-lg">
                      <Check className="w-5 h-5" />
                    </div>
                  ) : isUnlocked ? (
                    <button
                      id={`btn-deploy-${suit.id}`}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-600 text-white text-xs font-bold transition-all shadow cursor-pointer"
                    >
                      Deploy Suit
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl font-mono">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{suit.unlockedAtScore} pts required</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            High Score: <strong className="text-amber-400">{highScore}</strong>
          </div>
          <button
            id="btn-confirm-suit-selection"
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            CONFIRM SELECTION
          </button>
        </div>
      </div>
    </div>
  );
};
