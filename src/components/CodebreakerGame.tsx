import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CodebreakerPuzzle } from "../types";
import { soundEffects } from "../utils/audio";
import { Check, X, ShieldAlert, Cpu } from "lucide-react";

interface CodebreakerGameProps {
  puzzle: CodebreakerPuzzle & { difficulty: number };
  onComplete: (xpEarned: number) => void;
  onExit: () => void;
}

export default function CodebreakerGame({ puzzle, onComplete, onExit }: CodebreakerGameProps) {
  const [guesses, setGuesses] = useState<string[][]>([]);
  const [feedbacks, setFeedbacks] = useState<{exact: number, color: number}[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>(Array(puzzle.codeLength).fill(""));
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);

  const calculateFeedback = (guess: string[]) => {
    let exact = 0;
    let color = 0;
    const secretCounts: Record<string, number> = {};
    const guessCounts: Record<string, number> = {};

    // First pass layout: Exact matches
    for (let i = 0; i < puzzle.codeLength; i++) {
      if (guess[i] === puzzle.secretCode[i]) {
        exact++;
      } else {
        secretCounts[puzzle.secretCode[i]] = (secretCounts[puzzle.secretCode[i]] || 0) + 1;
        guessCounts[guess[i]] = (guessCounts[guess[i]] || 0) + 1;
      }
    }

    // Second pass layout: Wrong pos matches
    for (const c in guessCounts) {
      if (secretCounts[c]) {
        color += Math.min(guessCounts[c], secretCounts[c]);
      }
    }

    return { exact, color };
  };

  const submitGuess = () => {
    if (currentGuess.includes("")) return;
    
    soundEffects.playInput();
    const newGuesses = [...guesses, [...currentGuess]];
    const newFeedback = calculateFeedback(currentGuess);
    const newFeedbacks = [...feedbacks, newFeedback];
    
    setGuesses(newGuesses);
    setFeedbacks(newFeedbacks);
    setCurrentGuess(Array(puzzle.codeLength).fill(""));

    if (newFeedback.exact === puzzle.codeLength) {
      setVictory(true);
      setGameOver(true);
      soundEffects.playSuccess();
    } else if (newGuesses.length >= puzzle.maxGuesses) {
      setGameOver(true);
      soundEffects.playError();
    }
  };

  const setPegColor = (index: number, color: string) => {
    if (gameOver) return;
    const nextGuess = [...currentGuess];
    nextGuess[index] = color;
    setCurrentGuess(nextGuess);
    soundEffects.playTick();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center text-sm font-mono border-b border-white/10 pb-4">
        <span className="text-pink-400">CIPHER_PROTOCOL</span>
        <button onClick={onExit} className="text-slate-500 hover:text-slate-300">ABORT_X</button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 w-full bg-[#15171C] border border-white/10 rounded-2xl p-6 relative">
          <div className="absolute top-2 right-2 text-xs text-slate-600 font-mono">Guesses: {guesses.length}/{puzzle.maxGuesses}</div>
          
          <div className="flex flex-col gap-3">
            {guesses.map((guess, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <span className="text-slate-600 text-xs font-mono w-4">{idx + 1}</span>
                <div className="flex gap-2 bg-slate-900/50 p-2 rounded flex-1 justify-center">
                  {guess.map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border border-white/10 shadow-inner" style={{ backgroundColor: c }}></div>
                  ))}
                </div>
                <div className="flex gap-1 bg-slate-900/50 p-2 rounded min-w-[50px] items-center justify-center">
                  <span className="text-green-500 font-bold mx-1" title="Exact match">{feedbacks[idx].exact}●</span>
                  <span className="text-slate-400 font-bold mx-1" title="Color match">{feedbacks[idx].color}○</span>
                </div>
              </div>
            ))}
            
            {!gameOver && (
              <div className="flex gap-4 items-center mt-2 border border-pink-500/30 p-2 rounded-lg bg-pink-500/5">
                <span className="text-pink-500 text-xs font-mono w-4 shadow-neon-pink">►</span>
                <div className="flex gap-2 flex-1 justify-center">
                  {currentGuess.map((c, i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full border border-pink-500/50 flex items-center justify-center shadow-inner cursor-pointer"
                      style={{ backgroundColor: c || 'transparent' }}
                    >
                      {!c && <span className="w-2 h-2 rounded-full bg-white/10"></span>}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={submitGuess}
                  disabled={currentGuess.includes("")}
                  className="px-3 py-1 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded font-mono text-xs hover:bg-pink-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  SEND
                </button>
              </div>
            )}
          </div>

          {!gameOver && (
            <div className="mt-8 border-t border-white/10 pt-4 flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 font-mono text-center">SELECT COLOR & CLICK PEG</span>
              <div className="flex justify-center flex-wrap gap-3">
                {puzzle.availableColors.map((color, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      const emptyIdx = currentGuess.indexOf("");
                      if(emptyIdx !== -1) setPegColor(emptyIdx, color);
                    }}
                    className="w-10 h-10 rounded-full border-2 border-white/20 hover:scale-110 active:scale-95 transition-transform"
                    style={{ backgroundColor: color }}
                  ></button>
                ))}
                <button onClick={() => setCurrentGuess(Array(puzzle.codeLength).fill(""))} className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xl pb-1">↺</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-4 ${victory ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-red-500/50 bg-red-950/20'}`}
          >
            {victory ? <Cpu className="w-10 h-10 text-cyan-400" /> : <ShieldAlert className="w-10 h-10 text-red-500" />}
            <h3 className={`text-xl font-display font-light ${victory ? 'text-cyan-400' : 'text-red-500'}`}>
              {victory ? 'CIPHER_BROKEN' : 'SECURITY_LOCKED'}
            </h3>
            
            <div className="flex gap-2">
                {puzzle.secretCode.map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20" style={{ backgroundColor: c }}></div>
                ))}
            </div>

            <p className="text-xs text-slate-400 font-mono">
              {victory ? 'Access granted. Routine terminated.' : 'Maximum retries reached. Module frozen.'}
            </p>
            {victory && (
              <button
                onClick={() => onComplete(100 + (puzzle.difficulty * 15))}
                className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg mt-2 tracking-widest text-xs uppercase"
              >
                Claim {100 + (puzzle.difficulty * 15)} XP
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
