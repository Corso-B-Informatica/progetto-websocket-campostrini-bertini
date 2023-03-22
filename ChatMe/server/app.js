const express = require('express');
const config = require('./config.js');
const socketio = require("socket.io");
const database = require('./database.js');
const register = require('./register.js');
const confirm = require('./confirm.js');
const login = require('./login.js');
const chat = require('./chat.js');
const forgotPassword = require('./forgotPassword.js');
const crypto = require('./crypto.js');
const socketList = require('./socketList.js');

/*Express*/
const app = express();

app.use(express.static("../client"));

/*Socket.io*/
//http server sempre sulla porta 8080
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

  socket.on("register", (armored_email, armored_password, armored_nickname, publicKeyArmored, link) => {
    register.checkUserData(armored_email, armored_password, armored_nickname, publicKeyArmored, link, socket);
  });

  socket.on("confirmViaLink", (email, password, nickname, verification_code, rememberMe, pubKey, aesKey) => {
    confirm.confirmUserViaLink(email, password, nickname, verification_code, rememberMe, pubKey, aesKey, socket);
  });

  socket.on("confirmViaCodeByStorage", (email, nickname, password, verification_code, rememberMe, pubKey, aesKey) => {
    confirm.confirmUserViaCode(email, nickname, password, verification_code, rememberMe, pubKey, aesKey, socket, "storage");
  });

  socket.on("confirmViaCodeByInput", (email, nickname, password, verification_code, rememberMe, pubKey, aesKey) => {
    confirm.confirmUserViaCode(email, nickname, password, verification_code, rememberMe, pubKey, aesKey, socket, "input");
  });

  socket.on("getCodeByStorage", (email, nickname, password, pubKey, link) => {
    confirm.sendCode(email, nickname, password, pubKey, link, socket, "storage");
  });

  socket.on("getCodeByInput", (email, nickname, password, pubKey, link) => {
    confirm.sendCode(email, nickname, password, pubKey, link, socket, "input");
  });

  socket.on("forgotPassword", (email, nickname) => {
    forgotPassword.forgotPassword(email, nickname, socket);
  });

  socket.on("getAesKey", (email, nickname, password, pubKey) => {
    chat.sendAesKey(email, nickname, password, pubKey, socket);
  });

  socket.on("message", (crypted_message, crypted_nickname, crypted_password, crypted_id, crypted_pubKey) => {
    chat.sendMessage(crypted_message, crypted_nickname, crypted_password, crypted_id, crypted_pubKey, socket);
  });

  socket.on("sync", (crypted_nickname, crypted_password, crypted_pubKey) => {
    chat.sync(crypted_nickname, crypted_password, crypted_pubKey, socket);
  });

  socket.on("newChat", (crypted_nickname, crypted_password, crypted_chatName, crypted_pubKey) => {
    chat.newChat(crypted_nickname, crypted_password, crypted_chatName, crypted_pubKey, socket);
  });
  
  socket.on("getNewMessages", (crypted_nickname, crypted_password, crypted_pubKey) => {
    chat.getNewMessages(crypted_nickname, crypted_password, crypted_pubKey, socket);
  });
});

io.on("disconnect", (socket) => {
  socket.broadcast.emit("offline", socketList.getSocketId(socket));
});

setInterval(database.cleanDatabase, 60000);
setInterval(database.updateWaitTime, 1000);
setInterval(database.updateWaitTimeCode, 1000);