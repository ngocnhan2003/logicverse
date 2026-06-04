import { useState, useEffect } from "react";
import { Check, HelpCircle, RotateCcw, Cpu, LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { soundEffects } from "../utils/audio";

interface CircuitLogicGameProps {
  puzzle: {
    inputs: string[];
    initialInputValues: Record<string, number>;
    gates: { id: string; type: "AND" | "OR" | "XOR" | "NOT"; inputs: string[] }[];
    targetOutputValue: number; // 0 or 1
    difficulty: number;
    targetOutputs?: Record<string, number>; // Multiple target outputs for higher difficulty
  };
  onComplete: (xpEarned: number) => void;
  onExit: () => void;
}

export default function CircuitLogicGame({ puzzle, onComplete, onExit }: CircuitLogicGameProps) {
  const { inputs, initialInputValues, gates, targetOutputValue, difficulty } = puzzle;

  const [inputStates, setInputStates] = useState<Record<string, number>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [moves, setMoves] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);

  // Initialize inputs on load
  useEffect(() => {
    restartGame();
    setHasWon(false);
    setMoves(0);
  }, [puzzle]);

  // Operational Clock
  useEffect(() => {
    if (hasWon) return;
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [hasWon]);

  const restartGame = () => {
    setInputStates({ ...initialInputValues });
    setMoves(0);
    setHasWon(false);
    soundEffects.playSelect();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const toggleInput = (name: string) => {
    if (hasWon) return;
    soundEffects.playTick();
    setInputStates((prev) => ({
      ...prev,
      [name]: prev[name] === 1 ? 0 : 1,
    }));
    setMoves((m) => m + 1);
  };

  // Evaluate the entire logical flow dynamically
  const evaluateSignals = () => {
    const values: Record<string, number> = { ...inputStates };

    // Run evaluations sequentially by dependency resolving
    // Since we have a simple DAG, let's evaluate gates repeatedly until all resolved, or sequential index evaluation
    const maxIterations = 10;
    for (let iter = 0; iter < maxIterations; iter++) {
      gates.forEach((gate) => {
        const canEvaluate = gate.inputs.every((inp) => values[inp] !== undefined);
        if (canEvaluate) {
          const inputVals = gate.inputs.map((inp) => values[inp]);
          if (gate.type === "AND") {
            values[gate.id] = inputVals.every((v) => v === 1) ? 1 : 0;
          } else if (gate.type === "OR") {
            values[gate.id] = inputVals.some((v) => v === 1) ? 1 : 0;
          } else if (gate.type === "XOR") {
            values[gate.id] = inputVals[0] !== inputVals[1] ? 1 : 0;
          } else if (gate.type === "NOT") {
            values[gate.id] = inputVals[0] === 0 ? 1 : 0;
          }
        }
      });
    }

    return values;
  };

  const currentSignals = evaluateSignals();
  
  // Output gate is usually the last gate or labeled "OUT" or any specific gate identifier
  const outputId = gates[gates.length - 1]?.id || "OUT";
  const currentOutputValue = currentSignals[outputId] ?? 0;

  // Let's do double-check target outputs for depth
  // The goal is met if output values match the target output value
  useEffect(() => {
    if (Object.keys(inputStates).length === 0) return;
    
    const matched = currentOutputValue === targetOutputValue;
    if (matched && !hasWon) {
      setHasWon(true);
      const xpEarned = 100 + difficulty * 25;
      soundEffects.playSuccess();
      setTimeout(() => {
        onComplete(xpEarned);
      }, 1400);
    }
  }, [inputStates, currentOutputValue]);

  return (
    <div className="bg-[#0b0c10] border border-amber-500/10 rounded-2xl p-5 md:p-7 relative overflow-hidden shadow-neon-amber max-w-2xl mx-auto w-full">
      {/* Mesh lattice */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Header Info */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            CIRCUIT DIAGNOSING GATEWAY
          </span>
          <h2 className="text-xl font-light text-slate-100 mt-1 font-display">
            Gate Network <span className="font-bold text-amber-500">Calibration</span>
          </h2>
        </div>

        <div className="flex gap-2.5 font-mono">
          <button
            onClick={() => setShowRuleModal(true)}
            className="p-1.5 rounded bg-white/5 border border-white/5 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Read Rules"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={restartGame}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-3 gap-3 mb-6 relative z-10 text-center font-mono">
        <div className="bg-slate-900/50 rounded-xl p-2.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Clock Signal</div>
          <div className="text-sm font-bold text-slate-200 mt-0.5">{formatTime(timeElapsed)}</div>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-2.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Toggles Committed</div>
          <div className="text-sm font-bold text-slate-200 mt-0.5">{moves}</div>
        </div>
        <div className="bg-[#241a0f] rounded-xl p-2.5 border border-amber-500/10">
          <div className="text-[9px] text-amber-500 uppercase tracking-wider">XP Yield</div>
          <div className="text-sm font-bold text-amber-400 mt-0.5">+{100 + difficulty * 25} XP</div>
        </div>
      </div>

      {/* Main Schematic Body */}
      <div className="bg-[#12141c] p-6 rounded-2xl border border-white/10 relative z-10 mb-6">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-4 border-b border-white/[0.04] pb-1.5 flex items-center justify-between">
          <span>Live Schematic Display</span>
          <span className="text-amber-500 animate-pulse font-bold">● ACTIVE LINK</span>
        </div>

        {/* Custom interactive circuit schematic layout */}
        <div className="flex flex-col gap-6 select-none font-mono text-xs text-slate-300">
          {/* Section 1: Inputs */}
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-l-2 border-amber-500 pl-1.5 mb-1">
              Interactive Input Registers
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {inputs.map((name) => {
                const val = inputStates[name] ?? 0;
                return (
                  <button
                    key={name}
                    onClick={() => toggleInput(name)}
                    disabled={hasWon}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none active:scale-95
                      ${val === 1 
                        ? "bg-amber-550 bg-amber-500/10 border-amber-550 text-amber-450 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]" 
                        : "bg-slate-900/80 border-white/5 text-slate-400 hover:border-white/15"
                      }
                    `}
                  >
                    <span className="font-bold text-sm tracking-wider">PIN {name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 1 ? "bg-amber-400/20 text-amber-400 animate-pulse" : "bg-slate-950 text-slate-600"}`}>
                      {val}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Logic Gates Diagram */}
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-slate-405 font-bold uppercase tracking-widest border-l-2 border-slate-500 pl-1.5 mb-1" style={{ color: '#ec4899' }}>
              Logic Gates Nodes
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {gates.map((gate, idx) => {
                const isOutputGate = gate.id === outputId;
                const evaluatedVal = currentSignals[gate.id] ?? 0;
                const gateInputsValString = gate.inputs.map(i => `${i}:${currentSignals[i] ?? 0}`).join(", ");
                
                return (
                  <div 
                    key={gate.id} 
                    className={`p-3.5 rounded-xl border flex flex-col justify-between h-28 relative
                      ${isOutputGate 
                        ? "bg-gradient-to-br from-purple-950/10 to-slate-900/80 border-purple-500/30" 
                        : "bg-slate-900/40 border-white/5"
                      }
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500">GATE ID: {gate.id}</span>
                        <div className="text-sm font-bold text-slate-200 mt-0.5 flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-purple-400 inline" />
                          <span>{gate.type} GATE</span>
                        </div>
                      </div>
                      
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${evaluatedVal === 1 ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-950 text-slate-600"}`}>
                        Y: {evaluatedVal}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-2 border-t border-white/[0.03] pt-2">
                      <span className="uppercase text-[9px] tracking-widest text-[#64748b]">Inputs:</span> {gateInputsValString}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Targeted Calibration Output */}
          <div className="border-t border-white/[0.04] pt-4.5 mt-2 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="bg-[#1f2029] p-3 rounded-xl border border-white/10 text-center w-24">
                <span className="text-[8px] text-slate-500 block uppercase tracking-wider mb-1">Signal Out</span>
                <span className={`text-xl font-bold font-mono ${currentOutputValue === targetOutputValue ? "text-emerald-400 drop-shadow-md animate-pulse" : "text-amber-500"}`}>
                  {currentOutputValue}
                </span>
              </div>
              
              <div className="text-center text-slate-505" style={{ color: '#64748b' }}>➔</div>

              <div className="bg-[#1b2b25]/50 p-3 rounded-xl border border-emerald-500/25 text-center w-24">
                <span className="text-[8px] text-slate-500 block uppercase tracking-wider mb-1">Target Key</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {targetOutputValue}
                </span>
              </div>
            </div>

            <div className="w-full sm:w-auto text-right font-sans text-xs">
              {currentOutputValue === targetOutputValue ? (
                <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-900/10 border border-emerald-800/30 px-3.5 py-2.5 rounded-xl font-semibold">
                  <Check className="w-4 h-4 animate-bounce" />
                  <span>Calibration Matches! Locked.</span>
                </div>
              ) : (
                <div className="text-amber-450 border border-amber-500/10 bg-amber-950/10 px-3.5 py-2.5 rounded-xl" style={{ color: '#f59e0b' }}>
                  ⚠️ Signals out of bounds. Recalibrate buttons...
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Directives */}
      <div className="bg-[#15171C]/50 border border-white/5 rounded-xl p-3 text-xs text-slate-400 mt-6 font-sans">
        <p className="font-semibold text-slate-300 mb-0.5">Instruction Set:</p>
        <p>Analyze how inputs sequence through the intermediate logical processing nodes (AND, OR, XOR). Change the togglable PIN inputs so the output terminal matches the designated secure target signal.</p>
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
              className="bg-[#161a22] border border-amber-500/30 rounded-2xl p-6 max-w-md w-full relative"
            >
              <h3 className="text-lg font-bold text-amber-500 mb-2 font-display">Gate Control Calibration Rules</h3>
              <div className="text-sm text-slate-300 space-y-3 font-sans leading-relaxed">
                <p>
                  You are auditing a digital logic hardware board. Each logic gate computes a logical operation on its inputs and outputs a binary value:
                </p>
                <p>
                  - **AND Gate**: Outputs `1` only if all input lines are `1`.
                </p>
                <p>
                  - **OR Gate**: Outputs `1` if at least one input line is `1`.
                </p>
                <p>
                  - **XOR Gate**: Outputs `1` if input signals differ (e.g., `1` and `0` values).
                </p>
                <p>
                  - **Objective**: Match the output frequency key on the terminal screen by clicking and toggling PIN inputs.
                </p>
              </div>
              <button
                onClick={() => {
                  soundEffects.playSelect();
                  setShowRuleModal(false);
                }}
                className="mt-6 w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold font-mono rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                COMPILE AND TEST SYSTEM
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete Overlay */}
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
              <h3 className="text-amber-500 text-xl font-bold uppercase tracking-widest animate-bounce">
                CALIBRATED!
              </h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Hardware signals matched target signatures. Gate networks fully consolidated in <span className="text-slate-200 mt-1">{moves} actions</span> under <span className="text-slate-200">{formatTime(timeElapsed)}</span>.
              </p>
              
              <div className="mt-5 border border-amber-500/20 bg-amber-950/20 px-4 py-1.5 rounded text-amber-500 text-xs font-black">
                +{100 + difficulty * 25} XP TRANSMITTED
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-3 animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-t-amber-500 border-slate-700 rounded-full animate-spin" />
                <span>Consolidating database ledger...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
