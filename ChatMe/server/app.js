const express = require("express");
const config = require("./config.js");
const socketio = require("socket.io");
const openpgp = require("openpgp");
var CryptoJS = require("crypto-js");
const sqlite3 = require("sqlite3").verbose();

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
    socket.emit("publicKey", publicKey);
  });
  socket.on(
    "register",
    (crypted_email, crypted_password, crypted_nickname, crypted_key) => {
      console.log(crypted_email);
      console.log(crypted_password);
      console.log(crypted_nickname);
      console.log(crypted_key);
      key = decryptPGP(crypted_key);
      email = decryptAES(decryptPGP(crypted_email, key));
      password = decryptAES(decryptPGP(crypted_password, key));
      nickname = decryptAES(decryptPGP(crypted_nickname, key));
      /*const newUser = {
      email: email,
      username: nickname,
      password: password,
    };*/
      //se l'utente non è già presente e se il formato è corretto
      //manda una mail di conferma della registrazione e salva il codice di registrazione assieme all'utente
      //riceve il codice di conferma dal client e l'utente è stato creato
      //se non si riceve il codice di conferma entro 24 ore l'utente viene eliminato
      //se viene ricevuto semplicente si toglie dal database la data di scadenza del codice di registrazione e il codice di registrazione
      //se l'utente richiede più di un codice di conferma per la stessa registrazione, viene mandato quello precedentemente salvato nel database
      //users.push(newUser);
      socket.emit(
        "confirm",
        "Registrazione avvenuta con successo. Benvenuto " + cnickname
      );
    }
  );
});

/*Public Key*/
const publicKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEY+OA6hYJKwYBBAHaRw8BAQdAE2OJacHeP3Is1YPbia1aaWRKO3o9qQ1m
Td8JpQiJ0F3NG1BpYXJkaSA8cGlhcmRpQGV4YW1wbGUuY29tPsKMBBAWCgA+
BQJj44DqBAsJBwgJEAIDKbBMPQe/AxUICgQWAAIBAhkBAhsDAh4BFiEEVYAB
PTDZBtd6GDW1AgMpsEw9B78AAL2zAP9mMnKN+zeLmY6btip8EBttEoW07LFd
vKQtPod6Bg1rRwEA/m5J29C5tA4d877+k8c5oU+MFaL7/rG4LGymPZEGFAbO
OARj44DqEgorBgEEAZdVAQUBAQdArxxEvRZtPAYTB+J3sJFsQ9Ds2LpYWLfV
FuGguzJgq2MDAQgHwngEGBYIACoFAmPjgOoJEAIDKbBMPQe/AhsMFiEEVYAB
PTDZBtd6GDW1AgMpsEw9B78AAAGsAQDcLYVpeMmgWue/mAHVzWZa9SYuIVXf
iYNalGO79il0RwEA7UR489bRj/7ksSnM0lQOkhuxJVJihThnmTi7kNEjnw0=
=99ZC
-----END PGP PUBLIC KEY BLOCK-----`;

/*Private Key*/
const privateKey = `-----BEGIN PGP PRIVATE KEY BLOCK-----

xYYEY+OA6hYJKwYBBAHaRw8BAQdAE2OJacHeP3Is1YPbia1aaWRKO3o9qQ1m
Td8JpQiJ0F3+CQMILXavJP7Dgv/g+0TSGXPuCL5sGl1eArmEr5Ydg5MNMU9n
aYBswVesaGQIUUo6MwiWQ8ib88+2pth0ZQ9EedKxwky/qdd82MxQqlpKcWEb
Lc0bUGlhcmRpIDxwaWFyZGlAZXhhbXBsZS5jb20+wowEEBYKAD4FAmPjgOoE
CwkHCAkQAgMpsEw9B78DFQgKBBYAAgECGQECGwMCHgEWIQRVgAE9MNkG13oY
NbUCAymwTD0HvwAAvbMA/2Yyco37N4uZjpu2KnwQG20ShbTssV28pC0+h3oG
DWtHAQD+bknb0Lm0Dh3zvv6TxzmhT4wVovv+sbgsbKY9kQYUBseLBGPjgOoS
CisGAQQBl1UBBQEBB0CvHES9Fm08BhMH4newkWxD0OzYulhYt9UW4aC7MmCr
YwMBCAf+CQMIDk90TM9eDcbgh91DAFhL/oS94DiGXAaAZgiEYSCxKQ6nkWHr
g0m5EUGBARcv7ecF+5q77aFnEe2ggrphzPWNd7fQmxNzDPMknYK5ZW6FmcJ4
BBgWCAAqBQJj44DqCRACAymwTD0HvwIbDBYhBFWAAT0w2QbXehg1tQIDKbBM
PQe/AAABrAEA3C2FaXjJoFrnv5gB1c1mWvUmLiFV34mDWpRju/YpdEcBAO1E
ePPW0Y/+5LEpzNJUDpIbsSVSYoU4Z5k4u5DRI58N
=mJgw
-----END PGP PRIVATE KEY BLOCK-----`;

/*OpenPGP*/
function decryptPGP(data) {
  (async () => {
    //lettura chiavi
    const key = await openpgp.readKey({
      armoredKey: privateKey,
    });

    //decifratura messaggio
    const decrypted = await openpgp.decrypt({
      message: await openpgp.readMessage({
        armoredMessage: data,
      }),
      decryptionKeys: key,
    });
    return decrypted;
  })();
}
/*CryptoJS*/
function decryptAES(data, key) {
  return CryptoJS.AES.decrypt(data, key).toString(CryptoJS.enc.Utf8);
}

/*Database*/
/*const users = [
  {
    email: "user1@example.com",
    username: "user1",
    password: "password1",
    eta: 20,
  },
];

var db;
db = new sqlite3.Database("./db/users.db", sqlite3.OPEN_READWRITE, (err) => {
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
  var newdb = new sqlite3.Database("./db/users.db", (err) => {
    if (err) {
      console.log("Getting error " + err);
      exit(1);
    }
    createTables(newdb);
  });
}

function createTables(newdb) {
  newdb.exec(
    `
  create table users (
      username text primary key not null,
      email text not null,
      password text not null,
      eta int 
  );`,
    (err) => {
      console.log("Error creating tables: " + err);
    }
  );
}

function getUsers(db) {
  db.all(
    `
  select * from users`,
    (err, rows) => {
      rows.forEach((row) => {
        console.log(row);
      });
    }
  );
}

function insertUser(db, newUser) {
  console.log(newUser);
  db.all(
    `insert into users (username, email, password, eta)
  values (?, '?', '?', '?');`,
    [newUser.username, newUser.email, newUser.password, newUser.eta],
    (err, rows) => {
      if (err) {
        console.log("Error inserting user: " + err);
      }
    }
  );
}*/
