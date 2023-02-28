const sqlite3 = require("sqlite3").verbose();

/*Crea il database se non esiste*/
function createDatabase() {
  const db1 = new sqlite3.Database("./db/users.db");
  const db2 = new sqlite3.Database("./db/temp-users.db");
}
createDatabase();

/*Inizializzazione database utenti*/
const Users = new sqlite3.Database(
  "./db/users.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error("Error User Database : " + err.message);
    }
    console.log("Connected to the users database.");
  }
);

/*Inizializzazione database utenti temporanei*/
const tempUsers = new sqlite3.Database(
  "./db/temp-users.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error("Error TempUser Database : " + err.message);
    }
    console.log("Connected to the temp-users database.");
  }
);

/*Crea le tabelle nel database se non esistono*/
function createTables() {
  Users.run(
    `CREATE TABLE IF NOT EXISTS users (
        nickname text PRIMARY KEY not null,
        email text not null,
        password text not null,
        key text not null
    );`,
    (err) => {
      if (err) {
        console.log("Error creating table: " + err);
      } else {
        console.log("Table created successfully or already exists");
      }
    }
  );

  tempUsers.run(
    `CREATE TABLE IF NOT EXISTS users (
        nickname text PRIMARY KEY not null,
        email text not null,
        password text not null,
        verification_code text not null,
        expiration_time text not null,
        attempts integer not null,
        wait_time integer not null,
        times integer not null
    );`,
    (err) => {
      if (err) {
        console.log("Error creating table: " + err);
      } else {
        console.log("Table created successfully or already exists");
      }
    }
  );
}
createTables();

/*Controlla se un utente ha gia quello username e/o email nel database di utenti confirm*/
function existInDatabase(db, nickname, email, operator) {
  return new Promise((resolve, reject) => {
    db.all(
      `select * from users where nickname = ? ` + operator + ` email = ?`,
      [nickname, email],
      (err, rows) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(rows.length > 0);
        }
      });
  });
}
/*Inserisce un utente nel database di utenti confirm*/
function insertTempUsers(
  nickname,
  email,
  password,
  verification_code,
  expiration_time,
  attempts,
  times
) {
  return new Promise((resolve, reject) => {
    tempUsers.run(
      ` INSERT INTO users (nickname, email, password, verification_code, expiration_time, attempts, wait_time, times)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [nickname, email, password, verification_code, expiration_time, attempts, 0, times],
      (err) => {
        if (err) {
          console.log("Error inserting user: " + err);
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
}

/*Inserisce un utente nel database di utenti*/
function insertUser(nickname, email, password, key) {
  return new Promise((resolve, reject) => {
    Users.run(
      ` INSERT INTO users (nickname, email, password, key)
      VALUES (?, ?, ?, ?);`,
      [nickname, email, password, key],
      (err) => {
        if (err) {
          console.log("Error inserting user: " + err);
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
}

/*Pulisce il database di utenti confirm da codici di verifica scaduti*/
function cleanDatabase() {
  return new Promise((resolve, reject) => {
    tempUsers.all("SELECT * FROM users", (err, rows) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        rows.forEach((row) => {
          if (row.expiration_time < new Date()) {
            tempUsers.run("DELETE FROM users WHERE email = ?", row.email, (err) => {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                console.log("Utente rimosso da temp-users");
              }
            });
          }
        });
      }
    });
    resolve(true);
  });
}

/*Ritorna true se l'utente ha ancora tentativi di conferma*/
function hasAttempts(email, password) {
  return new Promise((resolve, reject) => {
    tempUsers.all(
      "SELECT * FROM users WHERE email = ? and password = ?",
      [email, password],
      (err, rows) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(rows[0].attempts <= 3);
        }
      }
    );
  });
}

/*Ritorna true se il codice di verifica e' corretto*/
function checkVerificationCodeViaEmail(email, password, verification_code) {
  return new Promise((resolve, reject) => {
    tempUsers.all(
      "SELECT * FROM users WHERE email = ? and password = ?",
      [email, password],
      (err, rows) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(rows[0].verification_code == verification_code);
        }
      }
    );
  });
}

//rimuove un utente da TempUsers
function removeTempUsers(email, password) {
  return new Promise((resolve, reject) => {
    tempUsers.run(
      "DELETE FROM users WHERE email = ? and password = ?",
      [email, password],
      (err) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
}

/*Aumenta di 1 il numero di tentativi di conferma*/
function increaseConfirmAttempts(email, password) {
  return new Promise((resolve, reject) => {
    tempUsers.run(
      "UPDATE users SET attempts = attempts + 1 WHERE email = ? and password = ?",
      [email, password],
      (err) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
}

/*Aumenta di 1 il numero di tentativi di conferma*/
function increaseTimes(email, password) {
  return new Promise((resolve, reject) => {
    tempUsers.run(
      "UPDATE users SET times = times + 1 WHERE email = ? and password = ?",
      [email, password],
      (err) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
}

/*Ritorna l'expiration_time*/
function getExipirationTime(email, password) {
  return new Promise((resolve, reject) => {
    tempUsers.all(
      "SELECT * FROM users WHERE email = ? and password = ?",
      [email, password],
      (err, rows) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(rows[0].expiration_time);
        }
      }
    );
  });
}

/*Setta il wait_time*/
function setWaitTime(email, password, wait_time) {
  return new Promise((resolve, reject) => {
    tempUsers.run(
      "UPDATE users SET wait_time = ? WHERE email = ? and password = ?",
      [wait_time, email, password],
      (err) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
}

/*Ritorna il wait_time (millisecondi)*/
function getWaitTime(email, password) {
  return new Promise((resolve, reject) => {
    tempUsers.all(
      "SELECT * FROM users WHERE email = ? and password = ?",
      [email, password],
      (err, rows) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(rows[0].wait_time);
        }
      }
    );
  });
}

/*Ritorna times*/
function getTimes(email, password) {
  return new Promise((resolve, reject) => {
    tempUsers.all(
      "SELECT * FROM users WHERE email = ? and password = ?",
      [email, password],
      (err, rows) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(rows[0].wait_time);
        }
      }
    );
  });
}
module.exports = {
  existInDatabase,
  insertTempUsers,
  insertUser,
  cleanDatabase,
  removeTempUsers,
  increaseConfirmAttempts,
  getExipirationTime,
  checkVerificationCodeViaEmail,
  setWaitTime,
  getWaitTime,
  hasAttempts,
  increaseTimes,
  Users,
  tempUsers,
};
