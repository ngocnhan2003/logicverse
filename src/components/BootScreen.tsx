import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { soundEffects } from "../utils/audio";

interface BootScreenProps {
  onStart: () => void;
  highScore?: number;
}

/**
 * Arcade title / attract screen. This is the front door of the game:
 * a big neon marquee logo, a blinking "PRESS START" prompt and a fake
 * boot self-test ticker, all sitting on top of the animated game world.
 * Any key / tap / click drops the player into the cabinet.
 */
export default function BootScreen({ onStart, highScore = 1850 }: BootScreenProps) {
  const [credits] = useState(1);
  const [bootLines, setBootLines] = useState<string[]>([]);

  // Fake power-on self test so the screen feels like a booting cabinet
  useEffect(() => {
    const lines = [
      "LOGICVERSE ARCADE SYSTEM",
      "ROM CHECK ........ OK",
      "LOGIC ENGINE ..... OK",
      "PUZZLE BANK ...... 9 MODES",
      "AUDIO DSP ........ READY",
      "INSERT COIN TO PLAY",
    ];
    let i = 0;
    const id = setInterval(() => {
      setBootLines((prev) => (i < lines.length ? [...prev, lines[i++]] : prev));
      if (i >= lines.length) clearInterval(id);
    }, 230);
    return () => clearInterval(id);
  }, []);

  const handleStart = () => {
    soundEffects.playSuccess();
    onStart();
  };

  // Let the player start with keyboard too — proper arcade behaviour
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "brightness(3)" }}
      transition={{ duration: 0.35 }}
      onClick={handleStart}
      className="fixed inset-0 z-[9000] flex flex-col items-center justify-center px-6 cursor-pointer select-none overflow-hidden"
    >
      {/* travelling scanline sweep */}
      <div className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-sweep pointer-events-none" />

      {/* Top marquee tag */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 mb-8"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="font-pixel text-[8px] sm:text-[10px] text-cyan-300 tracking-[0.3em]">
          NEON LOGIC CABINET
        </span>
        <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
      </motion.div>

      {/* Giant arcade logo */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 12, delay: 0.15 }}
        className="text-center animate-bob"
      >
        <h1 className="font-pixel text-arcade-logo text-3xl sm:text-5xl lg:text-6xl leading-tight">
          LOGIC
        </h1>
        <h1 className="font-pixel text-arcade-logo text-3xl sm:text-5xl lg:text-6xl leading-tight mt-2">
          VERSE
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="font-pixel text-[7px] sm:text-[9px] text-pink-400 tracking-[0.35em] mt-5"
      >
        PUZZLE  ARCADE  ★  9  GAME  MODES
      </motion.p>

      {/* Blinking PRESS START prompt */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-12 text-center"
      >
        <p className="font-pixel text-base sm:text-2xl text-white animate-blink">
          ▶ PRESS START
        </p>
        <p className="font-pixel text-[7px] sm:text-[9px] text-slate-500 mt-3 tracking-widest">
          CLICK · TAP · ENTER
        </p>
      </motion.div>

      {/* Boot self-test ticker */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xs text-center">
        {bootLines.map((line, i) => (
          <p
            key={i}
            className={`font-mono text-[9px] tracking-wider ${
              line.includes("INSERT COIN") ? "text-amber-400 animate-pulse" : "text-emerald-400/70"
            }`}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Bottom HUD: credits + high score, like a real cabinet */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-between px-6 sm:px-10 font-pixel text-[7px] sm:text-[9px]">
        <span className="text-cyan-300">CREDIT {credits.toString().padStart(2, "0")}</span>
        <span className="text-amber-400">HI {highScore.toLocaleString()}</span>
        <span className="text-slate-500">© LOGICVERSE</span>
      </div>
    </motion.div>
  );
}
