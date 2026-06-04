import { useState, useEffect } from "react";
import { Check, HelpCircle, RefreshCw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SudokuGameProps {
  puzzle: {
    sudokuSize: number;
    sudokuInitial: number[][];
    sudokuSolution: number[][];
    sudokuSpecialRuleType?: "classic" | "even_odd";
    sudokuEvenCells?: number[][]; // Coordinates [row, col]
  };
  onComplete: (xpEarned: number) => void;
  onExit: () => void;
}

export default function SudokuGame({ puzzle, onComplete, onExit }: SudokuGameProps) {
  const { sudokuSize, sudokuInitial, sudokuSolution, sudokuSpecialRuleType, sudokuEvenCells } = puzzle;

  // Initialize board state
  const [board, setBoard] = useState<number[][]>([]);
  // Store notes/pencil marks in a 3D matrix [row][col][num]
  const [notes, setNotes] = useState<boolean[][][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [pencilMode, setPencilMode] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info" | null; msg: string }>({
    type: null,
    msg: "",
  });
  const [hintCount, setHintCount] = useState(3);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Load puzzle
  useEffect(() => {
    // Clone initial grid
    const initialBoard = sudokuInitial.map((row) => [...row]);
    setBoard(initialBoard);

    // Initialize notes matrix
    const notesMatrix = Array.from({ length: sudokuSize }, () =>
      Array.from({ length: sudokuSize }, () => Array.from({ length: sudokuSize + 1 }, () => false))
    );
    setNotes(notesMatrix);
    setSelectedCell(null);
    setFeedback({ type: null, msg: "" });
  }, [puzzle]);

  // Game timer
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

  // Helper: check if cell is initially filled
  const isOriginal = (r: number, c: number) => {
    return sudokuInitial[r]?.[c] !== 0;
  };

  // Helper: check if coordinates are marked as Even Cell Rule
  const isEvenCell = (r: number, c: number) => {
    if (sudokuSpecialRuleType !== "even_odd" || !sudokuEvenCells) return false;
    return sudokuEvenCells.some(([er, ec]) => er === r && ec === c);
  };

  // Insert digit
  const handleInputNumber = (num: number) => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    if (isOriginal(r, c)) return;

    if (pencilMode) {
      // Toggle note
      const updatedNotes = [...notes];
      updatedNotes[r][c][num] = !updatedNotes[r][c][num];
      setNotes(updatedNotes);

      // Clear actual draft value
      const updatedBoard = [...board];
      updatedBoard[r][c] = 0;
      setBoard(updatedBoard);
    } else {
      // Direct placement
      const updatedBoard = [...board];
      updatedBoard[r][c] = updatedBoard[r][c] === num ? 0 : num; // Toggle input
      setBoard(updatedBoard);

      // Clear notes for this cell
      const updatedNotes = [...notes];
      updatedNotes[r][c] = Array(sudokuSize + 1).fill(false);
      setNotes(updatedNotes);
    }

    setFeedback({ type: null, msg: "" });
  };

  // Clear current cell
  const handleClearCell = () => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    if (isOriginal(r, c)) return;

    const updatedBoard = [...board];
    updatedBoard[r][c] = 0;
    setBoard(updatedBoard);

    const updatedNotes = [...notes];
    updatedNotes[r][c] = Array(sudokuSize + 1).fill(false);
    setNotes(updatedNotes);
  };

  // Trigger hint
  const handleUseHint = () => {
    if (hintCount <= 0) {
      setFeedback({ type: "error", msg: "No hints remaining!" });
      return;
    }

    // Find first empty or incorrect cell to fill
    for (let r = 0; r < sudokuSize; r++) {
      for (let c = 0; c < sudokuSize; c++) {
        if (board[r][c] !== sudokuSolution[r][c]) {
          const updatedBoard = [...board];
          updatedBoard[r][c] = sudokuSolution[r][c];
          setBoard(updatedBoard);
          setHintCount((prev) => prev - 1);
          setSelectedCell({ r, c });
          setFeedback({ type: "info", msg: `Revealed correct number at row ${r + 1}, col ${c + 1}!` });
          return;
        }
      }
    }
    setFeedback({ type: "success", msg: "Board is already correct!" });
  };

  // Submit/Check logic
  const handleCheckBoard = () => {
    let isCorrect = true;
    for (let r = 0; r < sudokuSize; r++) {
      for (let c = 0; c < sudokuSize; c++) {
        if (board[r][c] !== sudokuSolution[r][c]) {
          isCorrect = false;
        }
      }
    }

    if (isCorrect) {
      // XP logic: extra fast completion bonus
      const xpEarned = Math.max(15, 30 - Math.floor(timeElapsed / 30));
      setFeedback({ type: "success", msg: `Perfect game! You earned +${xpEarned} XP!` });
      setTimeout(() => {
        onComplete(xpEarned);
      }, 2000);
    } else {
      setFeedback({ type: "error", msg: "Some cells are incorrect or unfilled. Try checking again!" });
    }
  };

  // Render block layout coordinates
  // 4x4 -> 2x2 blocks
  // 6x6 -> 2x3 blocks (2 rows, 3 cols)
  const isBlockBorderCol = (c: number) => {
    if (sudokuSize === 4 && c === 1) return true;
    if (sudokuSize === 6 && (c === 2 || c === 5)) return true;
    return false;
  };

  const isBlockBorderRow = (r: number) => {
    if (sudokuSize === 4 && r === 1) return true;
    if (sudokuSize === 6 && (r === 1 || r === 3 || r === 5)) return true;
    return false;
  };

  return (
    <div id="sudoku_game_panel" className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 select-none">
      {/* Game bar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/50 px-2.5 py-1 rounded-full border border-cyan-900">
            SUDOKU+ {sudokuSize}X{sudokuSize}
          </span>
          {sudokuSpecialRuleType === "even_odd" && (
            <span className="ml-2 text-xs font-mono text-purple-400 font-bold bg-purple-950/50 px-2.5 py-1 rounded-full border border-purple-900">
              Even/Odd
            </span>
          )}
        </div>
        <div className="text-neutral-400 text-sm font-mono tracking-wider">
          Timer: {formatTime(timeElapsed)}
        </div>
      </div>

      {sudokuSpecialRuleType === "even_odd" && (
        <div className="mb-4 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
          💡 <span className="text-purple-300 font-bold">Rule Discovery Special:</span> Blue shaded cells must contain **Even numbers** (2, 4, or 6).
        </div>
      )}

      {/* Sudoku grid */}
      <div 
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${sudokuSize}, minmax(0, 1fr))`,
        }}
        className="gap-1.5 p-3 rounded-2xl bg-slate-950/40 border border-slate-800 mb-6"
      >
        {board.map((row, r) =>
          row.map((val, c) => {
            const isSel = selectedCell?.r === r && selectedCell?.c === c;
            const isOrig = isOriginal(r, c);
            const isSecHl = selectedCell && (selectedCell.r === r || selectedCell.c === c);
            const isEven = isEvenCell(r, c);

            // Determine block borders for grid styling
            const borderR = isBlockBorderCol(c) ? "border-r-2 border-slate-700" : "";
            const borderB = isBlockBorderRow(r) ? "border-b-2 border-slate-700" : "";

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => setSelectedCell({ r, c })}
                className={`
                  aspect-square flex flex-col justify-center items-center relative rounded-lg cursor-pointer transition-all duration-150
                  ${val === 0 ? "text-neutral-400" : isOrig ? "text-slate-200 bg-slate-800/80 font-bold" : "text-emerald-400 font-medium"}
                  ${isSel ? "ring-2 ring-emerald-500 scale-105 z-10 bg-slate-800" : isSecHl ? "bg-slate-900/60" : "bg-slate-900/30"}
                  ${isEven && !isSel && !isSecHl ? "bg-cyan-950/30 border border-cyan-800/30" : "border border-slate-800/65"}
                  hover:bg-slate-800/50
                  ${borderR} ${borderB}
                `}
              >
                {/* Even cells highlight tag */}
                {isEven && (
                  <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}

                {/* Number or Notes draft list */}
                {val !== 0 ? (
                  <span className="text-xl font-mono">{val}</span>
                ) : (
                  <div className="grid grid-cols-2 gap-x-1.5 text-[8px] leading-3 font-mono opacity-60">
                    {Array.from({ length: sudokuSize }).map((_, idx) => {
                      const num = idx + 1;
                      return notes[r]?.[c]?.[num] ? (
                        <span key={num} className="text-cyan-400">{num}</span>
                      ) : (
                        <span key={num} className="invisible">{num}</span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Control keypad */}
      <div className="mb-6">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setPencilMode(!pencilMode)}
            className={`flex-1 py-2 px-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 text-xs transition-colors
              ${pencilMode 
                ? "bg-cyan-950 border-cyan-500 text-cyan-400" 
                : "bg-slate-950 border-slate-800 text-neutral-400 hover:text-white"}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Notes Mode: {pencilMode ? "ON" : "OFF"}
          </button>
          
          <button
            onClick={handleClearCell}
            disabled={!selectedCell || isOriginal(selectedCell.r, selectedCell.c)}
            className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-rose-400 hover:bg-rose-950/30 text-xs font-semibold disabled:opacity-40"
          >
            Clear Cell
          </button>
        </div>

        <div className="flex justify-center gap-2">
          {Array.from({ length: sudokuSize }).map((_, idx) => {
            const num = idx + 1;
            return (
              <button
                key={num}
                onClick={() => handleInputNumber(num)}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-lg font-mono font-bold text-white transition-all flex items-center justify-center border border-slate-700"
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action panel */}
      <AnimatePresence mode="wait">
        {feedback.type && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-xl text-center text-xs mb-4 font-medium border
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
          onClick={handleUseHint}
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
          onClick={handleCheckBoard}
          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-shadow"
        >
          <Check className="w-3.5 h-3.5" />
          Check Grid
        </button>
      </div>
    </div>
  );
}
