const express = require('express');
const config = require("./config.js");
const socketio = require("socket.io");
const openpgp = require("openpgp");
var CryptoJS = require("crypto-js");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require('nodemailer');

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

/*Passphrase*/
var passphrase =
  'fsrL[yhRbtlES_rOyaYkaz!;XTiC;),w4V.P]zYEp<F@iLTWRk.)Ij`GZ}$u+>92]H]OA}B.)lCfi}tdrZ25cT-Mb~z*NxVH;Yens!OoEj=Nl&TCfzSp0#akDv>{ik%_HC7wX-[bXH<VRMa2Qb$0v~{(2B<lCA<)~X}AcTmp<aCXC7!d>a|pMC.U{;(MmE@X"a7bn/.R=9P)_E[yB0gqgQy(~#RzPLNuxURh@yK(98Mbvo59Tl9ZhNZBAOFnjN9%#dQBv2=p-)IFXHE2p.mP;a+7Ro`_me$!}-w$O3I0Go;z%B0bD7+k=kaWS"^W"xhuvQ{1#=F(jX-1ID(,NU|(=;=a>f,]8%osRE<{p9@.$H-CJh4dv>zT2!lb8/6|hpbFtl]ZQ(dr[X6h@BLc`z|2wHy(@xJ+3g++Sm)Is~?K^-*0!AtSYprX?l6!6~tcxOI:-zyAYib:"C]]32Dd5!v2U7G1t&iksW7g4=xH)6./]$)J[WEY2!u$MjW#gn';

/*AES Key*/
var AESKey =
  "5ef16edae3176232956802e6e138b2df3c20697b71bfba0793e7113a7644c80e63398b6def71f214b96a4c39722d899916830c3d1455f5ad19ceb92473a4210fa67dd4976670c5b42688aa7f04c3adcffb55372a5cdd051d6fc793a8c5f98a2d49e3d4b0a889c155f78da776aaeed10b10d0eff209840147e1bfb7c22f3ed3ef8673e91455f6dcde04db561826cd6e896aa2505224454a001b258e9ee702bcbffa220cc90c0dad4b6883cbdfbce664c957de1346883a2e02d7d6410d87ef73ea6a88e7fab818a4af237deeb7167cdb09766135c61ae357277cbf522ccee5052c1fc5a2025e9d3115f87e3c5ef782eca8659f8627ec08ad2fb9e36e13f84db447";

/*Express*/
const app = express();
app.use(express.static("../client"));

//declaration database
const db = new sqlite3.Database("./db/users.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the users database.");
});
const db1 = new sqlite3.Database("./db/temp-user.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the temp-users database.");
});

/*Socket.io*/
const server = app.listen(config.port, () => {
  console.log("Server in ascolto sulla porta " + config.port);
});

const io = socketio(server);

io.on("connection", (socket) => {
  socket.on("getPublicKey", () => {
    socket.emit("publicKey", publicKey);
  });

  socket.on("register", (armored_email, armored_password, armored_nickname) => {
    console.log(armored_email);
    console.log(armored_password);
    console.log(armored_nickname);

    checkUserData(armored_email, armored_password, armored_nickname, socket);
  });
  socket.on("confirmViaLink", (email, password, nickname, verification_code, pKeyArmored) => {
    confirmUserDataViaLink(email, password, nickname, verification_code, socket, publicKeyArmored);
  });

  socket.on("confirmViaCode", (email, password, nickname, verification_code) => {
    confirmUserDataViaCode(email, password, nickname, verification_code, socket);
  });
});

async function confirmUserDataViaLink(armored_email, armored_password, armored_nickname, armored_verification_code, socket, pKeyArmored) {
  const privatekey = await openpgp.decryptKey({
    privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
    passphrase,
  });

  const double_crypted_email = await openpgp.readMessage({
    armoredMessage: armored_email,
  });

  const { data: crypted_email } = await openpgp.decrypt({
    message: double_crypted_email,
    decryptionKeys: privatekey,
  });

  const double_crypted_password = await openpgp.readMessage({
    armoredMessage: armored_password,
  });

  const { data: crypted_password } = await openpgp.decrypt({
    message: double_crypted_password,
    decryptionKeys: privatekey,
  });

  const double_crypted_nickname = await openpgp.readMessage({
    armoredMessage: armored_nickname,
  });

  const { data: crypted_nickname } = await openpgp.decrypt({
    message: double_crypted_nickname,
    decryptionKeys: privatekey,
  });

  const double_crypted_verification_code = await openpgp.readMessage({
    armoredMessage: armored_verification_code,
  });

  const { data: crypted_verification_code } = await openpgp.decrypt({
    message: double_crypted_verification_code,
    decryptionKeys: privatekey,
  });

  const crypted_pKey = await openpgp.readMessage({
    armoredMessage: pKeyArmored,
  });

  const { data: pKey } = await openpgp.decrypt({
    message: crypted_pKey,
    decryptionKeys: privatekey,
  });

  const email = decryptAES(crypted_email, AESKey);
  const password = decryptAES(crypted_password, AESKey);
  const nickname = decryptAES(crypted_nickname, AESKey);
  const verification_code = decryptAES(crypted_verification_code, AESKey);

  if (existInJson(email, nickname)) {
    //se l'utente esiste nel json controllo che tutto corrisponda
    if (!checkJsonData(email, password, nickname, verification_code, socket)) {
      //aumento il numero di tentativi












      increaseAttempts(email, nickname);
      //se il numero di tentativi è maggiore di 3 diminuisco il tempo di scadenza del codice di conferma
      if (getAttempts(email, nickname) > 3) {
        decreaseExpirationTime(email, nickname);
      }













    }
  } else {
    //altrimenti se l'utente non esiste nel json restituisco un errore
    socket.emit("confirmError", "User not found");
  }

}
async function encrypt(Data){
  const encryptedData = await openpgp.encrypt({
    message: await openpgp.createMessage({
    text: Data,
    }),
    encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
    });
    return encryptedData;
}
async function decrypt(encryptedData) {
  const privateKeyObj = await openpgp.key.readArmored(privateKey);
  await privateKeyObj.decrypt(passphrase);

  const options = {
    message: await openpgp.message.readArmored(encryptedData),
    privateKeys: [privateKeyObj.keys[0]]
  };

  const decrypted = await openpgp.decrypt(options);
  return decrypted.data; // plaintext value
}

var x = encrypt('nigro')
.then(plaintext => console.log('Decrypted value:', plaintext))
.catch(error => console.error('Decryption failed:', error));
console.log(Promise.resolve(x));



async function checkUserData(
  armored_email,
  armored_password,
  armored_nickname,
  socket
) {
  const privatekey = await openpgp.decryptKey({
    privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
    passphrase,
  });

  const crypted_email = await openpgp.readMessage({
    armoredMessage: armored_email,
  });

  const { data: email } = await openpgp.decrypt({
    message: crypted_email,
    decryptionKeys: privatekey,
  });

  const crypted_password = await openpgp.readMessage({
    armoredMessage: armored_password,
  });

  const { data: password } = await openpgp.decrypt({
    message: crypted_password,
    decryptionKeys: privatekey,
  });

  const crypted_nickname = await openpgp.readMessage({
    armoredMessage: armored_nickname,
  });

  const { data: nickname } = await openpgp.decrypt({
    message: crypted_nickname,
    decryptionKeys: privatekey,
  });

  console.log(email);
  console.log(password);
  console.log(nickname);

  var check1 = checkUsername(nickname);
  var check2 = checkEmail(email);
  var check3 = checkPassword(password);

  //se i dati sono validi
  if (check1 && check2 && check3) {
    //se esiste nel database un utente con lo stesso nickname o email
    if (existInDatabase(email, nickname)) {
      console.log("Utente già registrato");
      socket.emit("registerError", "User already registered");
    } else if (existInJson(email, nickname)) {
      //se esiste nel json un utente con lo stesso nickname o email
      console.log("Utente già registrato");
      socket.emit("registerError", "User already registered");
    } else {
      //altrimenti crea un nuovo utente
      console.log("Utente non registrato");
      addUserToJson(email, password, nickname, socket);
    }
  } else {
    console.log("Dati non validi");
    sendErrors(nickname, password, check1, check2, check3, socket);
  }
}

function sendErrors(nickname, password, check1, check2, check3, socket) {
  var error = "";

  if (!check1) {
    if (nickname.length == 0) {
      error += "Username must be filled out\n";
    } else if (nickname.length > 30) {
      error += "Username must be at most 30 characters long\n";
    } else if (!/[a-zA-Z0-9]/.test(nickname)) {
      error += "Username must contain at least one letter or number\n";
    }
  }


  if (!check2) {
    error += "Email must be valid\n";
  }

  if (!check3) {
    if (password.length == 0) {
      error += "Password must be filled out\n";
    } else if (password.length < 8) {
      error += "Password must be at least 8 characters long\n";
    } else if (password.length > 50) {
      error += "Password must be at most 50 characters long\n";
    } else if (!/[a-z]/.test(password)) {
      error += "Password must contain at least one lowercase letter\n";
    } else if (!/[A-Z]/.test(password)) {
      error += "Password must contain at least one uppercase letter\n";
    } else if (!/[0-9]/.test(password)) {
      error += "Password must contain at least one number\n";
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      error += "Password must contain at least one special character\n";
    }
  }

  socket.emit("registerDataError", check1, check2, check3, error);
}
/**/

function ConfirmUser(email, password, nickname, verification_code, socket) {
  if (fs.existsSync(json)) {
    const data = fs.readFileSync(json, "utf8");

    const usersJSON = JSON.parse(decryptAES(data)).users;

    for (let i = 0; i < usersJSON.length; i++) {
      const u = usersJSON[i];

      if (
        u.username === nickname &&
        u.password === password &&
        u.email === email &&
        u.verification_code === verification_code
      ) {
        //rimuovo l'utente dal json
        usersJSON.splice(i, 1);
        fs.writeFile(json, usersJSON, "utf8", (err) => {
          if (err) {
            console.log("Errore durante la scrittura del file json");
            socket.emit("confirmUnknownError", "Wrong data");
          } else {
            console.log("Utente verificato");
            socket.emit("confirmSuccess");
            //devo mandare il file html della chat all'utente
            //aggiungo l'utente al database
            addUserToDatabase(email, password, nickname, socket);















            //finire di implementare la funzione nel database.js













          }
        });
      }
    }
  }
}

function addTempUser(email, password, nickname, socket) {
  const verification_code = CryptoJS.lib.WordArray.random(5).toString();

  console.log(verification_code);

  const expiration_time = new Date();

  expiration_time.setDate(expiration_time.getDate());

  var user = [nickname,email,password,verification_code,expiration_time,0]


  insertTempUser(user, (err) => {
      if (err) {
        console.log("Errore durante l'aggiunta dell'utente a temp-user");
        socket.emit(
          "registerError",
          "Error during registration, please try again"
        );
      } else {
        sendCodeViaEmail(email, nickname, verification_code, expiration_time);
        console.log("Utente aggiunto a temp-user");

        var crypted_email = encryptAES(email);
        var crypted_password = encryptAES(password);
        var crypted_nickname = encryptAES(nickname);

        socket.emit("registerSuccess", crypted_email, crypted_password, crypted_nickname);
      }
    });
  }
function cleanTempUser() {
  data = new Date()
  db1.all("SELECT * FROM users", (err, rows) => {
    if (err) {
      console.log(err);
    } else {
      rows.forEach((row) => {
        if (row.expiration_time < data) {
          db1.run("DELETE FROM users WHERE email = ?", row.email, (err) => {
            if (err) {
              console.log(err);
            } else {
              console.log("Utente rimosso da temp-user");
            }
          });
        }
      });
    }
  });
  
}
//setInterval(cleanTempUser, 300000);

/*CryptoJS*/
function encryptAES(data) {
  return CryptoJS.AES.encrypt(data, AESKey).toString();
}

function decryptAES(data) {
  return CryptoJS.AES.decrypt(data, AESKey).toString(CryptoJS.enc.Utf8);
}

/*Database*/
const Newuser = ["user1","user1@example.com","password1"];

// sql=`SELECT COUNT(*) FROM users;`
// db1.run(sql)
//create tables
//sql =`CREATE TABLE IF NOT EXISTS users (nickname text PRIMARY KEY not null, email text not null, password text not null,verification_code text not null,expiration_time text not null,attempts int not null);`;
//sql =`CREATE TABLE IF NOT EXISTS users (nickname text PRIMARY KEY not null, email text not null, password text not null);`; 
//db.run(sql);
//cancellare tables
// sql =`DROP TABLE users;`;
// db.run(sql);
//cambio dati
// sql =`UPDATE users SET nickname = 'user2' WHERE nickname = 'user1';`;
//eliminare dati
// sql =`DELETE FROM users WHERE nickname = 'user2';`;

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
function insertTempUser(user) {
  console.log(user);
  db1.run(
    ` INSERT INTO users (nickname, email, password,verification_code,expiration_time,attempts)
      VALUES (?, ?, ?, ?, ?, ?);`,
    [user[0], user[1], user[2], user[3], user[4], user[5]],
    (err) => {
      if (err) {
        console.log("Error inserting user: " + err);
      }
    }
  );
}
function insertUser(newUser) {
  console.log(newUser);
  db.run(
    ` INSERT INTO users (nickname, email, password)
      VALUES (?, ?, ?);`,
    [newUser[0], newUser[1], newUser[2]],
    (err) => {
      if (err) {
        console.log("Error inserting user: " + err);
      }
    }
  );
}
// insertUser(db, Newuser);

function existInDatabase(db,email,nickname) {
  //aggiungere sql injection protection
  db.all(
    `select * from users where nickname = ? or email = ?`,
    [nickname,email],
    (err, rows) => {
      if (err) {
        console.log("Error selecting user: " + err);
      } else {
        console.log(rows);
        return rows.length > 0;
      }
    }
  );
}
//existInDatabase(db1,'user1@example.com', 'pene');

/*Check functions*/
function checkUsername(username) {
  if (username.length == 0) {
    console.log("username non valido");
    return false;
  }
  if (username.length > 30) {
    console.log("username non valido");
    return false;
  }
  if (!/[a-zA-Z0-9]/.test(username)) {
    console.log("username non valido");
    return false;
  }
  console.log("username valido");
  return true;
}

/*Check functions*/
function checkUsername(username) {
  if (username.length == 0) {
    return false;
  }
  if (username.length > 30) {
    return false;
  }
  if (!/[a-zA-Z0-9]/.test(username)) {
    return false;
  }
  return true;
}

function checkEmail(email) {
  if (
    email
      .trim()
      .match(
        /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/
      ) == null
  ) {
    return false;
  }
  return true;
}

function checkPassword(password) {
  if (password.length == 0) {
    return false;
  }
  if (password.length < 8) {
    return false;
  }
  if (password.length > 50) {
    return false;
  }
  if (!/[a-z]/.test(password)) {
    return false;
  }
  if (!/[A-Z]/.test(password)) {
    return false;
  }
  if (!/[0-9]/.test(password)) {
    return false;
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return false;
  }
  return true;
}

/*Email*/
function sendCodeViaEmail(email, nickname, password, code, expiration_time) {

  // Crea un trasportatore SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Usa SSL
    auth: {
      user: 'service.chatme@gmail.com', // Inserisci il tuo indirizzo email
      pass: 'qfdimntkltaapvcv' // Inserisci la tua password
    }
  });

  //cifratura dati
  const crypted_nickname = encryptAES(nickname);

  const crypted_email = encryptAES(email);

  const crypted_password = encryptAES(password);

  const crypted_code = encryptAES(code);

  const url = 'https://andreacampostrini-jubilant-engine-56vgx5p5644fj44-3000.preview.app.github.dev/confirm.html#email=' + crypted_email + '&nickname=' + crypted_nickname + '&password=' + crypted_password + '&code=' + crypted_code;

  const mail = 'Dear ' + nickname + ',\n\nThank you for registering for "Chat Me." We are delighted to have you as a new user.\n\nTo complete the registration process, we are providing you with a unique confirmation code that you will need to enter in the chat by ' + expiration_time.toString() + ' to access its full features.\n\nConfirmation code: ' + code + '\n\nAlternatively, if you prefer, you can click on this link: ' + url + ' to complete the registration.\n\nIf you need any assistance or have any questions about how to use the chat, please do not hesitate to contact us via email at Service.ChatMe@gmail.com.\n\nThank you for choosing Chat Me.\n\nBest regards,\n\n\t\tThe Chat Me Team';

  // Crea l'oggetto email
  const mailOptions = {
    from: 'Service.ChatMe@gmail.com',
    to: email,
    subject: 'Registration Confirmation for Chat Me',
    text: mail
  };

  // Invia l'email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email inviata: ' + info.response);
    }
  });
}
