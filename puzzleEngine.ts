// Shared local procedural puzzle engine.
// Used by both the local dev Express server (server.ts) and the
// Vercel serverless function (api/generate-puzzle.ts) so puzzle
// generation behaves identically in local dev and production.

// Low-level high-quality local generator for fast play
const LOCAL_RULE_PATTERNS = [
  { question: "2, 4, 8, 16, ?", answer: "32", options: ["24", "30", "32", "64"], expl: "Double the previous number: 16 * 2 = 32" },
  { question: "1, 3, 9, 27, ?", answer: "81", options: ["45", "54", "81", "243"], expl: "Multiply the previous number by 3: 27 * 3 = 81" },
  { question: "5, 10, 15, 20, ?", answer: "25", options: ["22", "24", "25", "30"], expl: "Add 5 to the previous number: 20 + 5 = 25" },
  { question: "1, 1, 2, 3, 5, 8, ?", answer: "13", options: ["11", "12", "13", "15"], expl: "Fibonacci sequence: sum of previous two numbers: 5 + 8 = 13" },
  { question: "1, 4, 9, 16, 25, ?", answer: "36", options: ["30", "35", "36", "49"], expl: "Perfect squares (1^2, 2^2, 3^2, 4^2, 5^2, 6^2)" },
  { question: "2, 3, 5, 7, 11, ?", answer: "13", options: ["12", "13", "15", "17"], expl: "Prime numbers series" },
  { question: "20, 18, 15, 11, ?", answer: "6", options: ["8", "7", "6", "5"], expl: "Subtract decreasing amounts: -2, -3, -4, then -5. 11 - 5 = 6" },
  { question: "1, 2, 6, 24, ?", answer: "120", options: ["48", "96", "120", "144"], expl: "Factorial sequence (1!, 2!, 3!, 4!, 5!)" },
  { question: "A, C, E, G, ?", answer: "I", options: ["H", "I", "J", "K"], expl: "Letters skipping one letter: A (b) C (d) E (f) G (h) I" },
  { question: "Z, X, V, T, ?", answer: "R", options: ["S", "R", "Q", "P"], expl: "Reverse alphabet, skipping one letter" },
];

const LOCAL_SUDOKU_4X4 = [
  {
    initial: [
      [1, 0, 0, 4],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [4, 0, 0, 1],
    ],
    solution: [
      [1, 3, 2, 4],
      [2, 4, 1, 3],
      [3, 1, 4, 2],
      [4, 2, 3, 1],
    ],
    specialType: "classic",
    evenCells: []
  },
  {
    initial: [
      [0, 2, 0, 0],
      [0, 0, 4, 0],
      [0, 1, 0, 0],
      [0, 0, 3, 0],
    ],
    solution: [
      [4, 2, 1, 3],
      [1, 3, 4, 2],
      [3, 1, 2, 4],
      [2, 4, 3, 1],
    ],
    specialType: "even_odd",
    evenCells: [[0, 1], [1, 2], [2, 2], [3, 1]] // 2, 4, 2, 4 are even
  },
];

export function getLocalSudoku(difficulty: number) {
  // Return a beautiful size 4 or 6 sudoku
  const size = difficulty > 5 ? 6 : 4;
  if (size === 4) {
    const idx = Math.floor(Math.random() * LOCAL_SUDOKU_4X4.length);
    const template = LOCAL_SUDOKU_4X4[idx];
    return {
      type: "sudoku",
      difficulty,
      questionText: template.specialType === "even_odd"
        ? "Sudoku+ with Even Cells highlighted! Even numbers (2, 4) go into designated blue cells."
        : "Classic 4x4 Sudoku. Complete the grid so every row, column and 2x2 block contains 1-4.",
      sudokuSize: 4,
      sudokuInitial: template.initial,
      sudokuSolution: template.solution,
      sudokuSpecialRuleType: template.specialType,
      sudokuEvenCells: template.evenCells,
    };
  } else {
    // Elegant 6x6 Sudoku puzzle - mathematically perfect and guaranteed-solvable
    return {
      type: "sudoku",
      difficulty,
      questionText: "Classic 6x6 Sudoku. Fill the grid so rows, columns, and 2x3 blocks contain 1 to 6.",
      sudokuSize: 6,
      sudokuInitial: [
        [1, 0, 0, 0, 5, 6],
        [0, 5, 6, 0, 2, 0],
        [2, 0, 1, 0, 0, 4],
        [5, 0, 0, 2, 0, 1],
        [0, 1, 2, 0, 4, 0],
        [6, 4, 0, 0, 0, 2]
      ],
      sudokuSolution: [
        [1, 2, 3, 4, 5, 6],
        [4, 5, 6, 1, 2, 3],
        [2, 3, 1, 5, 6, 4],
        [5, 6, 4, 2, 3, 1],
        [3, 1, 2, 6, 4, 5],
        [6, 4, 5, 3, 1, 2]
      ],
      sudokuSpecialRuleType: "classic",
      sudokuEvenCells: []
    };
  }
}

export function getLocalBinaryPuzzle(difficulty: number) {
  // Binary Grid Rules:
  // - No 3 identical numbers consecutive on any row/col
  // - Equal number of 0s and 1s in each row and column
  const solution = [
    [1, 1, 0, 0, 1, 0],
    [0, 1, 0, 1, 0, 1],
    [0, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 1, 0],
    [0, 1, 1, 0, 0, 1],
    [1, 0, 0, 1, 1, 0]
  ];

  // Some empty spaces (represented as -1)
  const initialGrid = [
    [1, -1, 0, -1, -1, 0],
    [-1, 1, -1, 1, 0, -1],
    [0, -1, 1, -1, -1, 1],
    [-1, 0, -1, 0, 1, -1],
    [0, -1, -1, 0, -1, 1],
    [-1, -1, 0, -1, 1, 0]
  ];

  return {
    type: "binary_puzzle",
    difficulty,
    questionText: "Binary Puzzle Rules: 1. No three same numbers in a row or col. 2. Each row and col must have equal number of 0s and 1s.",
    binarySize: 6,
    binaryInitial: initialGrid,
    binarySolution: solution
  };
}

export function getLocalLightsOut(difficulty: number) {
  const gridSize = 5;
  const grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));

  const movesCount = 5 + Math.min(difficulty, 8);
  for (let m = 0; m < movesCount; m++) {
    const r = Math.floor(Math.random() * gridSize);
    const c = Math.floor(Math.random() * gridSize);
    const cells = [
      [r, c],
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];
    cells.forEach(([tr, tc]) => {
      if (tr >= 0 && tr < gridSize && tc >= 0 && tc < gridSize) {
        grid[tr][tc] = grid[tr][tc] === 1 ? 0 : 1;
      }
    });
  }

  // Double check it's not pre-solved
  const solved = grid.every(row => row.every(v => v === 0));
  if (solved) {
    grid[0][0] = 1;
    grid[0][1] = 1;
    grid[1][0] = 1;
  }

  return {
    type: "lights_out",
    difficulty,
    questionText: "Neural Fray: All nodes must be empty (dark) to complete the security handshake.",
    lightsOutPuzzle: {
      gridSize,
      initialGrid: grid
    }
  };
}

export function getLocalCircuitLogic(difficulty: number) {
  const inputs = ["A", "B", "C", "D"];
  const initialInputValues = { A: 0, B: 0, C: 0, D: 0 };

  const gateTypes: ("AND" | "OR" | "XOR")[] = ["AND", "OR", "XOR"];
  const type1 = gateTypes[Math.floor(Math.random() * gateTypes.length)];
  const type2 = gateTypes[Math.floor(Math.random() * gateTypes.length)];
  const type3 = gateTypes[Math.floor(Math.random() * gateTypes.length)];

  const gates = [
    { id: "G1", type: type1, inputs: ["A", "B"] },
    { id: "G2", type: type2, inputs: ["C", "D"] },
    { id: "OUT", type: type3, inputs: ["G1", "G2"] }
  ];

  return {
    type: "circuit_logic",
    difficulty,
    questionText: "Gate Network Calibration: Configure PIN registers so the terminal output OUT evaluates to 1.",
    circuitLogicPuzzle: {
      inputs,
      initialInputValues,
      gates,
      targetOutputValue: 1
    }
  };
}

export function getLocalMemoryMatrix(difficulty: number) {
  const gridSize = 4;
  const seqLength = 4 + Math.min(difficulty, 4);
  const sequence: { r: number, c: number }[] = [];

  for (let i = 0; i < seqLength; i++) {
    const r = Math.floor(Math.random() * gridSize);
    const c = Math.floor(Math.random() * gridSize);
    if (sequence.length > 0) {
      const prev = sequence[sequence.length - 1];
      if (prev.r === r && prev.c === c) {
        sequence.push({ r: (r + 1) % gridSize, c });
        continue;
      }
    }
    sequence.push({ r, c });
  }

  return {
    type: "memory_matrix",
    difficulty,
    questionText: "Neural Memory Matrix: Replicate the sequence flashing order on the grid.",
    memoryMatrixPuzzle: {
      gridSize,
      sequence
    }
  };
}

export function getLocalCodebreaker(difficulty: number) {
  const codeLength = 4;
  const maxGuesses = 8;
  const availableColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
  const secretCode = Array(codeLength).fill("").map(() => availableColors[Math.floor(Math.random() * availableColors.length)]);

  return {
    type: "codebreaker",
    difficulty,
    questionText: "Codebreaker: Deduce the hidden color sequence. Feedback will show colors in correct positions and correct colors in wrong positions.",
    codebreakerPuzzle: {
      codeLength,
      maxGuesses,
      availableColors,
      secretCode
    }
  };
}

export function getLocalColorFlood(difficulty: number) {
  const gridSize = 8;
  const maxMoves = 15;
  const availableColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
  const initialGrid = Array(gridSize).fill(0).map(() =>
    Array(gridSize).fill("").map(() => availableColors[Math.floor(Math.random() * availableColors.length)])
  );

  return {
    type: "color_flood",
    difficulty,
    questionText: "Color Flood: Change the color of your domain (starting top-left) to capture adjacent cells. Flood the entire grid within the move limit.",
    colorFloodPuzzle: {
      gridSize,
      initialGrid,
      maxMoves,
      availableColors
    }
  };
}

export function getLocalSlidingPuzzle(difficulty: number) {
  const gridSize = 3; // 3x3 is 8-puzzle. 4x4 is 15-puzzle. Let's use 3x3 for simplicity.
  const initialGrid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 0]
  ];

  // Shuffle by making valid moves
  const moves = 20 + difficulty * 10;
  let r = 2, c = 2; // Position of 0
  for (let m = 0; m < moves; m++) {
    const neighbors = [];
    if (r > 0) neighbors.push({ nr: r - 1, nc: c });
    if (r < gridSize - 1) neighbors.push({ nr: r + 1, nc: c });
    if (c > 0) neighbors.push({ nr: r, nc: c - 1 });
    if (c < gridSize - 1) neighbors.push({ nr: r, nc: c + 1 });

    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    initialGrid[r][c] = initialGrid[next.nr][next.nc];
    initialGrid[next.nr][next.nc] = 0;
    r = next.nr;
    c = next.nc;
  }

  return {
    type: "sliding_puzzle",
    difficulty,
    questionText: "Number Slider: Rearrange the matrix so the numbers are in sequential order from left to right, top to bottom.",
    slidingPuzzle: {
      gridSize,
      initialGrid
    }
  };
}

// Single entry point used by the HTTP handlers.
export function generatePuzzle(type?: string, difficulty?: unknown) {
  const targetType = type || "rule_discovery";
  const targetDifficulty = Math.max(1, Math.min(10, Number(difficulty) || 5));

  if (targetType === "sudoku") {
    return { source: "local-engine", ...getLocalSudoku(targetDifficulty) };
  } else if (targetType === "binary_puzzle") {
    return { source: "local-engine", ...getLocalBinaryPuzzle(targetDifficulty) };
  } else if (targetType === "lights_out") {
    return { source: "local-engine", ...getLocalLightsOut(targetDifficulty) };
  } else if (targetType === "circuit_logic") {
    return { source: "local-engine", ...getLocalCircuitLogic(targetDifficulty) };
  } else if (targetType === "memory_matrix") {
    return { source: "local-engine", ...getLocalMemoryMatrix(targetDifficulty) };
  } else if (targetType === "codebreaker") {
    return { source: "local-engine", ...getLocalCodebreaker(targetDifficulty) };
  } else if (targetType === "color_flood") {
    return { source: "local-engine", ...getLocalColorFlood(targetDifficulty) };
  } else if (targetType === "sliding_puzzle") {
    return { source: "local-engine", ...getLocalSlidingPuzzle(targetDifficulty) };
  } else {
    // Default Rule Discovery
    const index = Math.floor(Math.random() * LOCAL_RULE_PATTERNS.length);
    const selected = LOCAL_RULE_PATTERNS[index];
    return {
      source: "local-engine",
      type: "rule_discovery",
      difficulty: targetDifficulty,
      questionText: "Find the hidden logico-mathematical rule below and choose the matching finish.",
      ruleQuestion: selected.question,
      ruleAnswer: selected.answer,
      ruleOptions: selected.options,
      ruleExplanation: selected.expl
    };
  }
}
