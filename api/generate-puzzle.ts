// Vercel serverless function: POST /api/generate-puzzle
// In production on Vercel the long-running Express server (server.ts) does
// not run, so this function provides the same puzzle-generation endpoint
// the frontend relies on. Local dev keeps using server.ts.
import { generatePuzzle } from "../puzzleEngine";

export default function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Vercel parses JSON bodies automatically, but guard for safety.
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const { type, difficulty } = body || {};

  const puzzle = generatePuzzle(type, difficulty);
  return res.status(200).json(puzzle);
}
