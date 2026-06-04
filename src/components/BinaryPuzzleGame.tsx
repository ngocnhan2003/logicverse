import { useState, useEffect } from "react";
import { Check, HelpCircle, AlertOctagon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BinaryPuzzleGameProps {
  puzzle: {
    binarySize: number;
    binaryInitial: number[][];
    binarySolution: number[][];
    questionText: string;
    difficulty: number;
  };
  onComplete: (xpEarned: number) => void;
  onExit: () => void;
}

export interface CellViolation {
  row: number;
  col: number;
  type: "consecutive" | "excess";
}

export default function BinaryPuzzleGame({ puzzle, onComplete, onExit }: BinaryPuzzleGameProps) {
  const { binarySize, binaryInitial, binarySolution, questionText, difficulty } = puzzle;

  const [grid, setGrid] = useState<number[][]>([]);
  const [violations, setViolations] = useState<CellViolation[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info" | null; msg: string }>({
    type: null,
    msg: "",
  });
  const [hintCount, setHintCount] = useState(3);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Initialize board
  useEffect(() => {
    const initialClone = binaryInitial.map((row) => [...row]);
    setGrid(initialClone);
    setFeedback({ type: null, msg: "" });
    setViolations([]);
  }, [puzzle]);

  // Run dynamic validation whenever board changes
  useEffect(() => {
    if (grid.length === 0) return;
    const currentViolations: CellViolation[] = [];

    // 1. Check Row rules
    for (let r = 0; r < binarySize; r++) {
      let count0 = 0;
      let count1 = 0;

      for (let c = 0; c < binarySize; c++) {
        const val = grid[r][c];
        if (val === 0) count0++;
        if (val === 1) count1++;

        // No 3 consecutive same digits
        if (c <= binarySize - 3) {
          const v0 = grid[r][c];
          const v1 = grid[r][c + 1];
          const v2 = grid[r][c + 2];
          if (v0 !== -1 && v0 === v1 && v1 === v2) {
            currentViolations.push({ row: r, col: c, type: "consecutive" });
            currentViolations.push({ row: r, col: c + 1, type: "consecutive" });
            currentViolations.push({ row: r, col: c + 2, type: "consecutive" });
          }
        }
      }

      // Check count mismatch (maximum 3 numbers of each type in 6x6)
      const allowedCount = binarySize / 2;
      if (count0 > allowedCount || count1 > allowedCount) {
        for (let c = 0; c < binarySize; c++) {
          const val = grid[r][c];
          if ((val === 0 && count0 > allowedCount) || (val === 1 && count1 > allowedCount)) {
            currentViolations.push({ row: r, col: c, type: "excess" });
          }
        }
      }
    }

    // 2. Check Col rules
    for (let c = 0; c < binarySize; c++) {
      let count0 = 0;
      let count1 = 0;

      for (let r = 0; r < binarySize; r++) {
        const val = grid[r][c];
        if (val === 0) count0++;
        if (val === 1) count1++;

        // No 3 consecutive same digits
        if (r <= binarySize - 3) {
          const v0 = grid[r][c];
          const v1 = grid[r + 1][c];
          const v2 = grid[r + 2][c];
          if (v0 !== -1 && v0 === v1 && v1 === v2) {
            currentViolations.push({ row: r, col: c, type: "consecutive" });
            currentViolations.push({ row: r + 1, col: c, type: "consecutive" });
            currentViolations.push({ row: r + 2, col: c, type: "consecutive" });
          }
        }
      }

      // Excess checks
      const allowedCount = binarySize / 2;
      if (count0 > allowedCount || count1 > allowedCount) {
        for (let r = 0; r < binarySize; r++) {
          const val = grid[r][c];
          if ((val === 0 && count0 > allowedCount) || (val === 1 && count1 > allowedCount)) {
            currentViolations.push({ row: r, col: c, type: "excess" });
          }
        }
      }
    }

    // De-duplicate list
    const uniqueViolations = currentViolations.filter(
      (v, i, self) =>
        self.findIndex((val) => val.row === v.row && val.col === v.col) === i
    );

    setViolations(uniqueViolations);
  }, [grid]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const isEditable = (r: number, c: number) => {
    return binaryInitial[r]?.[c] === -1;
  };

  // Cycle values: empty (-1) -> 0 -> 1 -> empty (-1)
  const handleCellClick = (r: number, colIndex: number) => {
    if (!isEditable(r, colIndex)) return;

    const nextCellState = (curr: number) => {
      if (curr === -1) return 0;
      if (curr === 0) return 1;
      return -1;
    };

    const updated = grid.map((row, rowIndex) =>
      row.map((val, cIndex) => {
        if (rowIndex === r && cIndex === colIndex) {
          return nextCellState(val);
        }
        return val;
      })
    );
    setGrid(updated);
    setFeedback({ type: null, msg: "" });
  };

  // Give a hint
  const handleGetHint = () => {
    if (hintCount <= 0) {
      setFeedback({ type: "error", msg: "No hints remaining!" });
      return;
    }

    // Look for empty or incorrect cells to fill matching solution
    for (let r = 0; r < binarySize; r++) {
      for (let c = 0; c < binarySize; c++) {
        if (grid[r][c] !== binarySolution[r][c]) {
          const updated = [...grid];
          updated[r][c] = binarySolution[r][c];
          setGrid(updated);
          setHintCount((prev) => prev - 1);
          setFeedback({ type: "info", msg: `Revealed correct digit at Row ${r + 1}, Col ${c + 1}!` });
          return;
        }
      }
    }
  };

  // Submit grid
  const handleCheckGrid = () => {
    // Audit grid against solutions matrix
    let isCorrect = true;
    for (let r = 0; r < binarySize; r++) {
      for (let c = 0; c < binarySize; c++) {
        if (grid[r][c] !== binarySolution[r][c]) {
          isCorrect = false;
        }
      }
    }

    if (isCorrect) {
      const xpEarned = Math.max(15, 35 - Math.floor(timeElapsed / 25));
      setFeedback({ type: "success", msg: `Binary Grid complete! Solved in ${formatTime(timeElapsed)} (+${xpEarned} XP)` });
      setTimeout(() => {
        onComplete(xpEarned);
      }, 2100);
    } else {
      if (violations.length > 0) {
        setFeedback({ type: "error", msg: "Rules are violated. Watch highlighted red cells." });
      } else {
        setFeedback({ type: "error", msg: "The board is not completed or contains incorrect positions." });
      }
    }
  };

  return (
    <div id="binary_game_panel" className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 select-none animate-fade-in">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div>
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-900">
            BINARY PUZZLE 6X6
          </span>
        </div>
        <div className="text-neutral-400 text-xs sm:text-sm font-mono animate-pulse">
          Timer: {formatTime(timeElapsed)}
        </div>
      </div>

      <div className="mb-3 sm:mb-5 text-[10px] sm:text-xs text-slate-400 bg-slate-950/60 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-800 leading-relaxed">
        👉 Tap grids to cycle: <span className="font-bold text-slate-300">Empty → 0 → 1</span>. Every full row and column must contain exactly three 0s and three 1s, with no 3 identical digits consecutive.
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-6 gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-950/40 border border-slate-800 mb-4 sm:mb-6">
        {grid.map((row, r) =>
          row.map((val, c) => {
            const editable = isEditable(r, c);
            const violation = violations.some((v) => v.row === r && v.col === c);

            let cellBg = editable ? "bg-slate-900/40" : "bg-slate-800 text-slate-100 font-bold";
            let textColor = val === 0 ? "text-cyan-400" : val === 1 ? "text-amber-400" : "text-neutral-600";
            
            // Adjust styles based on violations and entries
            if (violation) {
              cellBg = "bg-rose-950/30 border border-rose-800";
              textColor = "text-rose-400";
            } else if (editable && val !== -1) {
              cellBg = "bg-slate-900 font-medium scale-[0.98] border border-slate-800";
            } else {
              cellBg = `${cellBg} border border-slate-800/40`;
            }

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`
                  aspect-square flex justify-center items-center rounded-lg sm:rounded-xl cursor-pointer transition-all duration-150 relative text-base sm:text-xl font-mono
                  ${cellBg} ${textColor} hover:scale-105 active:scale-95
                `}
              >
                {val === -1 ? (
                  <span className="text-slate-700/50 text-sm font-light">•</span>
                ) : (
                  val
                )}

                {/* Sub-dot indicating editable state */}
                {editable && (
                  <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-slate-600" />
                )}
              </div>
            );
          })
        )}
      </div>

      {violations.length > 0 && (
        <div className="flex gap-2 items-center text-xs text-rose-400 mb-4 bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-xl">
          <AlertOctagon className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Pattern detected violating rules (indicated in red)</span>
        </div>
      )}

      {/* Action response updates */}
      <AnimatePresence mode="wait">
        {feedback.type && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-xl text-center text-xs mb-4 font-semibold border
              ${feedback.type === "success" ? "bg-emerald-950/70 border-emerald-800 text-emerald-300" : ""}
              ${feedback.type === "error" ? "bg-rose-950/70 border-rose-800 text-rose-300" : ""}
              ${feedback.type === "info" ? "bg-cyan-950/70 border-cyan-800 text-cyan-300" : ""}
            `}
          >
            {feedback.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={handleGetHint}
          className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-800/80 text-neutral-300 hover:text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Hint ({hintCount})
        </button>

        <button
          onClick={onExit}
          className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-neutral-400 hover:text-white text-xs font-semibold"
        >
          Exit Studio
        </button>

        <button
          onClick={handleCheckGrid}
          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md"
        >
          <Check className="w-3.5 h-3.5" />
          Check Grid
        </button>
      </div>
    </div>
  );
}
