export type GameType = "sudoku" | "rule_discovery" | "binary_puzzle";

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

export interface ActivePuzzle {
  source: "gemini-ai" | "local-engine";
  type: GameType;
  difficulty: number;
  questionText: string;
  rulePuzzle?: RuleDiscoveryPuzzle;
  sudokuPuzzle?: SudokuPuzzle;
  binaryPuzzle?: BinaryPuzzle;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  xp: number;
  level: number;
  isCurrentUser?: boolean;
}
