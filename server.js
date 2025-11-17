const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(express.static("public"));

const posters = []; 

io.on("connection", (socket) => {
  console.log("user connected:", socket.id);

  socket.emit("initPosters", posters);

  socket.on("newPoster", (dataUrl) => {
    const poster = { dataUrl, ts: Date.now() };
    posters.push(poster);

    if (posters.length > 300) posters.shift();

    io.emit("posterAdded", poster);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`YDesign wall running at http://localhost:${PORT}`);
});
