const express = require("express");
const config = require("./config.js");
const socketio = require("socket.io");
const fs = require("fs");


const app = express();
app.use(express.static("../client"));
const users = [
  {
    email: "user1@example.com",
    username: "user1",
    password: "password1"
  }
];
const server = app.listen(config.port, () => {
  console.log("Server in ascolto sulla porta " + config.port);
});


fs.readFile("pgpkeys.txt", "utf8", (err, data) => {
  if (err) throw err;
  const publicKey = data.slice(1113, 1667);
  const privateKey = data.slice(258, 1036);
  console.log(publicKey);
  console.log(privateKey);
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

io.on("connection", (socket) => {
  socket.on("getPublicKey", (publicKeyClient) => {
    io.emit("publicKey", publicKey);
  });
  socket.on("register",(cemail,cpassword,cnickname) => {
    const newUser = {
      email: cemail,
      username: cnickname,
      password: cpassword
    };    
    users.push(newUser);
    io.emit("confirm", "Registrazione avvenuta con successo. Benvenuto " + cnickname);
  });
});