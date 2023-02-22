const express = require("express");
const config = require("./config.js");
const socketio = require("socket.io");
const openpgp = require("openpgp");
var CryptoJS = require("crypto-js");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

/*Json file*/
const json = "./db/data.txt";

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

    /*email = decryptPGP(crypted_email, passphrase)
        .then((decrypted) => {
          console.log(decrypted);
        })
        .catch((error) => {
          console.error(error);
        });
      nickname = decryptPGP(crypted_nickname, passphrase)
        .then((decrypted) => {
          console.log(decrypted);
        })
        .catch((error) => {
          console.error(error);
        });
      password = decryptPGP(crypted_password, passphrase)
        .then((decrypted) => {
          console.log(decrypted);
        })
        .catch((error) => {
          console.error(error);
        });*/
    //se l'utente non è già presente e se il formato è corretto |fatto
    //manda una mail di conferma della registrazione e salva il codice di registrazione assieme all'utente
    //riceve il codice di conferma dal client e l'utente è stato creato
    //se non si riceve il codice di conferma entro 24 ore l'utente viene eliminato |fatto
    //se viene ricevuto semplicente si toglie dal database la data di scadenza del codice di registrazione e il codice di registrazione
    //se l'utente richiede più di un codice di conferma per la stessa registrazione, viene mandato quello precedentemente salvato nel database
  });
});

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

  if (check1 && check2 && check3) {
    if (existInDatabase(email, password, nickname)) {
      console.log("Utente già registrato");
      socket.emit("registerError", "User already registered");
    } else {
      console.log("Utente non registrato");
      if (addUserToJson(email, password, nickname)) {
        console.log("Utente aggiunto al database");
        socket.emit("registerSuccess");
      } else {
        console.log("Errore durante l'aggiunta dell'utente al database");
        socket.emit(
          "registerError",
          "Error during registration, please try again"
        );
      }
    }
  } else {
    console.log("Dati non validi");
    sendErrors(nickname, password, check1 , check2, check3, socket);
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
/*Json*/
function addUserToJson(email, password, nickname) {
  const verification_code = CryptoJS.lib.WordArray.random(10).toString(
    CryptoJS.enc.Hex
  );

  const expiration_time = new Date();
  expiration_time.setDate(expiration_time.getDate() + 1);

  var user = {
    username: nickname,
    password: password,
    email: email,
    verification_code: verification_code,
    expiration_time: expiration_time,
    attempts: 0,
  };

  console.log("utente: " + JSON.stringify(user));

  if (fs.existsSync(json)) {
    console.log("Il file JSON esiste già");

    const data = fs.readFileSync(json, "utf8");

    const usersJSON = JSON.parse(decryptAES(data)).users;

    let i = 0;
    let found = false;

    while (i < usersJSON.length && !found) {
      const u = usersJSON[i];

      if (
        u.username === nickname &&
        u.password === password &&
        u.email === email
      ) {
        usersJSON.splice(i, 1, user);
        found = true;
      }
      i++;
    }

    if (!found) {
      usersJSON.push(user);
    }

    console.log("\njson: " + JSON.stringify(usersJSON));

    const jsonData = encryptAES(JSON.stringify(usersJSON));

    // fs.writeFile(json, jsonData, "utf8", (err) => {
    //   if (err) {
    //     console.log("Errore nella scrittura del json");
    //     return false;
    //   } else {
    //     console.log("Utente aggiunto al json");
    //     sendCodeViaEmail(email, nickname, verification_code, expiration_time);
    //     return true;
    //   }
    // });
  } else {
    console.log("Il file JSON non esiste");

    const usersJSON = {
      users: [user],
    };

    console.log("\njson: " + JSON.stringify(usersJSON));

    const jsonData = encryptAES(JSON.stringify(usersJSON));

    // fs.writeFile(json, jsonData, "utf8", (err) => {
    //   if (err) {
    //     if (!fs.existsSync(json)) {
    //       console.log("Errore nella scrittura del json");
    //       return false;
    //     }
    //   } else {
    //     console.log("Utente aggiunto al json");
    //     sendCodeViaEmail(email, nickname, verification_code, expiration_time);
    //     return true;
    //   }
    // });
  }
}

// function cleanJson() {
//   if (fs.existsSync(json)) {
//     var removed = 0;

//     const data = fs.readFileSync(json, "utf8");

//     const usersJSON = JSON.parse(decryptAES(data)).users;

//     for (let i = 0; i < usersJSON.length; i++) {
//       const u = usersJSON[i];

//       if (new Date(u.expiration_time) < new Date()) {
//         usersJSON.splice(i, 1);
//         removed++;
//       }
//     }

//     const jsonData = encryptAES(JSON.stringify(usersJSON));

//     fs.writeFile(json, jsonData, "utf8", (err) => {
//       if (err) {
//         console.log("Errore nella scrittura del json");
//       } else {
//         console.log("Pulizia json effettuata, utenti rimossi: " + removed);
//       }
//     });
//   }
// }

// setInterval(cleanJson, 600000);

/*CryptoJS*/
function encryptAES(data) {
  return CryptoJS.AES.encrypt(data, AESKey).toString();
}

function decryptAES(data) {
  return CryptoJS.AES.decrypt(data, AESKey).toString(CryptoJS.enc.Utf8);
}

/*OpenPGP*/
/*async function decryptPGP(msg, passphrase) {
  const privatekey = await openpgp.decryptKey({
    privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
    passphrase,
  });
  const message = await openpgp.readMessage({
    armoredMessage: msg, // parse armored message
  });
  const { data: decrypted } = await openpgp.decrypt({
    message,
    decryptionKeys: privatekey,
  });

  return decrypted;
}*/

/*Database*/
const Newuser = ["user1","user1@example.com","password1"];
const db = new sqlite3.Database("./db/users.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the users database.");
});
//create tables
// sql =`CREATE TABLE IF NOT EXISTS users (username text PRIMARY KEY not null, email text not null, password text not null);`; 
// db.run(sql);
//cancellare tables
// sql =`DROP TABLE users;`;
// db.run(sql);

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
  console.log(newUser[0]);
  db.run(
    ` INSERT INTO users (username, email, password)
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

function existInDatabase(email,username) {
  //aggiungere sql injection protection
  db.all(
    `select * from users where username = ? or email = ?`,
    [username,email],
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
existInDatabase('user1@example.com','pene');
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

function checkEmail(email) {
  if (
    email
      .trim()
      .match(
        /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/
      ) == null
  ) {
    console.log("email non valida")
    return false;
  }
  console.log("email valida")
  return true;
}

function checkPassword(password) {
  if (password.length == 0) {
    console.log("password non valida1")
    return false;
  }
  if (password.length < 8) {
    console.log("password non valida2")
    console.log(password.length)
    return false;
  }
  if (password.length > 50) {
    console.log("password non valida3")
    return false;
  }
  if (!/[a-z]/.test(password)) {
    console.log("password non valida4")
    return false;
  }
  if (!/[A-Z]/.test(password)) {
    console.log("password non valida5")
    return false;
  }
  if (!/[0-9]/.test(password)) {
    console.log("password non valida6")
    return false;
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    console.log("password non valida7")
    return false;
  }
  console.log("password valida")
  return true;
}


/*Email*/
function sendCodeViaEmail(email, nickname, code, expiration_time) {
  /*const { google } = require('googleapis');
  const OAuth2 = google.auth.OAuth2;

  const oauth2Client = new OAuth2(
    'CLIENT_ID',
    'CLIENT_SECRET',
    'REDIRECT_URL'
  );

  oauth2Client.setCredentials({
    access_token: 'ACCESS_TOKEN',
    refresh_token: 'REFRESH_TOKEN'
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const email = 'To: example@example.com\r\n' +
    'Subject: Test Email\r\n\r\n' +
    'This is a test email.';

  const message = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

  gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: message
    }
  }, (err, res) => {
    if (err) return console.log('Error sending email: ' + err);
    console.log('Email sent successfully.');
  });*/
}
