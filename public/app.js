/* 
  Sysnox Neon Snake — Frontend (vanilla JS)
  Author: Sysnox
*/
const $ = (sel) => document.querySelector(sel);
const canvas = $("#board");
const g = canvas.getContext("2d");

// --- Settings & state ---
const DEFAULTS = { cols: 22, rows: 22, speed: 9 };
let cols = DEFAULTS.cols,
  rows = DEFAULTS.rows,
  speed = DEFAULTS.speed;
let showGrid = true,
  wrapWalls = false;
let running = false,
  paused = false,
  stepTimer = 0,
  stepMs = 1000 / speed;
let score = 0,
  best = Number(localStorage.getItem("sysnox-snake-best") || 0);

const state = {
  snake: [],
  dir: { x: 1, y: 0 },
  nextDir: { x: 1, y: 0 },
  food: { x: 5, y: 5 },
  bonus: null,
  bonusTimer: 0,
  sounds: true,
};

const THEMES = {
  neon: {
    grid: "rgba(255,255,255,.06)",
    snake: ["#00e5ff", "#00ff85"],
    food: ["#ff3cac", "#784ba0", "#2b86c5"],
    bonus: ["#f5d020", "#f53803"],
  },
  pastel: {
    grid: "rgba(0,0,0,.06)",
    snake: ["#6a7fd2", "#a6e3e9"],
    food: ["#ff9a9e", "#fad0c4", "#fad0c4"],
    bonus: ["#ffd166", "#06d6a0"],
  },
  dark: {
    grid: "rgba(255,255,255,.05)",
    snake: ["#22d3ee", "#60a5fa"],
    food: ["#f43f5e", "#fb7185", "#ef4444"],
    bonus: ["#f59e0b", "#facc15"],
  },
  cyberpunk: {
    grid: "rgba(255,0,255,.08)",
    snake: ["#00fff0", "#ff00e6"],
    food: ["#ffe700", "#ff5f1f", "#ff00e6"],
    bonus: ["#39ff14", "#ffe700"],
  },
};
let themeKey = "neon";

// --- UI hooks ---
const scoreEl = $("#score"),
  bestEl = $("#best");
const btnPlay = $("#btn-play"),
  btnPause = $("#btn-pause"),
  btnStop = $("#btn-stop"),
  btnSound = $("#btn-sound");
const speedInput = $("#speed"),
  colsInput = $("#cols"),
  rowsInput = $("#rows");
const speedLabel = $("#speedLabel"),
  colsLabel = $("#colsLabel"),
  rowsLabel = $("#rowsLabel");
const themeSel = $("#theme");
const wrapChk = $("#wrap");
const gridChk = $("#grid");
const leaderboardEl = $("#leaderboard");
const dialogGO = $("#gameover"),
  finalScoreEl = $("#finalScore"),
  nameInput = $("#playerName");
const yearEl = $("#year");
yearEl.textContent = new Date().getFullYear();

function setCanvasSize() {
  const size = Math.min(window.innerWidth * 0.92, 760);
  canvas.width = size;
  canvas.height = size;
}
setCanvasSize();
window.addEventListener("resize", setCanvasSize);

// --- Helpers ---
function eq(a, b) {
  return a.x === b.x && a.y === b.y;
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function spawnFood() {
  while (true) {
    const p = { x: randInt(0, cols - 1), y: randInt(0, rows - 1) };
    if (
      !state.snake.some((s) => eq(s, p)) &&
      (!state.bonus || !eq(state.bonus, p))
    )
      return p;
  }
}
function lerpColor(a, b, t) {
  const pa = hexToRgb(a),
    pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t),
    g = Math.round(pa.g + (pb.g - pa.g) * t),
    bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}
function hexToRgb(hex) {
  const m = hex.replace("#", "");
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
}

// --- Sound ---
const audio = { ctx: null, enabled: true };
function ensureAudio() {
  if (!audio.ctx)
    audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
}
function tone(freq, dur = 0.08) {
  if (!audio.enabled) return;
  ensureAudio();
  const ctx = audio.ctx;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.value = 0.08;
  o.connect(g).connect(ctx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.stop(ctx.currentTime + dur);
}
function sEat() {
  tone(660);
}
function sBonus() {
  tone(880, 0.12);
}
function sHit() {
  tone(110, 0.2);
}

// --- Game control ---
function reset() {
  const cx = Math.floor(cols / 2),
    cy = Math.floor(rows / 2);
  state.snake = [
    { x: cx - 1, y: cy },
    { x: cx, y: cy },
  ];
  state.dir = { x: 1, y: 0 };
  state.nextDir = { x: 1, y: 0 };
  state.food = spawnFood();
  state.bonus = null;
  state.bonusTimer = 0;
  score = 0;
  updateHUD();
}
function start() {
  reset();
  running = true;
  paused = false;
  stepTimer = 0;
}
function stop() {
  running = false;
  paused = false;
}
function updateHUD() {
  scoreEl.textContent = score;
  bestEl.textContent = best;
}

// Keyboard
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === " ") {
    e.preventDefault();
    if (!running) start();
    else paused = !paused;
    return;
  }
  if (k === "enter" && !running) {
    start();
    return;
  }
  const map = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
  };
  if (map[k]) {
    const d = map[k];
    const cur = state.dir;
    if (cur.x + d.x !== 0 || cur.y + d.y !== 0) state.nextDir = d;
  }
});

// Buttons
btnPlay.addEventListener("click", () => start());
btnPause.addEventListener("click", () => {
  if (running) paused = !paused;
});
btnStop.addEventListener("click", () => stop());
btnSound.addEventListener("click", () => {
  audio.enabled = !audio.enabled;
  btnSound.textContent = "Son: " + (audio.enabled ? "On" : "Off");
});

speedInput.addEventListener("input", () => {
  speed = Number(speedInput.value);
  speedLabel.textContent = speed;
  stepMs = 1000 / Math.max(2, speed);
});
colsInput.addEventListener("input", () => {
  cols = Number(colsInput.value);
  colsLabel.textContent = cols;
  setTimeout(draw, 0);
});
rowsInput.addEventListener("input", () => {
  rows = Number(rowsInput.value);
  rowsLabel.textContent = rows;
  setTimeout(draw, 0);
});
themeSel.addEventListener("change", () => {
  themeKey = themeSel.value;
});
wrapChk.addEventListener("change", () => (wrapWalls = wrapChk.checked));
gridChk.addEventListener("change", () => {
  showGrid = gridChk.checked;
  draw();
});

// D-pad
document.querySelectorAll("#dpad [data-dir]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const d = btn.getAttribute("data-dir");
    const map = {
      U: { x: 0, y: -1 },
      D: { x: 0, y: 1 },
      L: { x: -1, y: 0 },
      R: { x: 1, y: 0 },
    };
    const nd = map[d];
    const cur = state.dir;
    if (cur.x + nd.x !== 0 || cur.y + nd.y !== 0) state.nextDir = nd;
  });
});

// Touch swipe
let sx = 0,
  sy = 0,
  dx = 0,
  dy = 0;
canvas.addEventListener(
  "touchstart",
  (e) => {
    const t = e.touches[0];
    sx = t.clientX;
    sy = t.clientY;
    dx = dy = 0;
  },
  { passive: true }
);
canvas.addEventListener(
  "touchmove",
  (e) => {
    const t = e.touches[0];
    dx = t.clientX - sx;
    dy = t.clientY - sy;
  },
  { passive: true }
);
canvas.addEventListener("touchend", () => {
  if (Math.abs(dx) + Math.abs(dy) < 10) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    const d = { x: Math.sign(dx), y: 0 };
    const cur = state.dir;
    if (cur.x + d.x !== 0) state.nextDir = d;
  } else {
    const d = { x: 0, y: Math.sign(dy) };
    const cur = state.dir;
    if (cur.y + d.y !== 0) state.nextDir = d;
  }
});

// --- Game loop ---
let last = performance.now();
function loop() {
  const now = performance.now();
  const dt = now - last;
  last = now;
  if (running && !paused) {
    stepTimer += dt;
    while (stepTimer >= stepMs) {
      step();
      stepTimer -= stepMs;
    }
  }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function step() {
  state.dir = state.nextDir;
  const head = state.snake[state.snake.length - 1];
  let nx = head.x + state.dir.x,
    ny = head.y + state.dir.y;
  if (wrapWalls) {
    nx = (nx + cols) % cols;
    ny = (ny + rows) % rows;
  }
  if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
    return gameOver();
  }

  const newHead = { x: nx, y: ny };
  if (state.snake.some((p) => eq(p, newHead))) return gameOver();
  state.snake.push(newHead);

  let grew = false;
  if (eq(newHead, state.food)) {
    grew = true;
    score += 10;
    sEat();
    state.food = spawnFood();
    if (!state.bonus && Math.random() < 0.22) {
      state.bonus = spawnFood();
      state.bonusTimer = 50;
    }
  } else if (state.bonus && eq(newHead, state.bonus)) {
    grew = true;
    score += 30;
    sBonus();
    state.bonus = null;
    state.bonusTimer = 0;
  }
  if (!grew) state.snake.shift();

  if (state.bonus) {
    state.bonusTimer -= 1;
    if (state.bonusTimer <= 0) state.bonus = null;
  }
  if (score > best) {
    best = score;
    localStorage.setItem("sysnox-snake-best", String(best));
  }
  updateHUD();
}

function gameOver() {
  sHit();
  running = false;
  paused = false;
  finalScoreEl.textContent = score;
  dialogGO.showModal();
}

// --- Leaderboard ---
const API_BASE = ""; // same origin by default
async function loadLeaderboard() {
  try {
    const res = await fetch(`${API_BASE}/api/leaderboard`);
    const rows = await res.json();
    leaderboardEl.innerHTML = "";
    rows.forEach((r, i) => {
      const li = document.createElement("li");
      li.textContent = `${i + 1}. ${r.name} — ${r.score}`;
      leaderboardEl.appendChild(li);
    });
  } catch (e) {
    /* ignore */
  }
}
loadLeaderboard();

$("#scoreForm").addEventListener("close", () => {}); // noop (dialog close hook)
$("#scoreForm").addEventListener("submit", (e) => e.preventDefault());

dialogGO.addEventListener("close", () => {});
document.getElementById("scoreForm").addEventListener("click", async (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.getAttribute("value") === "submit") {
    const name = (nameInput.value || "Sysnox").toString();
    try {
      await fetch(`${API_BASE}/api/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, score }),
      });
      await loadLeaderboard();
    } catch (e) {}
    dialogGO.close();
  }
});

// --- Drawing ---
function draw() {
  const w = canvas.width,
    h = canvas.height;
  g.clearRect(0, 0, w, h);
  // grid
  if (showGrid) {
    g.strokeStyle = THEMES[themeKey].grid;
    g.lineWidth = 1;
    const cw = w / cols,
      ch = h / rows;
    g.beginPath();
    for (let x = 0; x <= cols; x++) {
      g.moveTo(x * cw + 0.5, 0);
      g.lineTo(x * cw + 0.5, h);
    }
    for (let y = 0; y <= rows; y++) {
      g.moveTo(0, y * ch + 0.5);
      g.lineTo(w, y * ch + 0.5);
    }
    g.stroke();
  }
  const cw = w / cols,
    ch = h / rows;
  // food
  const fg = g.createLinearGradient(0, 0, cw, ch);
  const fC = THEMES[themeKey].food;
  fg.addColorStop(0, fC[0]);
  fg.addColorStop(0.5, fC[1]);
  fg.addColorStop(1, fC[2]);
  rounded(g, state.food.x * cw, state.food.y * ch, cw, ch, 6, fg, true);
  // bonus
  if (state.bonus) {
    const t = Date.now() * 0.004;
    const r = Math.min(cw, ch) * (0.25 + 0.05 * Math.sin(t));
    const cx = state.bonus.x * cw + cw / 2;
    const cy = state.bonus.y * ch + ch / 2;
    const gradB = g.createRadialGradient(cx, cy, 2, cx, cy, r * 2);
    gradB.addColorStop(0, THEMES[themeKey].bonus[0]);
    gradB.addColorStop(1, "transparent");
    g.fillStyle = gradB;
    g.beginPath();
    g.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = THEMES[themeKey].bonus[1];
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
  }
  // snake
  const [s1, s2] = THEMES[themeKey].snake;
  for (let i = 0; i < state.snake.length; i++) {
    const p = state.snake[i];
    const t = i / Math.max(1, state.snake.length - 1);
    const col = lerpColor(s1, s2, t * 0.85);
    rounded(g, p.x * cw, p.y * ch, cw, ch, 7, col, true);
  }
  const head = state.snake[state.snake.length - 1];
  if (head) {
    g.fillStyle = "rgba(255,255,255,.35)";
    g.beginPath();
    g.arc(
      head.x * cw + cw * 0.7,
      head.y * ch + ch * 0.3,
      Math.min(cw, ch) * 0.12,
      0,
      Math.PI * 2
    );
    g.fill();
  }
}

function rounded(g, x, y, w, h, r, fill, glow) {
  const rr = Math.min(r, w / 2, h / 2);
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
  g.fill();
  if (glow) {
    g.save();
    g.shadowColor = typeof fill === "string" ? fill : "#fff";
    g.shadowBlur = 12;
    g.fill();
    g.restore();
  }
}

// Initialize
(function init() {
  themeSel.value = themeKey;
  updateHUD();
})();

// Plein écran
const btnFullscreen = document.getElementById("btn-fullscreen");
btnFullscreen.addEventListener("click", () => {
  const elem = document.documentElement;
  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      // Safari
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      // IE11
      elem.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
});
