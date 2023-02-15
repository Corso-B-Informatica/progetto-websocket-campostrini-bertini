const express = require("express");
const config = require("./config.js");
const socketio = require("socket.io");
const openpgp = require("openpgp");
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.static("../client"));

const users = [
  {
    email: "user1@example.com",
    username: "user1",
    password: "password1",
    eta: 20
  }
];

var db;
db = new sqlite3.Database('./db/users.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err && err.code == "SQLITE_CANTOPEN") {
        createDatabase();
        return;
        } else if (err) {
            console.log("Getting error " + err);
            exit(1);
    }
    insertUser(db, users[0]);
});

function createDatabase() {
  var newdb = new sqlite3.Database('./db/users.db', (err) => {
      if (err) {
          console.log("Getting error " + err);
          exit(1);
      }
      createTables(newdb);
  });
}

function createTables(newdb) {
  newdb.exec(`
  create table users (
      username text primary key not null,
      email text not null,
      password text not null,
      eta int 
  );`, (err) => {
    console.log("Error creating tables: " + err);
  });
}

function getUsers(db) {
  db.all(`
  select * from users`, (err, rows) => {
      rows.forEach(row => {
          console.log(row);
      });
  });
}

function insertUser(db, newUser) {
  console.log(newUser);
  db.all(`insert into users (username, email, password, eta)
  values (?, '?', '?', '?');`, [newUser.username, newUser.email, newUser.password, newUser.eta], (err, rows) => {
      if (err) {
          console.log("Error inserting user: " + err);
      }
  });
}

const server = app.listen(config.port, () => {
  console.log("Server in ascolto sulla porta " + config.port);
});

const publicKey = 'xjMEY+OA6hYJKwYBBAHaRw8BAQdAE2OJacHeP3Is1YPbia1aaWRKO3o9qQ1mTd8JpQiJ0F3NG1BpYXJkaSA8cGlhcmRpQGV4YW1wbGUuY29tPsKMBBAWCgA+BQJj44DqBAsJBwgJEAIDKbBMPQe/AxUICgQWAAIBAhkBAhsDAh4BFiEEVYABPTDZBtd6GDW1AgMpsEw9B78AAL2zAP9mMnKN+zeLmY6btip8EBttEoW07LFdvKQtPod6Bg1rRwEA/m5J29C5tA4d877+k8c5oU+MFaL7/rG4LGymPZEGFAbOOARj44DqEgorBgEEAZdVAQUBAQdArxxEvRZtPAYTB+J3sJFsQ9Ds2LpYWLfVFuGguzJgq2MDAQgHwngEGBYIACoFAmPjgOoJEAIDKbBMPQe/AhsMFiEEVYABPTDZBtd6GDW1AgMpsEw9B78AAAGsAQDcLYVpeMmgWue/mAHVzWZa9SYuIVXfiYNalGO79il0RwEA7UR489bRj/7ksSnM0lQOkhuxJVJihThnmTi7kNEjnw0==99ZC';
const privateKey = 'xYYEY+OA6hYJKwYBBAHaRw8BAQdAE2OJacHeP3Is1YPbia1aaWRKO3o9qQ1mTd8JpQiJ0F3+CQMILXavJP7Dgv/g+0TSGXPuCL5sGl1eArmEr5Ydg5MNMU9naYBswVesaGQIUUo6MwiWQ8ib88+2pth0ZQ9EedKxwky/qdd82MxQqlpKcWEbLc0bUGlhcmRpIDxwaWFyZGlAZXhhbXBsZS5jb20+wowEEBYKAD4FAmPjgOoECwkHCAkQAgMpsEw9B78DFQgKBBYAAgECGQECGwMCHgEWIQRVgAE9MNkG13oYNbUCAymwTD0HvwAAvbMA/2Yyco37N4uZjpu2KnwQG20ShbTssV28pC0+h3oGDWtHAQD+bknb0Lm0Dh3zvv6TxzmhT4wVovv+sbgsbKY9kQYUBseLBGPjgOoSCisGAQQBl1UBBQEBB0CvHES9Fm08BhMH4newkWxD0OzYulhYt9UW4aC7MmCrYwMBCAf+CQMIDk90TM9eDcbgh91DAFhL/oS94DiGXAaAZgiEYSCxKQ6nkWHrg0m5EUGBARcv7ecF+5q77aFnEe2ggrphzPWNd7fQmxNzDPMknYK5ZW6FmcJ4BBgWCAAqBQJj44DqCRACAymwTD0HvwIbDBYhBFWAAT0w2QbXehg1tQIDKbBMPQe/AAABrAEA3C2FaXjJoFrnv5gB1c1mWvUmLiFV34mDWpRju/YpdEcBAO1EePPW0Y/+5LEpzNJUDpIbsSVSYoU4Z5k4u5DRI58N=mJgw';




async function decrypt(cryptedmessage) {
  await privateKey.decrypt(passphrase);
  const decrypted = await openpgp.decrypt({
    message: cryptedmessage,
    privateKeys: [privateKey],
  });
};
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
    email = decrypt(cemail);
    password = decrypt(cpassword);
    nickname = decrypt(cnickname);
    const newUser = {
      email: email,
      username: nickname,
      password: password
    };    
    users.push(newUser);
    io.emit("confirm", "Registrazione avvenuta con successo. Benvenuto " + cnickname);
  });
});
