const express = require('express');
const socketio = require("socket.io");
const config = require("./config.js");
const crypto = require('./crypto.js');
const database = require('./database.js');
const register = require('./register.js');

/*Express*/
const app = express();
app.use(express.static("../client"));

/*Socket.io*/
const server = app.listen(config.port, () => {
  console.log("Server in ascolto sulla porta " + config.port);
});

const io = socketio(server);

io.on("connection", (socket) => {
  socket.on("getPublicKey", () => {
    socket.emit("publicKey", crypto.getPublicKey());
  });

  socket.on("register", (armored_email, armored_password, armored_nickname, armored_remember, publicKeyArmored) => {
    register.checkUserData(armored_email, armored_password, armored_nickname, armored_remember, publicKeyArmored, socket);
  });

  socket.on("confirmViaLink", (email, password, nickname, verification_code, publicKeyArmored, aesKey) => {
    confirmUserDataViaLink(email, password, nickname, verification_code, publicKeyArmored, aesKey, socket);
  });

  socket.on("confirmViaCode", (email, password, nickname, verification_code) => {
    confirmUserDataViaCode(email, password, nickname, verification_code, socket);
  });
});

setInterval(database.cleanDatabase, 300000);