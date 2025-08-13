/* 
  Sysnox Neon Snake - Backend
  Tech: Node.js + Express
  Provides a tiny JSON-file leaderboard.
  Author: Sysnox
*/
import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'scores.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "data:"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"]
    }
  }
}));
app.use(cors());
app.use(express.json({ limit: '50kb' }));

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// --- Leaderboard API ---
function readScores() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
function writeScores(scores) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(scores, null, 2), 'utf8');
}
function sanitizeName(name) {
  if (typeof name !== 'string') return 'anon';
  let s = name.trim().slice(0, 16);
  // allow basic chars only
  s = s.replace(/[^a-zA-Z0-9 _\-]/g, '');
  return s || 'anon';
}

app.get('/api/leaderboard', (req, res) => {
  const scores = readScores();
  scores.sort((a,b) => b.score - a.score);
  res.json(scores.slice(0, 50));
});

app.post('/api/score', (req, res) => {
  const { name, score } = req.body || {};
  const s = Number(score);
  if (!Number.isFinite(s) || s < 0 || s > 1000000) {
    return res.status(400).json({ error: 'invalid score' });
  }
  const entry = { name: sanitizeName(name), score: Math.floor(s), ts: Date.now() };
  const scores = readScores();
  scores.push(entry);
  // Keep only top 200 by score
  scores.sort((a,b) => b.score - a.score);
  const trimmed = scores.slice(0,200);
  writeScores(trimmed);
  res.json({ ok: true });
});

// Fallback: SPA-style routing (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sysnox Neon Snake server listening on http://localhost:${PORT}`);
});
