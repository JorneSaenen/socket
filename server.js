const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = 3000;
app.use(express.static("public"));
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server);
let users = {};

io.on("connection", (socket) => {
  console.log("client connected");
  socket.on("join", (username) => {
    users[socket.id] = username;
    socket.broadcast.emit("user joined", username);
    io.emit("user-list-update", users);
  });

  socket.on("message", ({ mess, toId }) => {
    const msg = {
      username: users[socket.id],
      text: mess,
      time: Date.now(),
    };
    if (toId !== "-1") {
      io.to(toId)
        .except(socket.id)
        .emit("message", { ...msg, private: true });
      io.to(socket.id).emit("message", msg);
    } else {
      io.emit("message", msg);
    }
  });

  socket.on("typing", () => {
    socket.broadcast.emit("typing", users[socket.id]);
  });

  socket.on("stop typing", () => {
    socket.broadcast.emit("stop typing");
  });

  socket.on("disconnect", () => {
    if (users[socket.id]) {
      socket.broadcast.emit("user left", users[socket.id]);
      delete users[socket.id];
      io.emit("user-list-update", users);
    }
  });
});

server.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
