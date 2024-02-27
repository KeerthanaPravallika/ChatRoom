const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const botName = "ChatSphere Bot";

// set staic folder
app.use(express.static(path.join(__dirname, "public")));

// Run when client connects

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    socket.emit("message", formatMessage(botName, "Welcome to ChatRoom! "));

    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Broadcast when a user connects
    socket.broadcast.to(user.room).emit(
      "message",
      formatMessage(botName, `${user.username} has joined the chat`)
    );

    // send users and room info
    io.to(user.room).emit('roomUsers' , {
      room : user.room,
      users : getRoomUsers(user.room)
    })
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if(user)
    {
      io.to(user.room).emit("message", formatMessage(botName, `${user.username} has left the chat`));
    }

      // send users and room info
    io.to(user.room).emit('roomUsers' , {
      room : user.room,
      users : getRoomUsers(user.room)
    })
   
  });

  // Listen for chatMessage
  socket.on("chatMessage", (message) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, message));
  });
});

server.listen(3000, () => {
  console.log("Express server initialized");
});
