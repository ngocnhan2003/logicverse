export type GameType = "sudoku" | "rule_discovery" | "binary_puzzle" | "lights_out" | "circuit_logic" | "memory_matrix" | "codebreaker" | "color_flood" | "sliding_puzzle";

export interface PlayerProfile {
  username: string;
  xp: number;
  level: number;
  coins: number;
  stars: number;
  completedCount: number;
  streakDays: number;
  lastPlayedDate: string | null;
  unlockedCategories: GameType[];
}

export interface RuleDiscoveryPuzzle {
  ruleQuestion: string;
  ruleAnswer: string;
  ruleOptions: string[];
  ruleExplanation?: string;
}

export interface SudokuPuzzle {
  sudokuSize: number; // 4 or 6
  sudokuInitial: number[][];
  sudokuSolution: number[][];
  sudokuSpecialRuleType?: "classic" | "even_odd";
  sudokuEvenCells?: number[][]; // Coordinates [row, col]
}

export interface BinaryPuzzle {
  binarySize: number; // 6
  binaryInitial: number[][]; // -1 represents empty, 0 and 1 represent prefilled
  binarySolution: number[][];
}

export interface LightsOutPuzzle {
  gridSize: number;
  initialGrid: number[][]; // 0 is off, 1 is on
}

export interface CircuitGate {
  id: string;
  type: "AND" | "OR" | "XOR" | "NOT";
  inputs: string[];
}

export interface CircuitLogicPuzzle {
  inputs: string[];
  initialInputValues: Record<string, number>;
  gates: CircuitGate[];
  targetOutputValue: number;
}

export interface MemoryMatrixPuzzle {
  gridSize: number;
  sequence: { r: number; c: number }[];
}

export interface CodebreakerPuzzle {
  codeLength: number;
  maxGuesses: number;
  availableColors: string[];
  secretCode: string[];
}

export interface ColorFloodPuzzle {
  gridSize: number;
  initialGrid: string[][];
  maxMoves: number;
  availableColors: string[];
}

export interface SlidingPuzzle {
  gridSize: number;
  initialGrid: number[][]; // 0 represents the empty space
}

export interface ActivePuzzle {
  source: "local-engine";
  type: GameType;
  difficulty: number;
  questionText: string;
  rulePuzzle?: RuleDiscoveryPuzzle;
  sudokuPuzzle?: SudokuPuzzle;
  binaryPuzzle?: BinaryPuzzle;
  lightsOutPuzzle?: LightsOutPuzzle;
  circuitLogicPuzzle?: CircuitLogicPuzzle;
  memoryMatrixPuzzle?: MemoryMatrixPuzzle;
  codebreakerPuzzle?: CodebreakerPuzzle;
  colorFloodPuzzle?: ColorFloodPuzzle;
  slidingPuzzle?: SlidingPuzzle;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  xp: number;
  level: number;
  isCurrentUser?: boolean;
}
