let symmetry = 5;
let angle = 360 / symmetry;
let sizeSlider, clearButton;
let fontsize = 20;
let saveButton, sendButton;
let socket;
let cnv;

const COLORS = [
  [253, 239, 20],
  [177, 235, 0],
  [74, 168, 219],
  [255, 133, 203]
];

const BRUSH_COLORS = [
  [255, 255, 255],
  [253, 239, 20],
  [177, 235, 0],
  [74, 168, 219],
  [255, 133, 203]
];

let currentBrushColor = BRUSH_COLORS[0];

let mode = "single";
let colorIndex = 0;
let waveSeed = 12345;

let rows = 4;
let waveMaxHeight = 150;
let baseT = 0;

let strokesLayer;
let strokeEvents = [];

const BASE_W = 400;
const BASE_H = 600;

function calcCanvasSize() {
  const margin = 32;
  const controlsH = 160;

  const maxW = Math.min(BASE_W, windowWidth - margin * 2);
  const maxH = Math.min(BASE_H, windowHeight - margin * 2 - controlsH);

  const scale = Math.min(maxW / BASE_W, maxH / BASE_H, 1);

  return {
    w: BASE_W * scale,
    h: BASE_H * scale
  };
}

function setup() {
  const size = calcCanvasSize();
  cnv = createCanvas(size.w, size.h);

  const canvasWrapper = select('#canvas-wrapper');
  if (canvasWrapper) cnv.parent(canvasWrapper);

  angleMode(DEGREES);

  socket = io();
  socket.on("connect", () => {
    console.log("Maker socket connected:", socket.id);
  });

  strokesLayer = createGraphics(width, height);
  strokesLayer.angleMode(DEGREES);
  strokesLayer.noFill();
  strokesLayer.strokeCap(ROUND);
  strokesLayer.strokeJoin(ROUND);

  textSize(fontsize);
  textAlign(CENTER, CENTER);

  const controls = select('#controls') || createDiv().id('controls');

  clearButton = createButton('Clear');
  clearButton.parent(controls);
  clearButton.mousePressed(clearAndRandomize);

  const label = createSpan('Brush');
  label.parent(controls);
  label.addClass('label');

  sizeSlider = createSlider(1, 32, 4, 1);
  sizeSlider.parent(controls);

  const colorLabel = createSpan('Ink');
  colorLabel.parent(controls);
  colorLabel.addClass('label');

  const colorRow = createDiv();
  colorRow.parent(controls);
  colorRow.addClass('color-row');

  BRUSH_COLORS.forEach(c => {
    const swatch = createSpan(' ');
    swatch.parent(colorRow);
    swatch.addClass('swatch');
    swatch.style('background-color', `rgb(${c[0]}, ${c[1]}, ${c[2]})`);
    swatch.mousePressed(() => {
      currentBrushColor = c;
    });
  });

  saveButton = createButton('Save PNG');
  saveButton.parent(controls);
  saveButton.addClass('secondary');
  saveButton.mousePressed(savePosterLocally);

  sendButton = createButton('Send to wall');
  sendButton.parent(controls);
  sendButton.mousePressed(sendPosterToWall);

  randomizeMode();
  drawBackground();
}

function draw() {
  drawBackground();

  if (mode === "waves") baseT += 0.01;

  image(strokesLayer, 0, 0);

  push();
  resetMatrix();
  drawWords();
  pop();

  if (isPointerDown() &&
      mouseX >= 0 && mouseX < width &&
      mouseY >= 0 && mouseY < height) {
    drawSymBrush(strokesLayer);
  }
}

function windowResized() {
  const size = calcCanvasSize();
  resizeCanvas(size.w, size.h);

  const newLayer = createGraphics(width, height);
  newLayer.angleMode(DEGREES);
  newLayer.noFill();
  newLayer.strokeCap(ROUND);
  newLayer.strokeJoin(ROUND);
  strokesLayer = newLayer;

  drawBackground();
}

function drawSymBrush(g) {
  g.push();
  g.translate(width / 2, height / 2);

  g.stroke(...currentBrushColor);
  g.strokeWeight(sizeSlider.value());

  let mx  = mouseX  - width / 2;
  let my  = mouseY  - height / 2;
  let pmx = pmouseX - width / 2;
  let pmy = pmouseY - height / 2;

  for (let i = 0; i < symmetry; i++) {
    g.rotate(angle);
    g.line(mx, my, pmx, pmy);
    g.push();
    g.scale(1, -1);
    g.line(mx, my, pmx, pmy);
    g.pop();
  }
  g.pop();

  strokeEvents.push({
    mx,
    my,
    pmx,
    pmy,
    color: [...currentBrushColor],
    weight: sizeSlider.value()
  });
}

function touchMoved() {
  return false;
}

function isPointerDown() {
  return mouseIsPressed || touches.length > 0;
}

function clearAndRandomize() {
  strokesLayer.clear();
  strokeEvents = [];
  randomizeMode();
  drawBackground();
}

function randomizeMode() {
  const modes = ["single", "quads", "waves"];
  mode = random(modes);
  colorIndex = floor(random(COLORS.length));
  waveSeed = floor(random(1e6));
}

function drawBackground() {
  push();
  resetMatrix();
  background(255);

  if (mode === "single") drawSingle();
  else if (mode === "quads") drawQuads();
  else drawWaves(rows);

  drawWords();
  pop();
}

function drawSingle() {
  noStroke();
  fill(...COLORS[colorIndex % COLORS.length]);
  rect(0, 0, width, height);
}

function drawQuads() {
  noStroke();
  const w = width / 2, h = height / 2;
  fill(...COLORS[0]); rect(0, 0, w, h);
  fill(...COLORS[1]); rect(w, 0, w, h);
  fill(...COLORS[2]); rect(0, h, w, h);
  fill(...COLORS[3]); rect(w, h, w, h);
}

function drawWaves(number) {
  let overlap = waveMaxHeight * 0.4;
  let totalHeight = height + waveMaxHeight;
  let spacing = (totalHeight + overlap) / number;

  for (let i = number - 1; i >= 0; i--) {
    drawWave(i, number, spacing, overlap);
  }
}

function drawWave(n, totalRows, spacing, overlap) {
  let baseY = height - n * spacing + overlap / 2;
  let t = baseT + n * 100 + waveSeed * 0.001;

  noStroke();
  fill(...COLORS[n % COLORS.length]);

  beginShape();
  vertex(0, baseY);

  for (let x = 0; x <= width; x += 10) {
    let y = baseY - map(noise(t), 0, 1, 10, waveMaxHeight);
    vertex(x, y);
    t += 0.01;
  }

  vertex(width, baseY);
  vertex(width, height);
  vertex(0, height);
  endShape(CLOSE);
}

function buildFilenamePrefix() {
  const ts = new Date();
  const pad = n => String(n).padStart(2, '0');
  return [
    'YDesign',
    ts.getFullYear(),
    pad(ts.getMonth() + 1),
    pad(ts.getDate()),
    pad(ts.getHours()),
    pad(ts.getMinutes()),
    pad(ts.getSeconds())
  ].join('_');
}

function savePosterLocally() {
  const fname = buildFilenamePrefix();
  saveCanvas(fname, 'png');
}

function sendPosterToWall() {
  if (!cnv || !socket || !socket.connected) return;
  const dataUrl = cnv.elt.toDataURL("image/png");
  socket.emit("newPoster", {
    dataUrl,
    strokes: strokeEvents
  });
}

function keyPressed() {
  if (key === 's' || key === 'S') savePosterLocally();
}

function drawWords() {
  push();
  noStroke();
  fill(20);

  let s = 1.3;

  textAlign(LEFT, TOP);

  textStyle(BOLD);
  textSize(18 * s);
  text('YDesign', 18, 20);

  textStyle(NORMAL);
  textSize(10 * s);
  text('Yale’s Inaugural Design', 20, 43);
  text('Conference & Designathon', 20, 57);

  textAlign(RIGHT, TOP);
  textStyle(BOLD);
  textSize(18 * s);
  text('02.06 - 02.08', width - 20, 20);

  textStyle(NORMAL);
  textSize(10 * s);
  text('Hosted at Tsai CITY', width - 20, 43);

  textAlign(RIGHT, BOTTOM);
  textStyle(BOLD);
  textSize(14 * s);
  text('Playground of creativity', width - 20, height - 60);

  textStyle(NORMAL);
  textSize(10 * s);
  text('Open to all Yale graduates and undergraduates.', width - 20, height - 45);
  text('Register now at @yaledesignathon', width - 20, height - 30);

  pop();
}
