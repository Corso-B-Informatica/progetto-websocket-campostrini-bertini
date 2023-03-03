const express = require('express');
const socketio = require("socket.io");
const config = require("./config.js");
const crypto = require('./crypto.js');
const database = require('./database.js');
const register = require('./register.js');
const confirm = require('./confirm.js');
const login = require('./login.js');

/*Express*/
const app = express();
app.use(express.static("../client"));

/*Socket.io*/
const server = app.listen(config.port, () => {
  console.log("Server in ascolto sulla porta " + config.port);
});

const io = socketio(server);

io.on("connection", (socket) => {
  socket.on("getPublicKey", (str) => {
    socket.emit("publicKey", crypto.publicKey, str);
  });

  socket.on("login", (email, nickname, password, rememberMe, publicKey) => {
    login.login(email, nickname, password, rememberMe, publicKey, socket);
  });

  socket.on("register", (armored_email, armored_password, armored_nickname, publicKeyArmored) => {
    register.checkUserData(armored_email, armored_password, armored_nickname, publicKeyArmored, socket);
  });

  socket.on("confirmViaLink", (email, password, nickname, verification_code, rememberMe, publicKeyArmored, aesKey) => {
    confirm.confirmUserViaLink(email, password, nickname, verification_code, rememberMe, publicKeyArmored, aesKey, socket);
  });

  socket.on("confirmViaCode", (email, nickname, password, verification_code, rememberMe, publicKeyArmored, aesKey) => {
    confirm.confirmUserViaCode(email, nickname, password, verification_code, rememberMe, publicKeyArmored, aesKey, socket);
  });
  

  socket.on("getCode", (email, nickname, password, publicKeyArmored) => {
    confirm.sendCode(socket, email, nickname, password, publicKeyArmored);
  });
});

setInterval(database.cleanDatabase, 60000);