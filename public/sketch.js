let symmetry = 5;
let angle = 360 / symmetry;
let sizeSlider, clearButton;
let fontsize = 20;
let saveButton;
let socket; 
let cnv;
//how to make more r
//test video/gif

const COLORS = [
  [249, 215, 28],  // yellow
  [217, 80, 126],  // pink
  [237, 91, 41],  // orange
  [0, 224, 241]   // blue
];

let mode = "single";   
let colorIndex = 0;
let waveSeed = 12345;

let rows = 4;            // number of wave layers
let waveMaxHeight = 150; // vertical range of a single wave
let baseT = 0;           // time parameter for animation

let strokesLayer;

function setup() {
  cnv = createCanvas(400, 600);
  angleMode(DEGREES);

  socket = io();
  socket.on("connect", () => {
  console.log("Maker socket connected:", socket.id);
  });

  strokesLayer = createGraphics(width, height);
  strokesLayer.angleMode(DEGREES);
  strokesLayer.noFill();
  strokesLayer.stroke(255);
  strokesLayer.strokeCap(ROUND);
  strokesLayer.strokeJoin(ROUND);

  textSize(fontsize);
  textAlign(CENTER, CENTER);

  clearButton = createButton('clear / randomize');
  clearButton.mousePressed(clearAndRandomize);

  createSpan(' ');
  createSpan('Brush Size ');
  sizeSlider = createSlider(1, 32, 4, 1);

  randomizeMode();
  drawBackground();
  saveButton = createButton('save png');
  saveButton.mousePressed(savePoster);
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

function drawSymBrush(g) {
  g.push();
  g.translate(width / 2, height / 2);

  g.stroke(255);
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
}

function touchMoved() {
  return false;
}

function isPointerDown() {
  return mouseIsPressed || touches.length > 0;
}

function clearAndRandomize() {
  strokesLayer.clear();
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

// wave credit code: pippinbarr
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

function savePoster() {
  console.log("Save button clicked");

  const ts = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fname = [
    'YDesign',
    ts.getFullYear(),
    pad(ts.getMonth() + 1),
    pad(ts.getDate()),
    pad(ts.getHours()),
    pad(ts.getMinutes()),
    pad(ts.getSeconds())
  ].join('_');

  // local download
  saveCanvas(fname, 'png');

  // send to wall
  if (cnv && socket && socket.connected) {
    const dataUrl = cnv.elt.toDataURL("image/png");
    console.log("Emitting newPoster to server");
    socket.emit("newPoster", dataUrl);
  } else {
    console.log("Socket not connected or canvas missing", { cnv, socket });
  }
}

// shortcut
function keyPressed() {
  if (key === 's' || key === 'S') savePoster();
}


// text

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
