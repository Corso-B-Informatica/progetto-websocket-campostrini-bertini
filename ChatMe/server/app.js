const express = require("express");
const config = require("./config.js");
const socketio = require("socket.io");


const app = express();
app.use(express.static("../client"));

const server = app.listen(config.port, () => {
  console.log("Server in ascolto sulla porta " + config.port);
});

const io = socketio(server);
// var nicknames = [];
// io.on("connection", (socket) => {
//   socket.on("register", (nome) => {
//     console.log("client connesso");
//     socket.nome = nome;
//     console.log("Client connesso:", socket.nome);
//     socket.emit(
//       "confirm",
//       "Registrazione avvenuta con successo. Benvenuto " + socket.nome
//     );
//     socket.broadcast.emit("newuser", socket.nome + " si è unito alla chat.");
//     io.emit("newuser", socket.nome);
      
//   });
// });