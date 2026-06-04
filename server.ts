import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generatePuzzle } from "./puzzleEngine";

const app = express();
const PORT = 3000;

app.use(express.json());

// REST API for puzzle generation (local dev).
// In production on Vercel this same logic is served by api/generate-puzzle.ts.
app.post("/api/generate-puzzle", async (req, res) => {
  const { type, difficulty } = req.body || {};
  console.log(`Generating puzzle via Local Engine: type=${type || "rule_discovery"}`);
  res.json(generatePuzzle(type, difficulty));
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LogicVerse server running securely on http://localhost:${PORT}`);
  });
}

startServer();
