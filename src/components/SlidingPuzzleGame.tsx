import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SlidingPuzzle } from "../types";
import { soundEffects } from "../utils/audio";
import { LayoutGrid, Cpu } from "lucide-react";

interface SlidingPuzzleGameProps {
  puzzle: SlidingPuzzle & { difficulty: number };
  onComplete: (xpEarned: number) => void;
  onExit: () => void;
}

export default function SlidingPuzzleGame({ puzzle, onComplete, onExit }: SlidingPuzzleGameProps) {
  const [grid, setGrid] = useState<number[][]>(puzzle.initialGrid);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    // Check if won
    let correct = true;
    let expected = 1;
    const maxVal = puzzle.gridSize * puzzle.gridSize - 1;

    for (let r = 0; r < puzzle.gridSize; r++) {
      for (let c = 0; c < puzzle.gridSize; c++) {
        const val = grid[r][c];
        if (expected <= maxVal) {
          if (val !== expected) correct = false;
          expected++;
        } else {
          if (val !== 0) correct = false;
        }
      }
    }

    if (correct && moves > 0 && !gameOver) {
      setGameOver(true);
      soundEffects.playSuccess();
    }
  }, [grid, moves, puzzle.gridSize, gameOver]);

  const handleTileClick = (r: number, c: number) => {
    if (gameOver) return;
    
    // Find empty spot
    let emptyR = -1;
    let emptyC = -1;
    for (let i = 0; i < puzzle.gridSize; i++) {
        for (let j = 0; j < puzzle.gridSize; j++) {
            if (grid[i][j] === 0) {
                emptyR = i;
                emptyC = j;
            }
        }
    }

    // Check if adjacent
    const isAdjacent = Math.abs(r - emptyR) + Math.abs(c - emptyC) === 1;
    if (isAdjacent) {
      soundEffects.playSlide();
      const newGrid = grid.map(row => [...row]);
      newGrid[emptyR][emptyC] = grid[r][c];
      newGrid[r][c] = 0;
      setGrid(newGrid);
      setMoves(moves + 1);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center text-sm font-mono border-b border-white/10 pb-4">
        <span className="text-amber-400 font-bold bg-amber-900/40 px-2 py-0.5 rounded border border-amber-500/20">BLOCK_SORTING_ALGORITHM</span>
        <button onClick={onExit} className="text-slate-500 hover:text-slate-300">ABORT</button>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex justify-between w-full max-w-sm text-slate-300 font-mono tracking-widest text-xs">
          <span>OPERATIONS: {moves}</span>
        </div>

        <div 
          className="grid gap-[2px] p-2 bg-slate-900 rounded-lg shadow-lg border border-white/5 mx-auto"
          style={{ gridTemplateColumns: `repeat(${puzzle.gridSize}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) => 
            row.map((val, c) => (
              <motion.div 
                key={val === 0 ? 'empty' : val}
                layout
                onClick={() => handleTileClick(r, c)}
                className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center font-display font-medium text-lg sm:text-2xl rounded-md
                  ${val === 0 ? 'bg-transparent shadow-inner cursor-default' : 'bg-slate-700 text-white cursor-pointer hover:bg-slate-600 shadow-md border border-slate-600'}
                  ${val !== 0 && (val === r * puzzle.gridSize + c + 1) ? 'text-amber-400 border-amber-500/30 bg-slate-700/80 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]' : ''}
                `}
              >
                {val !== 0 && val}
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-4 text-center border-amber-500/50 bg-amber-950/20`}
          >
            <Cpu className="w-10 h-10 text-amber-400" />
            <h3 className={`text-xl font-display font-light text-amber-400`}>
              ARRAY SORTED SUCCESSFULLY
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Matrix defragmented in {moves} operations.
            </p>
            <button
              onClick={() => onComplete(50 + (puzzle.difficulty * 20))}
              className="px-6 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold rounded-lg mt-2 tracking-widest text-xs uppercase"
            >
              Collect {50 + (puzzle.difficulty * 20)} XP
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
