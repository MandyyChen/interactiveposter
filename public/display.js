let socket;
let tiles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  imageMode(CENTER);

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

    const maxW = windowWidth * 0.35;   
    const maxH = windowHeight * 0.35;  

    const scaleFactor = min(maxW / img.width, maxH / img.height);
    const scale = scaleFactor * random(0.7, 1.0);

    const w = img.width * scale;
    const h = img.height * scale;

    const margin = 30;

    const x = random(margin + w/2, width - margin - w/2);
    const y = random(margin + h/2, height - margin - h/2);

    tiles.push({ img, x, y, w, h });

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

  for (const t of tiles) {
    if (!t.img) continue;
    image(t.img, t.x, t.y, t.w, t.h);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
