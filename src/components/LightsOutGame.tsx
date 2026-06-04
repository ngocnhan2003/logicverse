import { useState, useEffect } from "react";
import { Check, RotateCcw, HelpCircle, Loader } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { soundEffects } from "../utils/audio";

interface LightsOutGameProps {
  puzzle: {
    gridSize: number;
    initialGrid: number[][]; // 0 or 1
    difficulty: number;
  };
  onComplete: (xpEarned: number) => void;
  onExit: () => void;
}

export default function LightsOutGame({ puzzle, onComplete, onExit }: LightsOutGameProps) {
  const { gridSize, initialGrid, difficulty } = puzzle;

  const [grid, setGrid] = useState<number[][]>([]);
  const [moves, setMoves] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showRuleModal, setShowRuleModal] = useState(false);

  // Initialize board from puzzle or fallback to a generated solvable one if needed
  useEffect(() => {
    restartGame();
    setHasWon(false);
    setMoves(0);
  }, [puzzle]);

  // Game timer loop
  useEffect(() => {
    if (hasWon) return;
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [hasWon]);

  const restartGame = () => {
    // Clone setup
    const initialClone = initialGrid.map((row) => [...row]);
    setGrid(initialClone);
    setMoves(0);
    setHasWon(false);
    soundEffects.playSelect();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleCellClick = (r: number, c: number) => {
    if (hasWon) return;
    soundEffects.playTick();

    const nextGrid = grid.map((row) => [...row]);
    
    // Toggle standard cross nodes (r, c) and orthogonal neighbors
    const toggles = [
      [r, c],
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];

    toggles.forEach(([tr, tc]) => {
      if (tr >= 0 && tr < gridSize && tc >= 0 && tc < gridSize) {
        nextGrid[tr][tc] = nextGrid[tr][tc] === 1 ? 0 : 1;
      }
    });

    setGrid(nextGrid);
    setMoves((m) => m + 1);

    // Check if fully solved (all cells 0)
    const solved = nextGrid.every((row) => row.every((val) => val === 0));
    if (solved) {
      setHasWon(true);
      const xpEarned = 100 + difficulty * 25;
      soundEffects.playSuccess();
      setTimeout(() => {
        onComplete(xpEarned);
      }, 1400);
    }
  };

  return (
    <div className="bg-[#0b0c10] border border-cyan-500/10 rounded-2xl p-5 md:p-7 relative overflow-hidden shadow-neon-cyan max-w-2xl mx-auto w-full">
      {/* Visual cyber mesh background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Header Metadata Station */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#06b6d4] uppercase bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
            OPERATOR DECRYPTOR
          </span>
          <h2 className="text-xl font-light text-slate-100 mt-1 font-display">
            Neural Fray <span className="font-bold text-[#06b6d4]">Grid Solver</span>
          </h2>
        </div>

        <div className="flex gap-2.5 font-mono">
          <button
            onClick={() => setShowRuleModal(true)}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:border-cyan-500/30 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Show Directives"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={restartGame}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Stats HUD Dashboard */}
      <div className="grid grid-cols-3 gap-3 mb-6 relative z-10 text-center font-mono">
        <div className="bg-slate-900/50 rounded-xl p-2.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Operational Clock</div>
          <div className="text-sm font-bold text-slate-200 mt-0.5">{formatTime(timeElapsed)}</div>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-2.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Cycles Transmitted</div>
          <div className="text-sm font-bold text-slate-200 mt-0.5">{moves}</div>
        </div>
        <div className="bg-[#0f2420] rounded-xl p-2.5 border border-emerald-500/10">
          <div className="text-[9px] text-emerald-500 uppercase tracking-wider">Reward Estimate</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">+{100 + difficulty * 25} XP</div>
        </div>
      </div>

      {/* Game main interaction board */}
      <div className="flex flex-col items-center relative z-10 my-4">
        <div 
          className="grid gap-2 bg-[#12131a] p-4 rounded-2xl border border-white/15 shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            width: "min(100%, 340px)",
            aspectRatio: "1/1",
          }}
        >
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isGlowing = val === 1;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={hasWon}
                  className={`relative rounded-xl border transition-all duration-300 ease-out active:scale-90 flex cursor-pointer select-none items-center justify-center
                    ${isGlowing 
                      ? "bg-cyan-500/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-cyan-500/30" 
                      : "bg-[#181a24] border-white/10 hover:border-white/30"
                    }
                  `}
                >
                  {/* Subtle inner grid marker */}
                  <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300
                    ${isGlowing ? "bg-[#06b6d4] scale-100" : "bg-slate-800 scale-75"}
                  `} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Directives Banner */}
      <div className="bg-[#15171C]/50 border border-white/5 rounded-xl p-3 text-xs text-slate-400 mt-6 font-sans">
        <p className="font-semibold text-slate-300 mb-0.5">Directives Matrix:</p>
        <p>Clicking any node toggles its state and the states of its four adjacent neighbors. Deactivate all nodes (darken the entire terminal grid) to solve the decryption keys.</p>
      </div>

      {/* Rules overlay Modal */}
      <AnimatePresence>
        {showRuleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-[#161a22] border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full relative"
            >
              <h3 className="text-lg font-bold text-cyan-400 mb-2 font-display">Neural Fray Directives</h3>
              <div className="text-sm text-slate-300 space-y-3 font-sans leading-relaxed">
                <p>
                  You are faced with a series of quantum signal switches representation. Toggle them so we can silence the background cognitive static.
                </p>
                <p>
                  - **Toggle Rule**: Activating or deactivating a node will invert the charge (on/off) of itself and its directly-touching cardinal keys (up, down, left, right).
                </p>
                <p>
                  - **Objective**: All nodes must be completely deactivated (0 charge, turned off) to successfully complete the decryption puzzle.
                </p>
              </div>
              <button
                onClick={() => {
                  soundEffects.playSelect();
                  setShowRuleModal(false);
                }}
                className="mt-6 w-full py-2 bg-gradient-to-r from-cyan-500 to-[#06b6d4]/80 text-slate-950 font-bold font-mono rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                ACKNOWLEDGE DIRECTIVES
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Overlay */}
      <AnimatePresence>
        {hasWon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-950/90 flex flex-col justify-center items-center z-40 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center font-mono flex flex-col items-center max-w-xs"
            >
              <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mb-4 shadow-neon-amber animate-pulse">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-[#06b6d4] text-xl font-bold uppercase tracking-widest animate-bounce">
                GRID SOLVED!
              </h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Neural frequencies reconciled successfully. Secure handshake completed in <span className="text-slate-200 mt-1">{moves} cycles</span> within <span className="text-slate-200">{formatTime(timeElapsed)}</span>.
              </p>
              
              <div className="mt-5 border border-[#10b981]/20 bg-emerald-950/20 px-4 py-1.5 rounded text-emerald-400 text-xs font-black">
                +{100 + difficulty * 25} XP TRANSMITTED
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-3 animate-pulse">
                <Loader className="w-3 h-3 animate-spin" />
                <span>Redirecting back to operators...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
