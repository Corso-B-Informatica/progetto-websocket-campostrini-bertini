const express = require('express');
const socketio = require("socket.io");
const config = require("./config.js");
const crypto = require('./crypto.js');
const emailer = require('./emailer.js');
const database = require('./database.js');
const validator = require('./validator.js');

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

  socket.on("register", (armored_email, armored_password, armored_nickname) => {
    checkUserData(armored_email, armored_password, armored_nickname, socket);
  });
  socket.on("confirmViaLink", (email, password, nickname, verification_code, publicKey) => {
    confirmUserDataViaLink(email, password, nickname, verification_code, publicKey, socket);
  });

  socket.on("confirmViaCode", (email, password, nickname, verification_code) => {
    //da fare
    confirmUserDataViaCode(email, password, nickname, verification_code, socket);
  });
});


// async function checkUserData(
//   armored_email,
//   armored_password,
//   armored_nickname,
//   socket
// ) {
//   const { data: email } = await crypto.decrypt(armored_email);

//   const { data: password } = await crypto.decrypt(armored_password);

//   const { data: nickname } = await crypto.decrypt(armored_nickname);

//   var check1 = validator.checkUsername(nickname);
//   var check2 = validator.checkEmail(email);
//   var check3 = validator.checkPassword(password);

//   //se i dati sono validi
//   if (check1 && check2 && check3) {
//     //se esiste nel database di utenti un utente con lo stesso nickname o email
//     if (database.existInUsersDatabase(email, nickname)) {
//       console.log("Utente già registrato");
//       socket.emit("registerError", "User already registered");
//     } else if (database.existInTempDatabase(email, nickname)) {
//       //se esiste nel database temporaneo un utente con lo stesso nickname o email
//       console.log("Utente già registrato");
//       socket.emit("registerError", "User already registered");
//     } else {
//       //altrimenti crea un nuovo utente
//       console.log("Utente non registrato");
//       registerUser(email, password, nickname, socket);
//     }
//   } else {
//     console.log("Dati non validi");
//     sendErrors(nickname, password, check1, check2, check3, socket);
//   }
// }

function sendErrors(nickname, password, check1, check2, check3, socket) {
  var errors = "";

  if (!check1) {
    if (nickname.length == 0) {
      errors += "Username must be filled out\n";
    } else if (nickname.length > 30) {
      errors += "Username must be at most 30 characters long\n";
    } else if (!/[a-zA-Z0-9]/.test(nickname)) {
      errors += "Username must contain at least one letter or number\n";
    }
  }


  if (!check2) {
    errors += "Email must be valid\n";
  }

  if (!check3) {
    if (password.length == 0) {
      errors += "Password must be filled out\n";
    } else if (password.length < 8) {
      errors += "Password must be at least 8 characters long\n";
    } else if (password.length > 50) {
      errors += "Password must be at most 50 characters long\n";
    } else if (!/[a-z]/.test(password)) {
      errors += "Password must contain at least one lowercase letter\n";
    } else if (!/[A-Z]/.test(password)) {
      errors += "Password must contain at least one uppercase letter\n";
    } else if (!/[0-9]/.test(password)) {
      errors += "Password must contain at least one number\n";
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors += "Password must contain at least one special character\n";
    }
  }

  socket.emit("registerDataError", check1, check2, check3, errors);
}

function registerUser(email, password, nickname, socket) {
  const verification_code = CryptoJS.lib.WordArray.random(5).toString();

  console.log(verification_code);

  const expiration_time = new Date();

  expiration_time.setDate(expiration_time.getDate() + 1);

  database.insertTempUser(nickname, email, password, verification_code, expiration_time, 0, (err) => {
    if (err) {
      console.log("Errore durante l'aggiunta dell'utente a temp-users");
      socket.emit(
        "registerError",
        "Error during registration, please try again"
      );
    } else {
      emailer.sendCodeViaEmail(email, nickname, verification_code, expiration_time);
      console.log("Utente aggiunto a temp-users");

      var crypted_email = crypto.encryptAES(email);
      var crypted_password = crypto.encryptAES(password);
      var crypted_nickname = crypto.encryptAES(nickname);

      socket.emit("registerSuccess", crypted_email, crypted_password, crypted_nickname);
    }
  });
}
//setInterval(database.cleanDatabase, 300000);