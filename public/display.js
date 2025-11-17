let socket;
let tiles = [];
let order = []; 

const POSTER_W = 400;
const POSTER_H = 600;
const SHUFFLE_INTERVAL_FRAMES = 100; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  imageMode(CORNER);

  socket = io();
  socket.on("connect", () => {
    console.log("Display socket connected:", socket.id);
  });

  socket.on("initPosters", (data) => {
    console.log("initPosters received:", data.length);
    data.forEach(p => addPosterTile(p.dataUrl));
  });

  socket.on("posterAdded", (p) => {
    console.log("posterAdded received");
    addPosterTile(p.dataUrl);
  });
}

function addPosterTile(dataUrl) {
  loadImage(dataUrl, (img) => {
    tiles.push({ img });
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
    return;
  }

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
  for (let i = 0; i < tiles.length; i++) {
    order.push(i);
  }
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
