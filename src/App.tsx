import { useState, useEffect } from "react";
import {
  Trophy,
  Zap,
  Sparkles,
  Play,
  Flame,
  User,
  Coins,
  Star,
  Settings,
  ShoppingBag,
  Cpu,
  RefreshCw,
  Edit2,
  CheckCircle2,
  Compass,
  AlertTriangle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import {
  GameType,
  PlayerProfile,
  LeaderboardEntry,
  ActivePuzzle,
} from "./types";

import SudokuGame from "./components/SudokuGame";
import RuleDiscoveryGame from "./components/RuleDiscoveryGame";
import BinaryPuzzleGame from "./components/BinaryPuzzleGame";
import LightsOutGame from "./components/LightsOutGame";
import CircuitLogicGame from "./components/CircuitLogicGame";
import MemoryMatrixGame from "./components/MemoryMatrixGame";
import CodebreakerGame from "./components/CodebreakerGame";
import ColorFloodGame from "./components/ColorFloodGame";
import SlidingPuzzleGame from "./components/SlidingPuzzleGame";
import BootScreen from "./components/BootScreen";
import { soundEffects } from "./utils/audio";

// Default seed player profile
const DEFAULT_PROFILE: PlayerProfile = {
  username: "MindExplorer",
  xp: 45,
  level: 1,
  coins: 120,
  stars: 4,
  completedCount: 6,
  streakDays: 3,
  lastPlayedDate: null,
  unlockedCategories: ["sudoku", "rule_discovery", "binary_puzzle", "lights_out", "circuit_logic", "memory_matrix", "codebreaker", "color_flood", "sliding_puzzle"],
};

// Initial leaderboard simulation
const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: "AlphaSolve", xp: 1850, level: 8 },
  { rank: 2, username: "LogicGrandmaster", xp: 1420, level: 6 },
  { rank: 3, username: "SudokuDiva", xp: 980, level: 4 },
  { rank: 4, username: "MindExplorer", xp: 145, level: 1, isCurrentUser: true },
  { rank: 5, username: "BinaryBeast", xp: 95, level: 1 },
];

export default function App() {
  // Tab/Screen layout state: "dashboard" | "daily" | "generator" | "leaderboard" | "premium"
  const [activeTab, setActiveTab] = useState<"dashboard" | "daily" | "generator" | "leaderboard" | "premium">("dashboard");
  const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  
  // Arcade boot / attract screen: the cabinet shows a "PRESS START" title
  // before dropping the player into the game proper.
  const [booted, setBooted] = useState(false);

  // Custom game cabinet-focused states
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [currentBadge, setCurrentBadge] = useState<string>("Logic Apprentice");
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(["Logic Apprentice"]);
  const [lootboxOpening, setLootboxOpening] = useState(false);
  const [lootboxReward, setLootboxReward] = useState<string | null>(null);

  // Game state
  const [activePlay, setActivePlay] = useState<ActivePuzzle | null>(null);
  const [isForging, setIsForging] = useState(false);
  const [forgeStepMessage, setForgeStepMessage] = useState("");
  const [forgeError, setForgeError] = useState<string | null>(null);

  // Generator Config state
  const [genCategory, setGenCategory] = useState<GameType>("rule_discovery");
  const [genDifficulty, setGenDifficulty] = useState<number>(5);

  // Daily Challenge status
  const [dailyCompleted, setDailyCompleted] = useState<{ [key: string]: boolean }>({
    sudoku: false,
    rule_discovery: false,
    binary_puzzle: false,
  });

  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load profile from localStorage on boot
  useEffect(() => {
    const saved = localStorage.getItem("logicverse_profile_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        setTempUsername(parsed.username);
        
        // Sync simulator user score
        setLeaderboard((prev) =>
          prev.map((entry) =>
            entry.isCurrentUser
              ? { ...entry, username: parsed.username, xp: parsed.xp, level: parsed.level }
              : entry
          )
        );
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    } else {
      setTempUsername(DEFAULT_PROFILE.username);
    }
    
    // Load badges and title achievements
    const savedBadges = localStorage.getItem("logicverse_unlocked_badges");
    if (savedBadges) {
      try {
        setUnlockedBadges(JSON.parse(savedBadges));
      } catch (e) {}
    }
    const savedBadge = localStorage.getItem("logicverse_current_badge");
    if (savedBadge) {
      setCurrentBadge(savedBadge);
    }

    // Load cabinet settings
    const savedSound = localStorage.getItem("logicverse_sound_enabled");
    if (savedSound !== null) {
      const isEnabled = savedSound === "true";
      setSoundEnabled(isEnabled);
      soundEffects.setEnabled(isEnabled);
    } else {
      soundEffects.setEnabled(true);
    }

    const savedCrt = localStorage.getItem("logicverse_crt_enabled");
    if (savedCrt !== null) {
      setCrtEnabled(savedCrt === "true");
    } else {
      setCrtEnabled(true); // cabinet ships with the CRT tube glow on for max arcade feel
    }
    
    const savedDaily = localStorage.getItem("logicverse_daily_challenge");
    if (savedDaily) {
      try {
        setDailyCompleted(JSON.parse(savedDaily));
      } catch (e) {}
    }
  }, []);

  // Save profile helper to disk
  const saveProfile = (newProfile: PlayerProfile) => {
    setProfile(newProfile);
    localStorage.setItem("logicverse_profile_data", JSON.stringify(newProfile));
    
    // Sync leaderboard ranking scores
    setLeaderboard((prev) => {
      const updated = prev.map((entry) =>
        entry.isCurrentUser
          ? { ...entry, username: newProfile.username, xp: newProfile.xp, level: newProfile.level }
          : entry
      );
      // Re-sort board by XP
      return [...updated].sort((a, b) => b.xp - a.xp).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    });
  };

  // Tab switching helper with sound feedback
  const selectTab = (tab: "dashboard" | "daily" | "generator" | "leaderboard" | "premium") => {
    setActiveTab(tab);
    soundEffects.playSelect();
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    soundEffects.setEnabled(nextVal);
    localStorage.setItem("logicverse_sound_enabled", String(nextVal));
    soundEffects.playSelect();
  };

  const toggleCrt = () => {
    const nextVal = !crtEnabled;
    setCrtEnabled(nextVal);
    localStorage.setItem("logicverse_crt_enabled", String(nextVal));
    soundEffects.playSelect();
  };

  // Profile Username Edit handler
  const handleSaveUsername = () => {
    if (tempUsername.trim().length > 0) {
      saveProfile({ ...profile, username: tempUsername.trim() });
      setIsEditingUsername(false);
      soundEffects.playSuccess();
    }
  };

  // 🎰 Gacha Lootbox station logic
  const handleOpenLootbox = () => {
    soundEffects.playForge();
    setLootboxOpening(true);

    // After 1800ms of gacha animation, award a title badge!
    setTimeout(() => {
      const titles = [
        "Quantum Seeker",
        "Binary Ninja",
        "Paradox Weaver",
        "Algorithm Sovereign",
        "Silicon Oracle",
        "GigaBrain",
        "Logic Demigod",
        "Infinite Compiler",
        "Boolean Architect",
        "Recursion Master",
        "Cybernetic Sage",
        "Neural Architect",
      ];
      // select one that has not been unlocked if possible, or fallback to any random one
      const lockedBadges = titles.filter(t => !unlockedBadges.includes(t));
      const chosenBadge = lockedBadges.length > 0 
        ? lockedBadges[Math.floor(Math.random() * lockedBadges.length)] 
        : titles[Math.floor(Math.random() * titles.length)];

      const nextBadges = [...unlockedBadges];
      if (!nextBadges.includes(chosenBadge)) {
        nextBadges.push(chosenBadge);
      }
      setUnlockedBadges(nextBadges);
      setCurrentBadge(chosenBadge);
      setLootboxOpening(false);
      setLootboxReward(chosenBadge);

      localStorage.setItem("logicverse_unlocked_badges", JSON.stringify(nextBadges));
      localStorage.setItem("logicverse_current_badge", chosenBadge);

      soundEffects.playSuccess();
    }, 1800);
  };

  // Progression logic: Handles completing logical tests
  const handleGameComplete = (xpEarned: number) => {
    soundEffects.playSuccess();
    const nextXP = profile.xp + xpEarned;
    const currentMaxXP = profile.level * 100;
    let newLevel = profile.level;
    let remainingXP = nextXP;

    if (nextXP >= currentMaxXP) {
      newLevel += 1;
      remainingXP = nextXP - currentMaxXP;
    }

    const updatedProfile: PlayerProfile = {
      ...profile,
      xp: remainingXP,
      level: newLevel,
      coins: profile.coins + 15,
      stars: profile.stars + 1,
      completedCount: profile.completedCount + 1,
    };

    // If locked inside an active Daily Challenge, flag it as solved
    if (activeTab === "daily" && activePlay) {
      const nextDaily = { ...dailyCompleted, [activePlay.type]: true };
      setDailyCompleted(nextDaily);
      localStorage.setItem("logicverse_daily_challenge", JSON.stringify(nextDaily));

      // Extra bonus for doing all 3 challenges
      const allDone = Object.values(nextDaily).every(v => v === true);
      if (allDone) {
        updatedProfile.stars += 3;
        updatedProfile.coins += 50;
        updatedProfile.streakDays += 1;
      }
    }

    saveProfile(updatedProfile);
    setActivePlay(null);
  };

  // Dynamic Generator Flow using the full-stack server endpoints
  const forgePuzzle = async (type: GameType, difficulty: number, isLocal = false) => {
    soundEffects.playForge();
    setIsForging(true);
    setForgeError(null);

    const steps = [
      "Broadcasting constraints to LogicLab Engine...",
      "Analyzing player metrics & logical coefficients...",
      "Consulting procedural pattern heuristics...",
      "Generating high-fidelity puzzle board matrix...",
      "Running recursive determinism solvability checks...",
      "Polishing interface visual constraints..."
    ];

    // Simulate creative step-by-step puzzle forging process
    for (let i = 0; i < steps.length; i++) {
      setForgeStepMessage(steps[i]);
      await new Promise((r) => setTimeout(r, 250));
    }

    try {
      const response = await fetch("/api/generate-puzzle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, difficulty, isLocal }),
      });

      if (!response.ok) {
        throw new Error("Logic Studio Server error while constructing board.");
      }

      const rawData = await response.json();
      console.log("Constructed puzzle response:", rawData);

      // Structure appropriate play schemas
      const activeData: ActivePuzzle = {
        source: rawData.source || "local-engine",
        type: rawData.type || "sudoku",
        difficulty: typeof rawData.difficulty === "number" ? rawData.difficulty : 5,
        questionText: rawData.questionText || "Solve the puzzle matching the rules.",
      };

      if (rawData.type === "sudoku") {
        let initial = rawData.sudokuInitial || rawData.sudokuInitialCorrect || rawData.sudokuInitialCorrected || rawData.initial;
        let solution = rawData.sudokuSolution || rawData.sudokuSolutionCorrect || rawData.sudokuSolutionCorrected || rawData.solution;
        
        // Ensure initial and solution are nested arrays
        if (!Array.isArray(initial) || initial.length === 0 || !Array.isArray(initial[0])) {
          initial = [
            [0, 4, 2, 0],
            [2, 0, 0, 1],
            [4, 0, 0, 2],
            [0, 2, 1, 0]
          ];
        }
        if (!Array.isArray(solution) || solution.length === 0 || !Array.isArray(solution[0])) {
          solution = [
            [1, 4, 2, 3],
            [2, 3, 4, 1],
            [4, 1, 3, 2],
            [3, 2, 1, 4]
          ];
        }

        const size = initial.length === 6 ? 6 : 4;

        activeData.sudokuPuzzle = {
          sudokuSize: size,
          sudokuInitial: initial,
          sudokuSolution: solution,
          sudokuSpecialRuleType: rawData.sudokuSpecialRuleType || "classic",
          sudokuEvenCells: Array.isArray(rawData.sudokuEvenCells) ? rawData.sudokuEvenCells : [],
        };
      } else if (rawData.type === "binary_puzzle") {
        let initial = rawData.binaryInitial || rawData.initial;
        let solution = rawData.binarySolution || rawData.solution;

        if (!Array.isArray(initial) || initial.length === 0 || !Array.isArray(initial[0])) {
          initial = [
            [0, 1, -1, -1, 0, 1],
            [1, -1, 1, -1, 1, 0],
            [-1, 1, 0, 1, -1, 1],
            [1, 0, -1, -1, 1, 0],
            [0, 1, 1, 0, -1, 1],
            [1, -1, 0, 1, 1, -1]
          ];
        }
        if (!Array.isArray(solution) || solution.length === 0 || !Array.isArray(solution[0])) {
          solution = [
            [0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0]
          ];
        }

        activeData.binaryPuzzle = {
          binarySize: initial.length === 6 ? 6 : 4,
          binaryInitial: initial,
          binarySolution: solution,
        };
      } else if (rawData.type === "lights_out") {
        const puzzleData = rawData.lightsOutPuzzle || rawData.puzzle || rawData;
        activeData.lightsOutPuzzle = {
          gridSize: puzzleData.gridSize || 5,
          initialGrid: puzzleData.initialGrid || Array(5).fill(0).map(() => Array(5).fill(0).map(() => Math.random() > 0.5 ? 1 : 0)),
        };
      } else if (rawData.type === "circuit_logic") {
        const puzzleData = rawData.circuitLogicPuzzle || rawData.puzzle || rawData;
        activeData.circuitLogicPuzzle = {
          inputs: puzzleData.inputs || ["A", "B", "C", "D"],
          initialInputValues: puzzleData.initialInputValues || { A: 0, B: 0, C: 0, D: 0 },
          gates: puzzleData.gates || [
            { id: "G1", type: "XOR", inputs: ["A", "B"] },
            { id: "G2", type: "OR", inputs: ["C", "D"] },
            { id: "OUT", type: "AND", inputs: ["G1", "G2"] }
          ],
          targetOutputValue: typeof puzzleData.targetOutputValue === "number" ? puzzleData.targetOutputValue : 1,
        };
      } else if (rawData.type === "memory_matrix") {
        const puzzleData = rawData.memoryMatrixPuzzle || rawData.puzzle || rawData;
        activeData.memoryMatrixPuzzle = {
          gridSize: puzzleData.gridSize || 4,
          sequence: puzzleData.sequence || [{ r: 0, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 2 }, { r: 3, c: 3 }],
        };
      } else if (rawData.type === "codebreaker") {
        const puzzleData = rawData.codebreakerPuzzle || rawData.puzzle || rawData;
        activeData.codebreakerPuzzle = {
          codeLength: puzzleData.codeLength || 4,
          maxGuesses: puzzleData.maxGuesses || 8,
          availableColors: puzzleData.availableColors || ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"],
          secretCode: puzzleData.secretCode || ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"],
        };
      } else if (rawData.type === "color_flood") {
        const puzzleData = rawData.colorFloodPuzzle || rawData.puzzle || rawData;
        activeData.colorFloodPuzzle = {
          gridSize: puzzleData.gridSize || 8,
          maxMoves: puzzleData.maxMoves || 15,
          availableColors: puzzleData.availableColors || ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
          initialGrid: puzzleData.initialGrid || Array(8).fill(0).map(() => Array(8).fill("#ef4444")),
        };
      } else if (rawData.type === "sliding_puzzle") {
        const puzzleData = rawData.slidingPuzzle || rawData.puzzle || rawData;
        activeData.slidingPuzzle = {
          gridSize: puzzleData.gridSize || 3,
          initialGrid: puzzleData.initialGrid || [[1, 2, 3], [4, 5, 6], [7, 8, 0]],
        };
      } else {
        // rule_discovery
        const options = Array.isArray(rawData.ruleOptions) ? rawData.ruleOptions : ["A", "B", "C", "D"];
        activeData.rulePuzzle = {
          ruleQuestion: rawData.ruleQuestion || "Analyze pattern: 1, 3, 5, ?",
          ruleAnswer: rawData.ruleAnswer || "7",
          ruleOptions: options.length >= 4 ? options : ["5", "7", "9", "11"],
          ruleExplanation: rawData.ruleExplanation || "Simple arithmetic sequence.",
        };
      }

      setActivePlay(activeData);
    } catch (err: any) {
      console.error(err);
      setForgeError(err.message || "Something went wrong while designing your puzzle.");
    } finally {
      setIsForging(false);
    }
  };

  // Prelaunch clean daily challenge tracker
  const handleResetDaily = () => {
    const freshClaims = { sudoku: false, rule_discovery: false, binary_puzzle: false };
    setDailyCompleted(freshClaims);
    localStorage.setItem("logicverse_daily_challenge", JSON.stringify(freshClaims));
  };

  return (
    <div className="min-h-screen lg:h-screen w-full text-slate-200 flex flex-col font-sans selection:bg-cyan-500 selection:text-black relative overflow-x-hidden overflow-y-auto lg:overflow-hidden py-2.5 px-3 sm:py-3 sm:px-4 md:px-6">

      {/* 🌌 Animated arcade game-world backdrop (neon grid floor + starfield) */}
      <div className="game-world" />

      {/* 🕹️ Arcade title / attract screen shown until the player presses start */}
      <AnimatePresence>
        {!booted && (
          <BootScreen
            onStart={() => {
              setBooted(true);
              soundEffects.playSelect();
            }}
            highScore={Math.max(1850, profile.xp + profile.level * 100)}
          />
        )}
      </AnimatePresence>

      {/* 📟 Retro Scanline CRT Overlay */}
      {crtEnabled && <div className="crt-overlay scanline-flicker" />}

      {/* Background Ambient Glow Elements */}
      <div className="absolute top-[-10%] left-[-15%] w-[500px] h-[500px] rounded-full bg-cyan-950/10 filter blur-[100px] ambient-glow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[600px] h-[600px] rounded-full bg-purple-950/5 filter blur-[120px] ambient-glow pointer-events-none" style={{ animationDelay: "4s" }} />

      <div className="w-full max-w-7xl mx-auto flex flex-col flex-grow lg:h-full lg:min-h-0">
        {/* Header Navigation exactly matching retro arcade cabinet theme */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-cyan-500/10 pb-2 mb-2.5 lg:pb-3 lg:mb-4 gap-3 lg:gap-2 w-full flex-shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-cyan-400 font-bold">★ LOGICVERSE RETRO GAME LAB ★</span>
            </div>
            <h1 className="font-pixel text-arcade-logo text-sm sm:text-lg lg:text-2xl tracking-tight">
              LOGIC<span className="text-cyan-300 animate-pulse">VERSE</span>
            </h1>
            <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-pink-500 uppercase font-bold mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-pink-500 animate-pulse"></span>
              CABINET INGRESS • READY PLAYER ONE
            </span>
          </div>
          
          <div className="flex flex-wrap gap-3 sm:gap-5 lg:gap-6 items-center justify-between lg:justify-end w-full lg:w-auto">
            {/* 📟 Game Console toggles (Sound/CRT) in header */}
            <div className="flex gap-1.5 sm:gap-2 items-center bg-white/[0.02] border border-white/5 p-1 rounded-lg">
              <button 
                onClick={toggleSound} 
                className={`px-2 py-1 rounded border text-[9px] sm:text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95
                  ${soundEnabled 
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-neon-cyan" 
                    : "bg-white/5 border-white/10 text-slate-500"}`}
              >
                {soundEnabled ? <Volume2 className="w-3 h-3 animate-pulse" /> : <VolumeX className="w-3 h-3" />}
                SOUND
              </button>
              <button 
                onClick={toggleCrt} 
                className={`px-2 py-1 rounded border text-[9px] sm:text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95
                  ${crtEnabled 
                    ? "bg-pink-500/10 border-pink-500/30 text-pink-400 shadow-neon-pink" 
                    : "bg-white/5 border-white/10 text-slate-500"}`}
              >
                <span>📟</span> CRT
              </button>
            </div>

            <div className="text-right">
              <p className="text-[8px] sm:text-[10px] uppercase tracking-widest text-[#64748b] mb-0.5">Experience Level</p>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-sm sm:text-base lg:text-xl font-mono text-white">LVL {profile.level}</span>
                <div className="w-20 sm:w-28 lg:w-32 h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden p-[1px] border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${Math.min(100, Math.max(0, (profile.xp / (profile.level * 100)) * 100))}%` }}
                  />
                </div>
                <span className="text-[8px] sm:text-[10px] font-mono text-cyan-400 opacity-90">{profile.xp}/{profile.level * 100} XP</span>
              </div>
            </div>

            <div className="flex gap-4 sm:gap-6 lg:gap-8 items-center">
              {profile.streakDays > 0 && (
                <div className="text-right">
                  <p className="text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-505 mb-0.5" style={{ color: '#64748b' }}>Active Streak</p>
                  <p className="text-sm sm:text-base lg:text-xl font-mono text-amber-500 flex items-center gap-1 justify-end">
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 animate-pulse inline" />
                    {profile.streakDays} Days
                  </p>
                </div>
              )}
              
              <div className="text-right">
                <p className="text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-505 mb-0.5" style={{ color: '#64748b' }}>Stars</p>
                <p className="text-sm sm:text-base lg:text-xl font-mono text-purple-400 tracking-tighter flex items-center gap-1 justify-end">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 fill-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
                  {profile.stars}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-505 mb-0.5" style={{ color: '#64748b' }}>Credits</p>
                <p className="text-sm sm:text-base lg:text-xl font-mono text-white tracking-tighter flex items-center gap-1 justify-end">
                  <span className="text-cyan-400 text-xs sm:text-sm">¢</span>
                  {profile.coins}
                </p>
              </div>
            </div>

            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyan-500/5 cursor-pointer hover:border-cyan-400/50 transition-colors shadow-neon-cyan">
              <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 bg-cyan-400 rounded-full animate-ping"></div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Layout Body */}
        <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-start lg:min-h-0 overflow-visible lg:overflow-hidden">
          
          {/* Conditional Layout: Hide sidebar navigation if active workspace details are running so we have full screens mapping */}
          {!(activePlay || isForging) && (
            <nav className="col-span-1 lg:col-span-3 flex flex-col gap-2.5 sm:gap-3 lg:h-full lg:overflow-y-auto pr-1 overflow-visible pb-2 lg:pb-0">
              {/* Profile Heuristic Section */}
              <div className="bg-[#15171C] p-4 rounded-xl border border-cyan-500/15 shadow-neon-cyan relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-cyan-500/10 border-l border-b border-cyan-500/20 px-2 py-0.5 text-[7px] font-mono font-bold text-cyan-400 uppercase">
                  ACTIVE_SESS
                </div>
                <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-3">★ PLAYER_1 ARCHIVE ★</p>
                
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center relative overflow-hidden">
                    <User className="w-5 h-5 text-cyan-400" />
                    <div className="absolute bottom-0 w-full bg-cyan-500 text-[6px] font-mono text-center text-slate-950 font-black">
                      P1
                    </div>
                  </div>
                  <div className="flex-grow font-mono">
                    {isEditingUsername ? (
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={tempUsername}
                          onChange={(e) => setTempUsername(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-md px-2 py-0.5 text-xs text-slate-100 max-w-[100px] focus:outline-none"
                        />
                        <button 
                          onClick={handleSaveUsername}
                          className="bg-cyan-500 hover:bg-cyan-400 px-2 py-0.5 rounded text-[10px] font-bold text-slate-950 font-mono"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 group">
                        <h3 className="text-sm font-bold text-slate-100 hover:text-cyan-400 transition-all">
                          {profile.username}
                        </h3>
                        <button 
                          onClick={() => {
                            setIsEditingUsername(true);
                            soundEffects.playSelect();
                          }}
                          className="opacity-40 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-white"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                    {/* Glowing active gamer title badge */}
                    <div className="inline-block mt-0.5 px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/30">
                      <p className="text-[8px] font-mono text-pink-400 font-black uppercase tracking-wider animate-pulse">
                        {currentBadge}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Score Stats details */}
                <div className="grid grid-cols-2 gap-2 font-mono text-center">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="text-sm font-bold text-cyan-400">{profile.completedCount}</div>
                    <div className="text-[8px] text-slate-500 uppercase tracking-widest">Solved Maps</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="text-sm font-bold text-amber-500">{profile.streakDays}d</div>
                    <div className="text-[8px] text-slate-500 uppercase tracking-widest">Day Streak</div>
                  </div>
                </div>
              </div>

              {/* Sidebar Navigation exactly styled as core modules */}
              <div className="bg-[#15171C] p-4 rounded-xl border border-white/10 shadow-md">
                <p className="text-[10px] uppercase tracking-widest text-[#06b6d4] font-bold mb-4">🕹️ GAME MODES</p>
                <ul className="space-y-1">
                  
                  <li 
                    onClick={() => selectTab("dashboard")}
                    className={`flex justify-between items-center p-2.5 rounded-lg border transition-all cursor-pointer select-none
                      ${activeTab === "dashboard" 
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-neon-cyan" 
                        : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
                  >
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Compass className="w-4 h-4" />
                      Puzzle Studio
                    </span>
                    <span className="text-[10px] font-mono opacity-60">03</span>
                  </li>

                  <li 
                    onClick={() => selectTab("daily")}
                    className={`flex justify-between items-center p-1.5 px-2 rounded-lg border transition-all cursor-pointer select-none
                      ${activeTab === "daily" 
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-neon-amber" 
                        : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
                  >
                    <span className="text-sm font-medium flex items-center gap-2">
                       <Flame className="w-4 h-4 text-amber-500" />
                      Daily Challenge
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-550" style={{ color: '#f59e0b' }}>
                      {Object.values(dailyCompleted).filter(Boolean).length}/3
                    </span>
                  </li>

                  <li 
                    onClick={() => selectTab("generator")}
                    className={`flex justify-between items-center p-1.5 px-2 rounded-lg border transition-all cursor-pointer select-none
                      ${activeTab === "generator" 
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-neon-cyan" 
                        : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
                  >
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      AI Lab Generator
                    </span>
                    <span className="text-[10px] font-mono opacity-60 text-cyan-400">FREE</span>
                  </li>

                  <li 
                    onClick={() => selectTab("leaderboard")}
                    className={`flex justify-between items-center p-1.5 px-2 rounded-lg border transition-all cursor-pointer select-none
                      ${activeTab === "leaderboard" 
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-neon-amber" 
                        : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
                  >
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-purple-400" />
                      Leaderboards
                    </span>
                    <span className="text-[10px] font-mono opacity-80 text-purple-400">GLOBAL</span>
                  </li>

                  <li 
                    onClick={() => selectTab("premium")}
                    className={`flex justify-between items-center p-1.5 px-2 rounded-lg border transition-all cursor-pointer select-none
                      ${activeTab === "premium" 
                        ? "bg-pink-500/10 text-pink-400 border-pink-500/30 shadow-neon-pink" 
                        : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
                  >
                    <span className="text-sm font-medium flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-pink-405" style={{ color: '#f43f5e' }} />
                      Upgrades (Free)
                    </span>
                    <span className="text-[10px] font-mono opacity-80 text-pink-400">FREE</span>
                  </li>
                </ul>
              </div>

              {/* Promo card exactly matching visual style */}
              <div className="mt-1 p-3 bg-gradient-to-br from-[#10192A] to-[#152e3c] rounded-2xl relative overflow-hidden border border-cyan-500/20 shadow-lg">
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-white/90 mb-1 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    UNLIMITED LOGIC FORGING
                  </p>
                  <p className="text-[9px] text-cyan-100 mb-2 opacity-75 leading-relaxed">
                    Get infinite mathematical and logic matrix structures dynamically configured for free.
                  </p>
                  <button 
                    onClick={() => setActiveTab("premium")}
                    className="w-full py-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-bold rounded-lg uppercase tracking-wider transition-all shadow-[0_4px_16px_rgba(6,182,212,0.15)] active:scale-95"
                  >
                    Access Free Upgrades
                  </button>
                </div>
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-cyan-400/10 rounded-full blur-2xl"></div>
              </div>
            </nav>
          )}

          {/* Right Section Content viewport */}
          <section className={`col-span-1 ${ (activePlay || isForging) ? 'lg:col-span-12 w-full max-w-4xl mx-auto' : 'lg:col-span-9 h-full flex flex-col min-h-0' } gap-3`}>
            
            <AnimatePresence mode="wait">
              
              {/* 1. Immersive Gaming Workspace viewport */}
              {activePlay ? (
                <motion.div
                  key="active_game_viewport"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full flex flex-col gap-2 pb-10 lg:pb-0"
                >
                  <div className="bg-[#15171C] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 shadow-lg">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[10px] font-bold tracking-widest text-[#06b6d4] uppercase bg-cyan-500/5 border border-cyan-500/20 px-2 py-0.5 rounded">
                        Engine: {activePlay.source}
                      </span>
                      <span className="text-xs text-slate-500">|</span>
                      <span className="text-[10px] uppercase font-bold text-amber-500">
                        Difficulty Coefficient: {activePlay.difficulty}/10
                      </span>
                    </div>
                    <button
                      onClick={() => setActivePlay(null)}
                      className="text-xs font-mono font-bold text-slate-400 hover:text-white bg-white/5 border border-white/5 hover:border-white/15 px-3 py-1 rounded-lg transition-colors ml-auto sm:ml-0"
                    >
                      ← Back to Studio Hub
                    </button>
                  </div>

                  {activePlay.type === "sudoku" && activePlay.sudokuPuzzle && (
                    <SudokuGame
                      puzzle={activePlay.sudokuPuzzle}
                      onComplete={handleGameComplete}
                      onExit={() => setActivePlay(null)}
                    />
                  )}

                  {activePlay.type === "rule_discovery" && activePlay.rulePuzzle && (
                    <RuleDiscoveryGame
                      puzzle={{
                        ...activePlay.rulePuzzle,
                        difficulty: activePlay.difficulty,
                        source: activePlay.source,
                      }}
                      onComplete={handleGameComplete}
                      onExit={() => setActivePlay(null)}
                    />
                  )}

                  {activePlay.type === "binary_puzzle" && activePlay.binaryPuzzle && (
                    <BinaryPuzzleGame
                      puzzle={{
                        ...activePlay.binaryPuzzle,
                        questionText: activePlay.questionText,
                        difficulty: activePlay.difficulty,
                      }}
                      onComplete={handleGameComplete}
                      onExit={() => setActivePlay(null)}
                    />
                  )}

                  {activePlay.type === "lights_out" && activePlay.lightsOutPuzzle && (
                    <LightsOutGame
                      puzzle={{
                        ...activePlay.lightsOutPuzzle,
                        difficulty: activePlay.difficulty,
                      }}
                      onComplete={handleGameComplete}
                      onExit={() => setActivePlay(null)}
                    />
                  )}

                  {activePlay.type === "circuit_logic" && activePlay.circuitLogicPuzzle && (
                    <CircuitLogicGame
                      puzzle={{
                        ...activePlay.circuitLogicPuzzle,
                        difficulty: activePlay.difficulty,
                      }}
                      onComplete={handleGameComplete}
                      onExit={() => setActivePlay(null)}
                    />
                  )}

                  {activePlay.type === "memory_matrix" && activePlay.memoryMatrixPuzzle && (
                    <MemoryMatrixGame
                      puzzle={{
                        ...activePlay.memoryMatrixPuzzle,
                        difficulty: activePlay.difficulty,
                      }}
                      onComplete={handleGameComplete}
                      onExit={() => setActivePlay(null)}
                    />
                  )}

                  {activePlay.type === "codebreaker" && activePlay.codebreakerPuzzle && (
                    <CodebreakerGame
                      puzzle={{
                        ...activePlay.codebreakerPuzzle,
                        difficulty: activePlay.difficulty,
                      }}
                      onComplete={handleGameComplete}
                      onExit={() => setActivePlay(null)}
                    />
                  )}

                  {activePlay.type === "color_flood" && activePlay.colorFloodPuzzle && (
                    <ColorFloodGame
                      puzzle={{
                        ...activePlay.colorFloodPuzzle,
                        difficulty: activePlay.difficulty,
                      }}
                      onComplete={handleGameComplete}
                      onExit={() => setActivePlay(null)}
                    />
                  )}

                  {activePlay.type === "sliding_puzzle" && activePlay.slidingPuzzle && (
                    <SlidingPuzzleGame
                      puzzle={{
                        ...activePlay.slidingPuzzle,
                        difficulty: activePlay.difficulty,
                      }}
                      onComplete={handleGameComplete}
                      onExit={() => setActivePlay(null)}
                    />
                  )}
                </motion.div>
              ) : isForging ? (
                
                /* 2. Loading Forging sandbox element */
                <motion.div
                  key="forging_screen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#15171C] border border-white/10 rounded-2xl p-12 text-center shadow-lg w-full max-w-lg mx-auto"
                >
                  <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-cyan-500 border-r-indigo-500 animate-spin" />
                    <Cpu className="w-8 h-8 text-cyan-400 stroke-[1.5]" />
                  </div>

                  <h3 className="text-xl font-light text-white mb-2 tracking-wide uppercase">Deducing Constraint Matrices</h3>
                  <p className="text-xs font-mono text-cyan-450 animate-pulse" style={{ color: '#06b6d4' }}>{forgeStepMessage}</p>
                  
                  <div className="mt-8 pt-4 border-t border-white/[0.04] text-[10px] font-mono text-slate-500 max-w-xs mx-auto">
                    Constructing secure, solvable arrays via live AI verification processes.
                  </div>
                </motion.div>
              ) : (
                
                /* 3. Standard screen components depending on tabs */
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-3 lg:h-full lg:overflow-y-auto overflow-visible pr-1 pb-4"
                >
                  {activeTab === "dashboard" && (
                    <>
                      {/* Daily Neural Convergence Banner exactly styled after template */}
                      <div className="relative bg-[#15171C] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group overflow-hidden shadow-neon-amber flex-shrink-0">
                        <div className="flex flex-col relative z-20">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-450 text-[9px] font-bold tracking-widest uppercase animate-pulse">
                              🎮 Active Streak: {profile.streakDays} Days
                            </span>
                          </div>
                          <h2 className="text-xl font-light text-slate-100 mb-1 font-display">Daily Neural Convergence</h2>
                          <p className="text-slate-400 text-xs max-w-lg leading-relaxed font-sans line-clamp-1">
                            Complete all challenges to protect your streaks and claim multipliers!
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-start md:items-end flex-shrink-0 relative z-20 font-mono">
                          <div className="text-xl font-mono text-cyan-400 mb-2 font-semibold">+350 XP BONUS</div>
                          <button
                            onClick={() => selectTab("daily")}
                            className="arcade-btn px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-450 text-slate-950 font-bold text-[10px] uppercase tracking-widest cursor-pointer"
                          >
                            Begin Trilogy
                          </button>
                        </div>
                        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-amber-500 to-yellow-500"></div>
                      </div>

                      {/* Game Card Grids with matching custom visual structures */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 flex-shrink-0">
                        
                        {/* Game Card 1 */}
                        <div 
                          onMouseEnter={() => soundEffects.playTick()}
                          className="bg-[#15171C] border border-white/10 p-3 rounded-2xl hover:border-cyan-500/50 hover:shadow-neon-cyan transition-all flex flex-col justify-between group h-full shadow-sm"
                        >
                          <div>
                            <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-2 border border-cyan-500/20">
                              <div className="grid grid-cols-2 gap-0.5">
                                <div className="w-1.5 h-1.5 bg-cyan-500 animate-pulse"></div>
                                <div className="w-1.5 h-1.5 bg-cyan-500/30"></div>
                                <div className="w-1.5 h-1.5 bg-cyan-500/30"></div>
                                <div className="w-1.5 h-1.5 bg-cyan-500 animate-pulse"></div>
                              </div>
                            </div>
                            <h3 className="text-white font-medium mb-1 text-sm group-hover:text-cyan-400 transition-colors font-display">Sudoku Matrix</h3>
                            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed line-clamp-2">Classic coordinate solver featuring arrow constraints and even/odd rules.</p>
                          </div>
                          
                          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.04] mt-auto">
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                              <span>PROG: {dailyCompleted.sudoku ? "100%" : "0%"}</span>
                              <div className="flex gap-0.5">
                                <div className={`w-1 h-1 ${dailyCompleted.sudoku ? "bg-cyan-500 animate-pulse" : "bg-slate-700"}`}></div>
                                <div className="w-1 h-1 bg-slate-700"></div>
                                <div className="w-1 h-1 bg-slate-700"></div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2.5 mt-1">
                              <button
                                onClick={() => forgePuzzle("sudoku", 4, true)}
                                className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono border border-white/5 transition-all text-center cursor-pointer"
                              >
                                Local (4x4)
                              </button>
                              <button
                                onClick={() => forgePuzzle("sudoku", 7)}
                                className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[11px] font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Cpu className="w-3 h-3 text-slate-950" />
                                AI (6x6)
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Game Card 2 */}
                        <div 
                          onMouseEnter={() => soundEffects.playTick()}
                          className="bg-[#15171C] border border-white/10 p-3 rounded-2xl hover:border-amber-500/50 hover:shadow-neon-amber transition-all flex flex-col justify-between group h-full shadow-sm"
                        >
                          <div>
                            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center mb-2 border border-amber-500/20">
                              <span className="text-amber-500 font-bold text-sm italic font-mono animate-bounce">?</span>
                            </div>
                            <h3 className="text-white font-medium mb-1 text-sm group-hover:text-amber-450 transition-colors font-display">Rule Discovery</h3>
                            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed font-sans line-clamp-2">Uncover mathematical sequences across logical chains.</p>
                          </div>
                          
                          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.04] mt-auto">
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                              <span>PROG: {dailyCompleted.rule_discovery ? "100%" : "0%"}</span>
                              <div className="flex gap-0.5">
                                <div className={`w-1 h-1 ${dailyCompleted.rule_discovery ? "bg-amber-550 animate-pulse" : "bg-slate-700"}`}></div>
                                <div className="w-1 h-1 bg-slate-700"></div>
                                <div className="w-1 h-1 bg-slate-700"></div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2.5 mt-1">
                              <button
                                onClick={() => forgePuzzle("rule_discovery", 4, true)}
                                className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono border border-white/5 transition-all text-center cursor-pointer"
                              >
                                Local Series
                              </button>
                              <button
                                onClick={() => forgePuzzle("rule_discovery", 5)}
                                className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-[11px] font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Cpu className="w-3 h-3 text-slate-950" />
                                AI Pattern
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Game Card 3 */}
                        <div 
                          onMouseEnter={() => soundEffects.playTick()}
                          className="bg-[#15171C] border border-white/10 p-3 rounded-2xl hover:border-pink-500/50 hover:shadow-neon-pink transition-all flex flex-col justify-between group h-full shadow-sm"
                        >
                          <div>
                            <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center mb-2 border border-pink-500/20">
                              <div className="flex flex-col gap-0.5 animate-pulse">
                                <div className="flex gap-0.5"><div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping"></div><div className="w-1.5 h-1.5 bg-slate-700 rounded-full font-mono font-bold"></div></div>
                                <div className="flex gap-0.5"><div className="w-1.5 h-1.5 bg-slate-700 rounded-full font-mono font-bold"></div><div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div></div>
                              </div>
                            </div>
                            <h3 className="text-white font-medium mb-1 text-sm group-hover:text-pink-400 transition-colors font-display">Boolean Binary</h3>
                            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed font-sans font-medium line-clamp-2">Fill 0 and 1 grids. Cross-reference constraints to target truths.</p>
                          </div>
                          
                          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.04] mt-auto">
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                              <span>PROG: {dailyCompleted.binary_puzzle ? "100%" : "0%"}</span>
                              <div className="flex gap-0.5">
                                <div className={`w-1 h-1 ${dailyCompleted.binary_puzzle ? "bg-pink-500 animate-pulse" : "bg-slate-700"}`}></div>
                                <div className="w-1 h-1 bg-slate-700"></div>
                                <div className="w-1 h-1 bg-slate-700"></div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2.5 mt-1">
                              <button
                                onClick={() => forgePuzzle("binary_puzzle", 4, true)}
                                className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono border border-white/5 transition-all text-center cursor-pointer"
                              >
                                Local (6x6)
                              </button>
                              <button
                                onClick={() => forgePuzzle("binary_puzzle", 6)}
                                className="flex-1 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-slate-950 text-[11px] font-bold shadow-[0_0_12px_rgba(244,63,94,0.3)] transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Cpu className="w-3 h-3 text-slate-950" />
                                AI Boolean
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Neural Fray Card 4 */}
                        <div 
                          onMouseEnter={() => soundEffects.playTick()}
                          className="bg-[#15171C] border border-white/10 p-3 rounded-2xl hover:border-cyan-500/50 hover:shadow-neon-cyan transition-all flex flex-col justify-between group h-full shadow-sm"
                        >
                          <div>
                            <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-2 border border-cyan-500/20">
                              <div className="grid grid-cols-3 gap-[1px] animate-pulse">
                                <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                                <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
                                <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                                <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
                                <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                                <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mb-1 text-[8px] font-mono">
                              <span className="tracking-widest text-cyan-400 uppercase bg-cyan-500/10 border border-cyan-500/25 px-1 py-0.5 rounded">Neural</span>
                              <span className="text-slate-500">READY</span>
                            </div>
                            <h3 className="text-white font-medium mb-1 text-sm group-hover:text-cyan-405 transition-colors font-display">Neural Fray Grid</h3>
                            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed font-sans line-clamp-2">Invert intersecting coordinates to disable and clear the background static charges.</p>
                          </div>
                          
                          <div className="flex flex-col gap-1 pt-2 border-t border-white/[0.04] mt-auto">
                            <div className="flex gap-2.5 mt-1">
                              <button
                                onClick={() => forgePuzzle("lights_out", 4, true)}
                                className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono border border-white/5 transition-all text-center cursor-pointer"
                              >
                                Decrypt Local
                              </button>
                              <button
                                onClick={() => forgePuzzle("lights_out", 6)}
                                className="flex-1 py-1.5 rounded-lg bg-cyan-650 hover:bg-cyan-555 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[11px] font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Cpu className="w-3 h-3 text-slate-950" />
                                AI Grid
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Memory Matrix Card 5 */}
                        <div 
                          onMouseEnter={() => soundEffects.playTick()}
                          className="bg-[#15171C] border border-white/10 p-3 rounded-2xl hover:border-pink-500/50 hover:shadow-neon-pink transition-all flex flex-col justify-between group h-full shadow-sm"
                        >
                          <div>
                            <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center mb-2 border border-pink-500/20">
                              <div className="w-3 h-3 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
                            </div>
                            <div className="flex items-center gap-1.5 mb-1 text-[8px] font-mono">
                              <span className="tracking-widest text-pink-400 uppercase bg-pink-500/10 border border-pink-500/25 px-1 py-0.5 rounded">Recall</span>
                              <span className="text-slate-500">COGNITIVE</span>
                            </div>
                            <h3 className="text-white font-medium mb-1 text-sm group-hover:text-pink-405 transition-colors font-display">Sequence Decoder</h3>
                            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed font-sans font-medium line-clamp-2">Replicate complex structural flashing grid sequences on memory cache boards.</p>
                          </div>
                          
                          <div className="flex flex-col gap-1 pt-2 border-t border-white/[0.04] mt-auto">
                            <div className="flex gap-2.5 mt-1">
                              <button
                                onClick={() => forgePuzzle("memory_matrix", 4, true)}
                                className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono border border-white/5 transition-all text-center cursor-pointer"
                              >
                                Retrace Local
                              </button>
                              <button
                                onClick={() => forgePuzzle("memory_matrix", 6)}
                                className="flex-1 py-1.5 rounded-lg bg-pink-650 hover:bg-pink-555 bg-pink-600 hover:bg-pink-500 text-slate-950 text-[11px] font-bold shadow-[0_0_12px_rgba(244,63,94,0.3)] transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Cpu className="w-3 h-3 text-slate-950" />
                                AI Trace
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Gate Network Card 6 */}
                        <div 
                          onMouseEnter={() => soundEffects.playTick()}
                          className="bg-[#15171C] border border-white/10 p-3 rounded-2xl hover:border-amber-500/50 hover:shadow-neon-amber transition-all flex flex-col justify-between group h-full shadow-sm"
                        >
                          <div>
                            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center mb-2 border border-amber-500/20">
                              <Cpu className="w-4 h-4 text-amber-500 animate-pulse" />
                            </div>
                            <div className="flex items-center gap-1.5 mb-1 text-[8px] font-mono">
                              <span className="tracking-widest text-amber-450 uppercase bg-amber-500/10 border border-amber-500/25 px-1 py-0.5 rounded">Silicon</span>
                              <span className="text-slate-500">HARDWARE</span>
                            </div>
                            <h3 className="text-white font-medium mb-1 text-sm group-hover:text-amber-455 transition-colors font-display">Gate Network Calibration</h3>
                            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed font-sans line-clamp-2">Toggle binary input registers to route signals through logic gates successfully.</p>
                          </div>
                          
                          <div className="flex flex-col gap-1 pt-2 border-t border-white/[0.04] mt-auto">
                            <div className="flex gap-2.5 mt-1">
                              <button
                                onClick={() => forgePuzzle("circuit_logic", 4, true)}
                                className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono border border-white/5 transition-all text-center cursor-pointer"
                              >
                                Match Local
                              </button>
                              <button
                                onClick={() => forgePuzzle("circuit_logic", 6)}
                                className="flex-1 py-1.5 rounded-lg bg-amber-650 hover:bg-amber-555 bg-amber-600 hover:bg-amber-500 text-slate-950 text-[11px] font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Cpu className="w-3 h-3 text-slate-950" />
                                AI Calibrate
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* 📦 Cognitive Lootbox Station */}
                      <div className="bg-gradient-to-br from-[#1b1226] to-[#0A0B0E] border border-pink-500/20 rounded-2xl p-4 relative overflow-hidden shadow-neon-pink mt-3 flex-shrink-0">
                        {lootboxOpening && (
                          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-flicker">
                            <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                              <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-pink-500 border-r-purple-500 animate-spin" />
                              <span className="text-3xl animate-bounce">🎁</span>
                            </div>
                            <h4 className="text-sm font-mono text-pink-400 font-bold uppercase tracking-widest animate-pulse">
                              Deducing Metadata Lootbox...
                            </h4>
                          </div>
                        )}

                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10 w-full">
                          <div className="flex-grow font-sans">
                            <div className="flex items-center gap-2 mb-2 font-mono">
                              <span className="text-[9px] font-bold text-pink-405 bg-pink-950/40 border border-pink-905 px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider" style={{ color: '#f43f5e', borderColor: '#f43f5e' }}>
                                ★ Gacha Forge ★
                              </span>
                              <span className="text-xs text-slate-505" style={{ color: '#64748b' }}>|</span>
                              <span className="text-[10px] text-pink-300">FORGE SPECIAL COLLECTIBLE TITLES</span>
                            </div>
                            <h2 className="text-xl font-light text-slate-100 mb-1.5 flex items-center gap-1.5 font-display">
                              Cognitive Title <span className="font-bold text-pink-500 animate-pulse">Lootbox</span>
                            </h2>
                            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                              Unlock specialized virtual caches completely <span className="text-pink-450 font-bold font-mono animate-pulse" style={{ color: '#ec4899' }}>FOR FREE!</span> Unlocks legendary title badges like <span className="text-pink-405 font-bold" style={{ color: '#f43f5e' }}>Quantum Seeker</span> or <span className="text-pink-405 font-bold" style={{ color: '#f43f5e' }}>Binary Ninja</span> to display on your player profile!
                            </p>
                            
                            {/* List unlocked badges */}
                            <div className="mt-3.5 flex flex-wrap gap-1.5 items-center">
                              <span className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider flex items-center mr-1">Unlocked:</span>
                              {unlockedBadges.map((badge, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setCurrentBadge(badge);
                                    localStorage.setItem("logicverse_current_badge", badge);
                                    soundEffects.playSelect();
                                  }}
                                  className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all select-none active:scale-95 cursor-pointer
                                    ${badge === currentBadge 
                                      ? "bg-pink-500/20 text-pink-450 border border-pink-500/40 shadow-neon-pink" 
                                      : "bg-white/5 text-slate-400 border border-transparent hover:border-slate-800 hover:text-slate-300"}`}
                                >
                                  {badge === currentBadge && "★ "} {badge}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-start lg:items-end flex-shrink-0 w-full lg:w-auto font-mono">
                            <div className="text-2xl font-mono text-pink-405 text-pink-400 font-bold mb-3 flex items-center gap-1.5 leading-none" style={{ color: '#ec4899' }}>
                              <span className="text-xs text-[#64748b] font-normal">COST:</span>
                              <span>FREE!</span>
                            </div>
                            <button
                              onClick={handleOpenLootbox}
                              className="arcade-btn w-full lg:w-auto px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                              🔓 Forge Lootbox
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Daily screen exactly styled as Sophisticated card */}
                  {activeTab === "daily" && (
                    <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 shadow-md max-w-xl mx-auto">
                      <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-12 h-12 rounded-full bg-amber-950/40 border border-amber-900/50 flex items-center justify-center mb-3">
                          <Flame className="w-6 h-6 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-light text-slate-100 uppercase tracking-tight">LogicVerse Daily Trilogy</h2>
                        <p className="text-slate-400 text-xs mt-1.5 max-w-sm leading-relaxed">
                          Complete all three sectors. Claim massive bonuses: <span className="text-amber-400 font-bold">+50 Coins, +3 Stars, Triple XP!</span>
                        </p>
                      </div>

                      <div className="flex flex-col gap-3.5 mb-6">
                        {/* Sudoku solver line */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                          <div>
                            <h4 className="font-bold text-sm text-slate-100">1. Sudoku Intelligent Sector</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Classic Coordinate Solver</p>
                          </div>
                          {dailyCompleted.sudoku ? (
                            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          ) : (
                            <button
                              onClick={() => forgePuzzle("sudoku", 5, true)}
                              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-mono uppercase tracking-widest transition-all hover:scale-102 shadow-[0_0_10px_rgba(217,119,6,0.2)]"
                            >
                              Launch
                            </button>
                          )}
                        </div>

                        {/* Pattern solver line */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                          <div>
                            <h4 className="font-bold text-sm text-slate-100">2. Linear Pattern Discovery</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Iterative Sequence Solver</p>
                          </div>
                          {dailyCompleted.rule_discovery ? (
                            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          ) : (
                            <button
                              onClick={() => forgePuzzle("rule_discovery", 4, true)}
                              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-mono uppercase tracking-widest transition-all hover:scale-102 shadow-[0_0_10px_rgba(217,119,6,0.2)]"
                            >
                              Launch
                            </button>
                          )}
                        </div>

                        {/* Binary solver line */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                          <div>
                            <h4 className="font-bold text-sm text-slate-100">3. Binary Boolean Matrix</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Constraint Logic Solver</p>
                          </div>
                          {dailyCompleted.binary_puzzle ? (
                            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          ) : (
                            <button
                              onClick={() => forgePuzzle("binary_puzzle", 5, true)}
                              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-mono uppercase tracking-widest transition-all hover:scale-102 shadow-[0_0_10px_rgba(217,119,6,0.2)]"
                            >
                              Launch
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex pt-4 border-t border-white/[0.04]">
                        <button
                          onClick={handleResetDaily}
                          className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-xs font-mono border border-white/5 transition-all text-center"
                        >
                          Reset Daily Status Array
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI Lab screen exactly styled as Sophisticated card */}
                  {activeTab === "generator" && (
                    <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 shadow-md max-w-xl mx-auto">
                      <div className="flex items-center gap-3.5 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex justify-center items-center">
                          <Sparkles className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-light text-slate-100 uppercase">Logic Matrix Forging Lab</h2>
                          <p className="text-xs text-slate-400 mt-1">Configure parameters to trigger high-complexity logical and arithmetic rules</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-5 mb-6">
                        <div>
                          <label className="block text-xs font-mono font-medium text-slate-500 uppercase tracking-wider mb-2.5">
                            Select Logical Framework
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                            <button
                              onClick={() => setGenCategory("rule_discovery")}
                              className={`py-2.5 px-3 rounded-lg border-2 text-xs font-semibold text-center transition-all font-mono
                                ${genCategory === "rule_discovery" 
                                  ? "bg-cyan-500/10 border-cyan-555 text-cyan-405" 
                                  : "bg-white/5 border-transparent text-slate-400 hover:text-white"}`}
                              style={{ borderColor: genCategory === 'rule_discovery' ? '#06b6d4' : '', color: genCategory === 'rule_discovery' ? '#22d3ee' : '' }}
                            >
                              Sequence
                            </button>

                            <button
                              onClick={() => setGenCategory("sudoku")}
                              className={`py-2.5 px-3 rounded-lg border-2 text-xs font-semibold text-center transition-all font-mono
                                ${genCategory === "sudoku" 
                                  ? "bg-cyan-500/10 border-cyan-555 text-cyan-405" 
                                  : "bg-white/5 border-transparent text-slate-400 hover:text-white"}`}
                              style={{ borderColor: genCategory === 'sudoku' ? '#06b6d4' : '', color: genCategory === 'sudoku' ? '#22d3ee' : '' }}
                            >
                              Sudoku
                            </button>

                            <button
                              onClick={() => setGenCategory("binary_puzzle")}
                              className={`py-2.5 px-3 rounded-lg border-2 text-xs font-semibold text-center transition-all font-mono
                                ${genCategory === "binary_puzzle" 
                                  ? "bg-cyan-500/10 border-cyan-555 text-cyan-405" 
                                  : "bg-white/5 border-transparent text-slate-400 hover:text-white"}`}
                              style={{ borderColor: genCategory === 'binary_puzzle' ? '#06b6d4' : '', color: genCategory === 'binary_puzzle' ? '#22d3ee' : '' }}
                            >
                              Boolean
                            </button>

                            <button
                              onClick={() => setGenCategory("lights_out")}
                              className={`py-2.5 px-3 rounded-lg border-2 text-xs font-semibold text-center transition-all font-mono
                                ${genCategory === "lights_out" 
                                  ? "bg-cyan-500/10 border-cyan-555 text-cyan-405" 
                                  : "bg-white/5 border-transparent text-slate-400 hover:text-white"}`}
                              style={{ borderColor: genCategory === 'lights_out' ? '#06b6d4' : '', color: genCategory === 'lights_out' ? '#22d3ee' : '' }}
                            >
                              Neural Grid
                            </button>

                            <button
                              onClick={() => setGenCategory("circuit_logic")}
                              className={`py-2.5 px-3 rounded-lg border-2 text-xs font-semibold text-center transition-all font-mono
                                ${genCategory === "circuit_logic" 
                                  ? "bg-cyan-500/10 border-cyan-555 text-cyan-405" 
                                  : "bg-white/5 border-transparent text-slate-400 hover:text-white"}`}
                              style={{ borderColor: genCategory === 'circuit_logic' ? '#06b6d4' : '', color: genCategory === 'circuit_logic' ? '#22d3ee' : '' }}
                            >
                              Circuit Gate
                            </button>

                            <button
                              onClick={() => setGenCategory("memory_matrix")}
                              className={`py-2.5 px-3 rounded-lg border-2 text-xs font-semibold text-center transition-all font-mono
                                ${genCategory === "memory_matrix" 
                                  ? "bg-cyan-500/10 border-cyan-555 text-cyan-405" 
                                  : "bg-white/5 border-transparent text-slate-400 hover:text-white"}`}
                              style={{ borderColor: genCategory === 'memory_matrix' ? '#06b6d4' : '', color: genCategory === 'memory_matrix' ? '#22d3ee' : '' }}
                            >
                              Recall Matrix
                            </button>

                            <button
                              onClick={() => setGenCategory("codebreaker")}
                              className={`py-2.5 px-3 rounded-lg border-2 text-xs font-semibold text-center transition-all font-mono
                                ${genCategory === "codebreaker" 
                                  ? "bg-cyan-500/10 border-cyan-555 text-cyan-405" 
                                  : "bg-white/5 border-transparent text-slate-400 hover:text-white"}`}
                              style={{ borderColor: genCategory === 'codebreaker' ? '#06b6d4' : '', color: genCategory === 'codebreaker' ? '#22d3ee' : '' }}
                            >
                              Cipher Code
                            </button>

                            <button
                              onClick={() => setGenCategory("color_flood")}
                              className={`py-2.5 px-3 rounded-lg border-2 text-xs font-semibold text-center transition-all font-mono
                                ${genCategory === "color_flood" 
                                  ? "bg-cyan-500/10 border-cyan-555 text-cyan-405" 
                                  : "bg-white/5 border-transparent text-slate-400 hover:text-white"}`}
                              style={{ borderColor: genCategory === 'color_flood' ? '#06b6d4' : '', color: genCategory === 'color_flood' ? '#22d3ee' : '' }}
                            >
                              Viral Flood
                            </button>

                            <button
                              onClick={() => setGenCategory("sliding_puzzle")}
                              className={`py-2.5 px-3 rounded-lg border-2 text-xs font-semibold text-center transition-all font-mono
                                ${genCategory === "sliding_puzzle" 
                                  ? "bg-cyan-500/10 border-cyan-555 text-cyan-405" 
                                  : "bg-white/5 border-transparent text-slate-400 hover:text-white"}`}
                              style={{ borderColor: genCategory === 'sliding_puzzle' ? '#06b6d4' : '', color: genCategory === 'sliding_puzzle' ? '#22d3ee' : '' }}
                            >
                              Number Grid
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-2">
                            <span className="uppercase tracking-wider text-slate-500 font-bold">Difficulty Index</span>
                            <span className="text-cyan-450 font-bold text-sm" style={{ color: '#22d3ee' }}>LVL {genDifficulty} / 10</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={genDifficulty}
                            onChange={(e) => setGenDifficulty(Number(e.target.value))}
                            className="w-full accent-cyan-500 bg-slate-900 rounded-lg cursor-pointer h-2 border border-slate-800"
                          />
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1.5 uppercase tracking-wide">
                            <span>Simple</span>
                            <span>Intermediate</span>
                            <span>Omniscient</span>
                          </div>
                        </div>
                      </div>

                      {forgeError && (
                        <div className="flex gap-2 text-rose-450 bg-rose-950/20 border border-rose-900/30 p-3.5 rounded-xl mb-4 text-xs font-mono" style={{ color: '#f87171' }}>
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span>{forgeError} Returning standard logic matrix board.</span>
                        </div>
                      )}

                      <button
                        onClick={() => forgePuzzle(genCategory, genDifficulty)}
                        className="arcade-btn w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer font-sans"
                      >
                        <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
                        Forge Procedural Logic Puzzle
                      </button>
                    </div>
                  )}

                  {/* Leaderboards screen exactly styled as Sophisticated card */}
                  {activeTab === "leaderboard" && (
                    <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 shadow-md max-w-xl mx-auto w-full">
                      <div className="flex items-center gap-3.5 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex justify-center items-center">
                          <Trophy className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-light text-slate-100 uppercase">Solve-Index Standings</h2>
                          <p className="text-xs text-slate-400 mt-1">Real-time standings of global neural operators</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        {leaderboard.map((user) => (
                          <div
                            key={user.username}
                            className={`
                              flex justify-between items-center p-3.5 rounded-xl border transition-colors
                              ${user.isCurrentUser 
                                ? "bg-cyan-500/10 border-cyan-500/30 text-white" 
                                : "bg-white/5 border-white/5 text-slate-300 hover:border-white/10"}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`
                                w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center
                                ${user.rank === 1 ? "bg-amber-500/20 border border-amber-500 text-amber-550" : ""}
                                ${user.rank === 2 ? "bg-slate-400/20 border border-slate-400 text-slate-300" : ""}
                                ${user.rank === 3 ? "bg-amber-800/20 border border-amber-800 text-amber-600" : ""}
                                ${user.rank > 3 ? "bg-white/5 border border-white/5 text-slate-500" : ""}
                              `} style={{ color: user.rank === 1 ? '#f59e0b' : '' }}>
                                {user.rank}
                              </span>
                              <div>
                                <span className="font-semibold text-sm block">
                                  {user.username}
                                  {user.isCurrentUser && <span className="ml-2 text-[9px] font-mono text-cyan-450 uppercase bg-cyan-950 border border-cyan-900/40 px-1.5 py-0.5 rounded" style={{ color: '#22d3ee' }}>You</span>}
                                </span>
                                <div className="text-[10px] text-slate-500 font-mono">Solve Level {user.level}</div>
                              </div>
                            </div>
                            <div className="text-right font-mono text-xs">
                              <div className="font-bold text-white">{user.xp} XP</div>
                              <div className="text-[10px] text-neutral-500">Solved Status</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Store Upgrades screen exactly styled as Sophisticated card */}
                  {activeTab === "premium" && (
                    <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 shadow-md max-w-xl mx-auto">
                      <div className="flex items-center gap-3.5 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex justify-center items-center">
                          <ShoppingBag className="w-5 h-5 text-pink-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-light text-slate-100 uppercase">LogicVerse Upgrades</h2>
                          <p className="text-xs text-slate-400 mt-1">Bypass logical indices or obtain unlimited generative credits</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Upgrade 1 */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                          <div>
                            <h4 className="font-bold text-sm text-slate-100 mb-1">Supercharged Hint Bundle</h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">
                              Instantly claims +25 hints on any active Sudoku or Boolean logic coordinates matrix.
                            </p>
                          </div>
                          <div className="flex justify-between items-center pt-2.5 border-t border-white/[0.04] mt-auto">
                            <span className="text-xs font-mono text-amber-500 flex items-center gap-1 font-bold">
                              FREE! (0 Credits)
                            </span>
                            <button
                              onClick={() => {
                                saveProfile({ ...profile, stars: profile.stars + 1 });
                                soundEffects.playSuccess();
                                alert("Supercharged Hint Bundle unlocked for free! Awarded +1 Bonus Star.");
                              }}
                              className="px-3 py-1.5 bg-[#06b6d4] hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg transition-colors font-mono uppercase"
                            >
                              Unlock
                            </button>
                          </div>
                        </div>

                        {/* Upgrade 2 */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                          <div>
                            <h4 className="font-bold text-sm text-slate-100 mb-1">Retro Interface Skins</h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">
                              Toggle alternative terminal skins and custom coordinate highlights dashboard layouts.
                            </p>
                          </div>
                          <div className="flex justify-between items-center pt-2.5 border-t border-white/[0.04] mt-auto">
                            <span className="text-xs font-mono text-purple-400 flex items-center gap-1 font-bold">
                              FREE! (0 Stars)
                            </span>
                            <button
                              onClick={() => {
                                soundEffects.playSuccess();
                                alert("Alternative UI module unlocked! Applied retro interface presets.");
                              }}
                              className="px-3 py-1.5 bg-[#06b6d4] hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg transition-colors font-mono uppercase"
                            >
                              Unlock
                            </button>
                          </div>
                        </div>

                        {/* Unlimited Vip upgrade */}
                        <div className="sm:col-span-2 bg-gradient-to-tr from-[#151f32] to-[#113543] p-5 rounded-xl border border-cyan-500/20 shadow-md">
                          <div className="flex justify-between items-start gap-4 flex-col sm:flex-row">
                            <div>
                              <span className="text-[10px] font-mono tracking-widest bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded font-bold uppercase">
                                VIP AI License
                              </span>
                              <h4 className="font-bold text-md text-slate-100 mt-2">Unlimited Live Forging Protocol</h4>
                              <p className="text-xs text-slate-400 leading-relaxed mt-1 max-w-md">
                                Forge infinite customized puzzles directly from the state-of-the-art server modules.
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                              <span className="text-cyan-400 font-bold font-mono text-lg block">FREE LICENSE</span>
                              <button
                                onClick={() => {
                                  soundEffects.playSuccess();
                                  alert("LogicVerse VIP Live Forging active! Forge unlimited levels and boards for free!");
                                }}
                                className="w-full sm:w-auto px-4 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 rounded-lg text-xs font-bold mt-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] uppercase tracking-wider font-mono"
                              >
                                Activate Free
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </main>

        {/* Footer exactly styled from design specifications */}
        <footer className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-500">
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-[10px] tracking-widest uppercase">System Status: Stable</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest uppercase italic">V1.0.4-Build-982</span>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <button onClick={() => setActiveTab("dashboard")} className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors">Archive</button>
            <button onClick={() => setActiveTab("generator")} className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors">Settings</button>
            <button onClick={() => setActiveTab("leaderboard")} className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] hover:text-cyan-350 transition-colors">Leaderboards</button>
          </div>
        </footer>
      </div>

    </div>
  );
}
