import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ColorFloodPuzzle } from "../types";
import { soundEffects } from "../utils/audio";
import { Box, Cpu } from "lucide-react";

interface ColorFloodGameProps {
  puzzle: ColorFloodPuzzle & { difficulty: number };
  onComplete: (xpEarned: number) => void;
  onExit: () => void;
}

export default function ColorFloodGame({ puzzle, onComplete, onExit }: ColorFloodGameProps) {
  const [grid, setGrid] = useState<string[][]>(puzzle.initialGrid || []);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);

  useEffect(() => {
    // Check win condition
    if (grid.length === 0) return;
    const firstColor = grid[0][0];
    const hasWon = grid.every(row => row.every(cell => cell === firstColor));
    
    if (hasWon) {
      setVictory(true);
      setGameOver(true);
      soundEffects.playSuccess();
    } else if (moves >= puzzle.maxMoves) {
      setGameOver(true);
      soundEffects.playError();
    }
  }, [grid, moves]);

  const selectColor = (newColor: string) => {
    if (gameOver) return;
    const oldColor = grid[0][0];
    if (oldColor === newColor) return;
    
    soundEffects.playSlide();

    const newGrid = grid.map(row => [...row]);
    const visited = Array(puzzle.gridSize).fill(0).map(() => Array(puzzle.gridSize).fill(false));
    
    const flood = (r: number, c: number) => {
      if (r < 0 || r >= puzzle.gridSize || c < 0 || c >= puzzle.gridSize) return;
      if (visited[r][c]) return;
      if (newGrid[r][c] !== oldColor) return;

      visited[r][c] = true;
      newGrid[r][c] = newColor;

      flood(r - 1, c);
      flood(r + 1, c);
      flood(r, c - 1);
      flood(r, c + 1);
    };

    flood(0, 0);
    setGrid(newGrid);
    setMoves(moves + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center text-sm font-mono border-b border-white/10 pb-4">
        <span className="text-cyan-400 font-bold bg-cyan-900/40 px-2 py-0.5 rounded border border-cyan-500/20">VIRAL_FLOOD // SECTOR_OVERWRITE</span>
        <button onClick={onExit} className="text-slate-500 hover:text-slate-300">DISCONNECT</button>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex justify-between w-full max-w-sm text-slate-300 font-mono tracking-widest text-xs">
          <span>CYCLES: {moves}/{puzzle.maxMoves}</span>
        </div>

        <div 
          className="grid gap-[1px] p-2 bg-slate-800 rounded-lg shadow-lg border border-white/5 mx-auto"
          style={{ gridTemplateColumns: `repeat(${puzzle.gridSize}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) => 
            row.map((color, c) => (
              <motion.div 
                key={`${r}-${c}`}
                className="w-6 h-6 sm:w-8 sm:h-8"
                initial={false}
                animate={{ backgroundColor: color }}
                transition={{ duration: 0.15 + (r+c)*0.01 }}
              />
            ))
          )}
        </div>

        {!gameOver && (
          <div className="flex gap-4 p-4 rounded-xl bg-[#15171C] border border-white/5 mt-2">
            {puzzle.availableColors.map(color => (
              <button
                key={color}
                onClick={() => selectColor(color)}
                className="w-10 h-10 rounded shadow-md border border-white/20 hover:scale-110 active:scale-95 transition-all"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-4 text-center ${victory ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-red-500/50 bg-red-950/20'}`}
          >
            {victory ? <Cpu className="w-10 h-10 text-cyan-400" /> : <Box className="w-10 h-10 text-red-500" />}
            <h3 className={`text-xl font-display font-light ${victory ? 'text-cyan-400' : 'text-red-500'}`}>
              {victory ? 'SECTOR ANOMALY PURGED' : 'INFECTION_CONTAINMENT_FAILED'}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {victory ? `System completely overwritten in ${moves} cycles.` : 'Grid integrity lost. Limit exceeded.'}
            </p>
            {victory && (
              <button
                onClick={() => onComplete(70 + (puzzle.difficulty * 10))}
                className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg mt-2 tracking-widest text-xs uppercase"
              >
                Accept {70 + (puzzle.difficulty * 10)} XP
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
