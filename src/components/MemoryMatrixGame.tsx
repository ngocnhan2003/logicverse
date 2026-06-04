import { useState, useEffect, useRef } from "react";
import { Check, HelpCircle, Play, RotateCcw, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { soundEffects } from "../utils/audio";

interface MemoryMatrixGameProps {
  puzzle: {
    gridSize: number; // 4x4
    sequence: { r: number; c: number }[];
    difficulty: number;
  };
  onComplete: (xpEarned: number) => void;
  onExit: () => void;
}

export default function MemoryMatrixGame({ puzzle, onComplete, onExit }: MemoryMatrixGameProps) {
  const { gridSize, sequence, difficulty } = puzzle;

  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [gameState, setGameState] = useState<"ready" | "flashing" | "inputting" | "error" | "solved">("ready");
  
  const [playerInputSequence, setPlayerInputSequence] = useState<{ r: number; c: number }[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [lives, setLives] = useState(3);
  const [showRuleModal, setShowRuleModal] = useState(false);

  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Restart of local puzzle state
  useEffect(() => {
    restartGame();
  }, [puzzle]);

  // Operational Clock
  useEffect(() => {
    if (gameState === "solved") return;
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const restartGame = () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setGameState("ready");
    setActiveSegmentIndex(null);
    setPlayerInputSequence([]);
    setLives(3);
    soundEffects.playSelect();
  };

  const startFlashingSequence = async () => {
    setGameState("flashing");
    setPlayerInputSequence([]);
    soundEffects.playForge();

    // Loop through the coordinate array and flash them one-by-one with brief delays
    for (let i = 0; i < sequence.length; i++) {
      setActiveSegmentIndex(i);
      soundEffects.playTick();
      await new Promise((resolve) => setTimeout(resolve, 550));
      setActiveSegmentIndex(null);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setGameState("inputting");
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== "inputting") return;

    soundEffects.playTick();
    const nextInputs = [...playerInputSequence, { r, c }];
    setPlayerInputSequence(nextInputs);

    // Validate index
    const checkIdx = nextInputs.length - 1;
    const targetCell = sequence[checkIdx];

    if (targetCell.r !== r || targetCell.c !== c) {
      // Mistake made
      soundEffects.playError();
      setLives((prev) => {
        const nextLives = prev - 1;
        if (nextLives <= 0) {
          // Reset game state to start over
          setGameState("error");
          setTimeout(() => {
            restartGame();
          }, 1500);
        } else {
          // Try again from current sequence start
          setGameState("flashing");
          setPlayerInputSequence([]);
          setTimeout(() => {
            startFlashingSequence();
          }, 1000);
        }
        return nextLives;
      });
      return;
    }

    // Check if whole sequence is fully correct
    if (nextInputs.length === sequence.length) {
      setGameState("solved");
      const xpEarned = 100 + difficulty * 25;
      soundEffects.playSuccess();
      setTimeout(() => {
        onComplete(xpEarned);
      }, 1500);
    }
  };

  const isCellActiveInFlash = (r: number, c: number) => {
    if (activeSegmentIndex === null) return false;
    const flashCoord = sequence[activeSegmentIndex];
    return flashCoord && flashCoord.r === r && flashCoord.c === c;
  };

  return (
    <div className="bg-[#0b0c10] border border-pink-500/10 rounded-2xl p-5 md:p-7 relative overflow-hidden shadow-neon-pink max-w-2xl mx-auto w-full">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Header Info */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-pink-500 uppercase bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded">
            COGNITIVE SEQUENCE COUPLER
          </span>
          <h2 className="text-xl font-light text-slate-100 mt-1 font-display">
            Neural Memory <span className="font-bold text-pink-500 animate-pulse">Matrix</span>
          </h2>
        </div>

        <div className="flex gap-2.5 font-mono">
          <button
            onClick={() => setShowRuleModal(true)}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:border-pink-500/30 text-slate-400 hover:text-pink-400 transition-colors cursor-pointer"
            title="Read Rules"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={restartGame}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-pink-500/30 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* HUD System Monitor */}
      <div className="grid grid-cols-3 gap-3 mb-6 relative z-10 text-center font-mono">
        <div className="bg-slate-900/50 rounded-xl p-2.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Elapsed Time</div>
          <div className="text-sm font-bold text-slate-200 mt-0.5">{formatTime(timeElapsed)}</div>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-2.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Sync Lives</div>
          <div className="text-sm font-bold mt-0.5 text-pink-400 flex items-center justify-center gap-1">
            {Array.from({ length: 3 }).map((_, idx) => (
              <span key={idx} className={idx < lives ? "text-pink-500 animate-pulse" : "text-slate-800"}>
                ❤
              </span>
            ))}
          </div>
        </div>
        <div className="bg-[#24121a] rounded-xl p-2.5 border border-pink-500/10">
          <div className="text-[9px] text-pink-500 uppercase tracking-wider">Neural XP</div>
          <div className="text-sm font-bold text-pink-400 mt-0.5">+{100 + difficulty * 25} XP</div>
        </div>
      </div>

      {/* Main Board Center */}
      <div className="flex flex-col items-center relative z-10 m-4">
        {gameState === "ready" ? (
          <div 
            className="flex flex-col items-center justify-center border border-dashed border-white/10 bg-[#12131a] rounded-2xl p-6 text-center"
            style={{ width: "min(100%, 340px)", aspectRatio: "1/1" }}
          >
            <div className="w-12 h-12 rounded-full border border-pink-500/20 bg-pink-500/5 flex items-center justify-center mb-4">
              <Play className="w-5 h-5 text-pink-500 animate-ping" />
            </div>
            <h4 className="text-sm font-mono text-slate-200 font-bold uppercase tracking-wider">System Synchronizer Ready</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed font-sans">
              Press compile to transmit the logical node lights sequence. Observe closely and enter coordinates.
            </p>
            <button
              onClick={startFlashingSequence}
              className="mt-5 px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)] cursor-pointer"
            >
              COMPILE SIGNAL DEMO
            </button>
          </div>
        ) : (
          <div 
            className="grid grid-cols-4 gap-2 bg-[#12131a] p-4 rounded-2xl border border-white/15"
            style={{ width: "min(100%, 340px)", aspectRatio: "1/1" }}
          >
            {Array.from({ length: gridSize }).map((_, r) =>
              Array.from({ length: gridSize }).map((_, c) => {
                const isFlashingActive = isCellActiveInFlash(r, c);
                const hasPlayerSelected = playerInputSequence.some((inp, idx) => inp.r === r && inp.c === c);
                
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    disabled={gameState !== "inputting"}
                    className={`relative rounded-xl border transition-all duration-200 ease-out flex cursor-pointer select-none items-center justify-center aspect-square
                      ${isFlashingActive 
                        ? "bg-pink-500/30 border-pink-500 shadow-[0_0_20px_rgba(244,63,94,0.5)] scale-105" 
                        : hasPlayerSelected
                          ? "bg-purple-500/25 border-purple-500"
                          : "bg-[#181a24] border-white/10 hover:border-white/20"
                      }
                    `}
                  >
                    <span className="text-[9px] text-slate-500 font-mono opacity-25">{r},{c}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Progress monitor */}
      {gameState === "inputting" && (
        <div className="flex flex-col items-center mt-3 mb-1">
          <span className="text-[10px] font-mono text-pink-400 font-bold uppercase tracking-wider animate-pulse">
            OPERATOR INPUT MODE ACTIVE
          </span>
          <div className="flex gap-2 mt-2">
            {sequence.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-6 h-1.5 rounded transition-all duration-300
                  ${idx < playerInputSequence.length ? "bg-pink-500" : "bg-slate-800"}
                `} 
              />
            ))}
          </div>
        </div>
      )}

      {/* State banner */}
      <div className="text-center mt-3">
        {gameState === "flashing" && (
          <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider animate-pulse">
            🌌 DOWNLOADING FLASHING LOGIC CODES...
          </span>
        )}
        {gameState === "error" && (
          <span className="text-xs font-mono text-rose-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-4 h-4 animate-bounce" />
            CORE COMPILER MALFUNCTION! REBOOTING CODES...
          </span>
        )}
      </div>

      {/* Directives */}
      <div className="bg-[#15171C]/50 border border-white/5 rounded-xl p-3 text-xs text-slate-400 mt-6 font-sans">
        <p className="font-semibold text-slate-300 mb-0.5">Tactical Guide:</p>
        <p>Watch the flashing sequence. After compiling finishes, use tactile switches to repeat the coordinates pattern precisely. A single mistransmission disrupts synchronization rules.</p>
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
              className="bg-[#161a22] border border-pink-500/30 rounded-2xl p-6 max-w-md w-full relative"
            >
              <h3 className="text-lg font-bold text-pink-500 mb-2 font-display">Neural Memory Directives</h3>
              <div className="text-sm text-slate-300 space-y-3 font-sans leading-relaxed">
                <p>
                  We are aligning mental processing speeds. A sequence of spatial coordinates will light up on the screen in quick succession:
                </p>
                <p>
                  - **Observe**: Follow the path. Remember the sequential order of cells flashing on the matrix board.
                </p>
                <p>
                  - **Input**: Replicate the exact pattern by clicking coordinates.
                </p>
                <p>
                  - **Rule**: If you click the wrong slot, your transceiver will lose a synchronization life. Losing three lives triggers standard logical diagnostic reset commands.
                </p>
              </div>
              <button
                onClick={() => {
                  soundEffects.playSelect();
                  setShowRuleModal(false);
                }}
                className="mt-6 w-full py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-mono rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold"
              >
                ENGAGE INTELLECT PROTOCOL
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete Overlay */}
      <AnimatePresence>
        {gameState === "solved" && (
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
              <h3 className="text-pink-500 text-xl font-bold uppercase tracking-widest animate-bounce">
                PATTERN RECOVERED!
              </h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Memory cache successfully decrypted. Mind speed synchronized across multiple dimensions in <span className="text-slate-200">{formatTime(timeElapsed)}</span>.
              </p>
              
              <div className="mt-5 border border-pink-500/20 bg-pink-955/40 px-4 py-1.5 rounded text-pink-400 text-xs font-black">
                +{100 + difficulty * 25} XP TRANSMITTED
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-3 animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-t-pink-500 border-slate-700 rounded-full animate-spin" />
                <span>Returning memory logs to host...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
