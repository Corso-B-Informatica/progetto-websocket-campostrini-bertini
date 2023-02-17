const express = require("express");
const config = require("./config.js");
const socketio = require("socket.io");
const openpgp = require("openpgp");
var AES = require("crypto-js/aes");
const sqlite3 = require("sqlite3").verbose();

const passphrase = `sgk#^Ca!5s=Gq;jY|~tm98@Wyoze3nJAl-80Ecc%1vx33uG7qd]+nbLRi4-]oK![hbu@B>}l\qkFQFyKw[d|eXC#\`nBaZ|qg.Wk"KW8joLbVHx6Vim#LJ[2x7?O@mP{nFBYk\BRKzIW94vfWynq\oiE:h|9<:1l*gtT3o8l=^h%iL-JYB?Y?3$1p+e>2rsD:_E-@>nS:*s6|E(as\`2.Oo&4w[1QZLV!JG8|RwfX)k|W)'t}Kh$/4S!<[5dv*C}i=<-&0*t4Qp_NY9h[Qn\}aW=fk@LZL=o,+K_8]2v3e<h~;#LH'~ln\`F^Cc\}GC$ly'?*.E!JyWy8mFv2gI4Y+dWCLf=n=(2qsZX/'rWR.~$c5\lz?<Qy81ZZ=HkF{7?O.wQ$M2"9Jr;wlYhcwP"qkPCy06>{_r0btfNdN9*di>oa,so{f$8\`;la*&L-5%@?5!\CT6vli9.oO&pr/+:9!D[1dG-k'WQ6O9*A\~Y%j2DNt2d;"sKZz&IpE7qkRCH"US:`; // what the private key is encrypted with

function encryptData(data) {
  (async () => {
    //generazione chiavi
    const { privateKey, publicKey, revocationCertificate } =
      await openpgp.generateKey({
        type: "ecc",
        curve: "curve25519",
        userIDs: [{ name: "Jon Smith", email: "jon@example.com" }],
        passphrase: `sgk#^Ca!5s=Gq;jY|~tm98@Wyoze3nJAl-80Ecc%1vx33uG7qd]+nbLRi4-]oK![hbu@B>}l\qkFQFyKw[d|eXC#\`nBaZ|qg.Wk"KW8joLbVHx6Vim#LJ[2x7?O@mP{nFBYk\BRKzIW94vfWynq\oiE:h|9<:1l*gtT3o8l=^h%iL-JYB?Y?3$1p+e>2rsD:_E-@>nS:*s6|E(as\`2.Oo&4w[1QZLV!JG8|RwfX)k|W)'t}Kh$/4S!<[5dv*C}i=<-&0*t4Qp_NY9h[Qn\}aW=fk@LZL=o,+K_8]2v3e<h~;#LH'~ln\`F^Cc\}GC$ly'?*.E!JyWy8mFv2gI4Y+dWCLf=n=(2qsZX/'rWR.~$c5\lz?<Qy81ZZ=HkF{7?O.wQ$M2"9Jr;wlYhcwP"qkPCy06>{_r0btfNdN9*di>oa,so{f$8\`;la*&L-5%@?5!\CT6vli9.oO&pr/+:9!D[1dG-k'WQ6O9*A\~Y%j2DNt2d;"sKZz&IpE7qkRCH"US:`, // protects the private key
        format: "armored",
      });
    console.log(privateKey);
    console.log(publicKey);
    console.log(revocationCertificate);

    //lettura chiavi
    const public = await openpgp.readKey({
      armoredKey: publicKey,
    });

    const private = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({
        armoredKey: privateKey,
      }),
      passphrase,
    });

    //cifratura messaggio
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: data }),
      encryptionKeys: public
    });
    console.log(encrypted);
  })();
}
encryptData("chiave da criptare");
/*(async () => {

  const message = await openpgp.readMessage({
    armoredMessage: encrypted, // parse armored message
  });
  const { data: decrypted, signatures } = await openpgp.decrypt({
    message,
    verificationKeys: publicKey, // optional
    decryptionKeys: privateKey,
  });
  console.log(decrypted); // 'Hello, World!'
  // check signature validity (signed messages only)
  try {
    await signatures[0].verified; // throws on invalid signature
    console.log("Signature is valid");
  } catch (e) {
    throw new Error("Signature could not be verified: " + e.message);
  }
})();*/

const app = express();
app.use(express.static("../client"));

const users = [
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
}

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

io.on("connection", (socket) => {
  socket.on("getPublicKey", (publicKeyClient) => {
    io.emit("publicKey", publicKey);
  });
  socket.on("register", (cemail, cpassword, cnickname) => {
    email = decrypt(cemail);
    password = decrypt(cpassword);
    nickname = decrypt(cnickname);
    const newUser = {
      email: email,
      username: nickname,
      password: password,
    };
    users.push(newUser);
    io.emit(
      "confirm",
      "Registrazione avvenuta con successo. Benvenuto " + cnickname
    );
  });
});
