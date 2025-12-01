let socket;
let tiles = [];
let order = [];

const POSTER_W = 400;
const POSTER_H = 600;
const SHUFFLE_INTERVAL_FRAMES = 100;

let mode = "grid";

let fadeState = "none"; // "none", "out", "in"
let fadeAlpha = 0;
let pendingMode = null;

let toggleBtn = null;
let clearBtn = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  imageMode(CORNER);

  socket = io();
  socket.on("connect", () => {
    console.log("Display socket connected:", socket.id);
  });

  socket.on("initPosters", (data) => {
    data.forEach(p => addPosterTile(p));
  });

  socket.on("posterAdded", (p) => {
    addPosterTile(p);
  });

  toggleBtn = document.getElementById("toggleMode");
  clearBtn = document.getElementById("clearWall");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      if (fadeState !== "none") return;
      pendingMode = (mode === "grid") ? "strokes" : "grid";
      fadeState = "out";
      fadeAlpha = 0;
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (fadeState !== "none") return;
      tiles = [];
      order = [];
    });
  }
}

function addPosterTile(posterObj) {
  loadImage(posterObj.dataUrl, (img) => {
    tiles.push({
      img,
      strokes: posterObj.strokes || []
    });
    rebuildOrder();
  });
}

function draw() {
  background(0);

  if (tiles.length === 0) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("Waiting for YDesign posters…", width / 2, height / 2);
    applyFadeOverlay();
    return;
  }

  if (mode === "grid") {
    drawGridMode();
  } else if (mode === "strokes") {
    drawStrokesMode();
  }

  applyFadeOverlay();
}

function applyFadeOverlay() {
  if (fadeState === "none") return;

  noStroke();

  if (fadeState === "out") {
    fadeAlpha = min(255, fadeAlpha + 15);
    fill(0, fadeAlpha);
    rect(0, 0, width, height);

    if (fadeAlpha >= 255) {
      mode = pendingMode;
      fadeState = "in";
      if (toggleBtn) {
        toggleBtn.textContent = (mode === "grid") ? "Strokes view" : "Poster grid";
      }
    }
  } else if (fadeState === "in") {
    fadeAlpha = max(0, fadeAlpha - 15);
    fill(0, fadeAlpha);
    rect(0, 0, width, height);

    if (fadeAlpha <= 0) {
      fadeState = "none";
      pendingMode = null;
    }
  }
}

/* ---------- GRID MODE (PNG posters) ---------- */

function drawGridMode() {
  if (order.length !== tiles.length) {
    rebuildOrder();
  }

  if (frameCount % SHUFFLE_INTERVAL_FRAMES === 0 && tiles.length > 1) {
    shuffleArray(order);
  }

  const n = tiles.length;
  const { cols, posterW, posterH } = computeLayout(n);

  for (let i = 0; i < n; i++) {
    const tileIndex = order[i];
    const t = tiles[tileIndex];
    if (!t || !t.img) continue;

    const col = i % cols;
    const row = floor(i / cols);
    const x = col * posterW;
    const y = row * posterH;

    image(t.img, x, y, posterW, posterH);
  }
}

/* ---------- STROKES MODE (everyone drawing) ---------- */

function drawStrokesMode() {
  const n = tiles.length;
  const { cols, posterW, posterH } = computeLayout(n);

  for (let i = 0; i < n; i++) {
    const tileIndex = order[i];
    const t = tiles[tileIndex];
    if (!t || !t.strokes || t.strokes.length === 0) continue;

    const col = i % cols;
    const row = floor(i / cols);
    const x = col * posterW;
    const y = row * posterH;

    drawTileStrokes(t, x, y, posterW, posterH, i);
  }
}

function drawTileStrokes(tile, x, y, w, h, idx) {
  const total = tile.strokes.length;
  if (total === 0) return;

  const speed = 0.5;
  const offset = idx * 40;
  const progress = (frameCount * speed + offset) % (total + 1);

  push();
  translate(x + w / 2, y + h / 2);

  const s = min(w / POSTER_W, h / POSTER_H);
  scale(s);

  noStroke();
  fill(0);
  rectMode(CENTER);
  rect(0, 0, POSTER_W, POSTER_H);

  const SYM = 5;
  const angleStep = 360 / SYM;

  for (let i = 0; i < progress && i < total; i++) {
    const st = tile.strokes[i];
    stroke(...st.color);
    strokeWeight(st.weight * (1 / s));

    let mx  = st.mx;
    let my  = st.my;
    let pmx = st.pmx;
    let pmy = st.pmy;

    push();
    for (let k = 0; k < SYM; k++) {
      rotate(angleStep);
      line(mx, my, pmx, pmy);

      push();
      scale(1, -1);
      line(mx, my, pmx, pmy);
      pop();
    }
    pop();
  }

  pop();
}

/* ---------- LAYOUT / UTILS ---------- */

function computeLayout(n) {
  let bestCols = 1;
  let bestScale = 0;

  for (let cols = 1; cols <= n; cols++) {
    const rows = ceil(n / cols);
    const maxW = width / cols;
    const maxH = height / rows;
    const scale = min(maxW / POSTER_W, maxH / POSTER_H);

    if (scale > bestScale) {
      bestScale = scale;
      bestCols = cols;
    }
  }

  const posterW = POSTER_W * bestScale;
  const posterH = POSTER_H * bestScale;
  return { cols: bestCols, posterW, posterH };
}

function rebuildOrder() {
  order = [];
  for (let i = 0; i < tiles.length; i++) order.push(i);
  shuffleArray(order);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
