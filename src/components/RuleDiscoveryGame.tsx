import { useState } from "react";
import { Check, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RuleDiscoveryGameProps {
  puzzle: {
    ruleQuestion: string;
    ruleAnswer: string;
    ruleOptions: string[];
    ruleExplanation?: string;
    difficulty: number;
    source: "gemini-ai" | "local-engine";
  };
  onComplete: (xpEarned: number) => void;
  onExit: () => void;
}

export default function RuleDiscoveryGame({ puzzle, onComplete, onExit }: RuleDiscoveryGameProps) {
  const { ruleQuestion, ruleAnswer, ruleOptions, ruleExplanation, difficulty, source } = puzzle;

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [status, setStatus] = useState<"correct" | "incorrect" | null>(null);
  const [tries, setTries] = useState(0);

  const handleSelectOption = (opt: string) => {
    if (isDone) return;
    setSelectedOption(opt);
    setTries((t) => t + 1);

    if (opt.trim().toLowerCase() === ruleAnswer.trim().toLowerCase()) {
      setStatus("correct");
      setIsDone(true);
    } else {
      setStatus("incorrect");
    }
  };

  const handleProceed = () => {
    // Reward XP based on how many tries it took
    const baseXP = difficulty * 3 + 10;
    const earnedXP = Math.max(5, baseXP - (tries - 1) * 3);
    onComplete(earnedXP);
  };

  return (
    <div id="rule_discovery_panel" className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 select-none">
      {/* Game info header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs font-mono text-purple-400 font-bold bg-purple-950/50 px-2.5 py-1 rounded-full border border-purple-900">
            SEQUENCE PATTERN
          </span>
          <span className="ml-2 text-[10px] font-mono text-neutral-500 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {source === "gemini-ai" ? "🤖 Gemini AI" : "⚙️ Local Master"}
          </span>
        </div>
        <div className="text-neutral-400 text-xs font-mono">
          Difficulty: <span className="text-amber-400 font-bold">{difficulty}/10</span>
        </div>
      </div>

      {/* Sequence container display */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800/80 p-6 flex flex-col items-center justify-center mb-6">
        <span className="text-xs font-semibold tracking-wide text-neutral-400 mb-3 uppercase">Find the missing element:</span>
        <div className="text-3xl font-mono text-slate-100 font-bold tracking-tight py-2 border-b border-dashed border-slate-800 w-full text-center">
          {ruleQuestion}
        </div>
      </div>

      {/* Answer selection cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {ruleOptions.map((opt, i) => {
          const isSelected = selectedOption === opt;
          const isAnswer = opt.trim().toLowerCase() === ruleAnswer.trim().toLowerCase();
          
          let btnStyle = "bg-slate-900 border-slate-800 hover:bg-slate-800/60 text-slate-200";
          if (isSelected) {
            if (status === "correct") {
              btnStyle = "bg-emerald-950/50 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500";
            } else if (status === "incorrect") {
              btnStyle = "bg-rose-950/50 border-rose-500 text-rose-300 ring-2 ring-rose-500";
            }
          } else if (isDone && isAnswer) {
            // Highlight the true answer if chosen incorrectly
            btnStyle = "bg-emerald-950/20 border-emerald-800/60 text-emerald-300";
          }

          return (
            <motion.button
              key={`${opt}-${i}`}
              onClick={() => handleSelectOption(opt)}
              disabled={isDone}
              whileHover={{ scale: isDone ? 1 : 1.02 }}
              whileTap={{ scale: isDone ? 1 : 0.98 }}
              className={`py-4 px-4 rounded-2xl border-2 font-mono text-lg font-bold transition-all text-center ${btnStyle} cursor-pointer disabled:cursor-default`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>

      {/* Explanatory blocks */}
      <AnimatePresence mode="wait">
        {status && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`p-4 rounded-2xl border mb-6
              ${status === "correct" 
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200" 
                : "bg-rose-950/40 border-rose-500/30 text-rose-200"}`}
          >
            <div className="flex gap-2 items-start">
              <span className="text-lg">
                {status === "correct" ? "✨" : "🧐"}
              </span>
              <div>
                <p className="font-bold text-xs uppercase tracking-wider mb-1">
                  {status === "correct" ? "Correct Sequence!" : "Incorrect Answer"}
                </p>
                <p className="text-sm">
                  {status === "correct" 
                    ? "Fantastic logic! You analyzed the pattern correctly." 
                    : "Try checking the sequence properties or pick another candidate."}
                </p>
              </div>
            </div>

            {/* Explanation section shown on correct solver */}
            {isDone && ruleExplanation && (
              <div className="mt-3 pt-3 border-t border-slate-800/40 text-xs text-neutral-400 font-normal leading-relaxed">
                <span className="font-bold text-slate-300 block mb-1">How it works:</span>
                {ruleExplanation}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button navigation */}
      <div className="flex gap-2">
        <button
          onClick={onExit}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-neutral-400 hover:text-white text-xs font-semibold"
        >
          Exit Studio
        </button>

        {isDone ? (
          <button
            onClick={handleProceed}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-transform cursor-pointer"
          >
            Collect XP & Continue
            <Check className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex-1 text-center py-3 text-xs text-slate-500 font-mono italic">
            Select standard option card to solve
          </div>
        )}
      </div>
    </div>
  );
}
