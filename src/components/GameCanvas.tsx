import React, { useEffect, useRef } from 'react';
import { SpiderGameEngine } from '../utils/gameEngine';
import { GameStats, Suit } from '../types';

interface GameCanvasProps {
  selectedSuit: Suit;
  isPlaying: boolean;
  isPaused: boolean;
  onStatsUpdate: (stats: GameStats) => void;
  onGameOver: (stats: GameStats) => void;
  engineRef: React.MutableRefObject<SpiderGameEngine | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  selectedSuit,
  isPlaying,
  isPaused,
  onStatsUpdate,
  onGameOver,
  engineRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    const updateCanvasDimensions = () => {
      // Mobile viewport ke actual boundary ko target karta hai
      const w = window.visualViewport?.width || window.innerWidth || container.clientWidth;
      const h = window.visualViewport?.height || window.innerHeight || container.clientHeight;

      canvas.width = Math.floor(w);
      canvas.height = Math.floor(h);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    };

    updateCanvasDimensions();

    const engine = new SpiderGameEngine({
      canvas,
      selectedSuit,
      onStatsUpdate,
      onGameOver,
    });

    engineRef.current = engine;

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasDimensions();
    });
    resizeObserver.observe(container);

    window.addEventListener('resize', updateCanvasDimensions);
    window.addEventListener('orientationchange', updateCanvasDimensions);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateCanvasDimensions);
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCanvasDimensions);
      window.removeEventListener('orientationchange', updateCanvasDimensions);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateCanvasDimensions);
      }
      engine.stop();
    };
  }, []);

  // Update suit dynamically
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateSuit(selectedSuit);
    }
  }, [selectedSuit]);

  // Start / Pause state handling
  useEffect(() => {
    if (!engineRef.current) return;

    if (isPlaying) {
      if (isPaused) {
        engineRef.current.pause();
      } else {
        if (!engineRef.current.isRunning) {
          engineRef.current.start();
        } else {
          engineRef.current.resume();
        }
      }
    } else {
      engineRef.current.stop();
    }
  }, [isPlaying, isPaused]);

  // Keyboard controls for desktop testing / hybrid controllers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current || !isPlaying || isPaused) return;

      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        e.preventDefault();
        engineRef.current.jump();
      } else if (e.code === 'KeyF' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        engineRef.current.shootWeb();
      } else if (e.code === 'KeyS' || e.code === 'ShiftLeft' || e.code === 'ArrowDown') {
        e.preventDefault();
        engineRef.current.toggleSwing();
      } else if (e.code === 'KeyE' || e.code === 'KeyQ') {
        e.preventDefault();
        engineRef.current.triggerUltimate();
      } else if (e.code === 'KeyC' || e.code === 'KeyX' || e.code === 'KeyZ' || e.code === 'KeyD') {
        e.preventDefault();
        engineRef.current.activateShield();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused]);

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      className="fixed inset-0 select-none overflow-hidden touch-none bg-black"
      style={{
        width: '100vw',
        height: '100dvh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};