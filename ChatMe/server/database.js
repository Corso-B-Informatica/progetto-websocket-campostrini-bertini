const sqlite3 = require("sqlite3").verbose();

/*Inizializzazione database utenti*/
const Users = new sqlite3.Database(
  "./db/users.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error('Error User Database : '+err.message);
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
      console.error('Error TempUser Database : '+err.message);
    }
    console.log("Connected to the temp-users database.");
  }
);

/*Controlla se un utente ha gia quello username o email nel database di utenti confirm*/
function existInDatabase(db, email, nickname, operator) {
  db.all(
    `select * from users where nickname = ? ` + operator + ` email = ?`,
    [nickname, email],
    (err, rows) => {
      if (err) {
        console.log("Error selecting user: " + err);
        return false;
      } else {
        console.log(rows);
        return rows.length > 0;
      }
    }
  );
}
/*Inserisce un utente nel database di utenti confirm*/
function insertTempUsers (nickname,email,password,verification_code,expiration_time,attempts) {
  tempUsers.run(
    ` INSERT INTO users (nickname, email, password, verification_code, expiration_time, attempts)
        VALUES (?, ?, ?, ?, ?, ?);`,
    [nickname, email, password, verification_code, expiration_time, attempts],
    (err) => {
      if (err) {
        console.log("Error inserting user: " + err);
        return false;
      }
    }
  );
  return true;
}

/*Inserisce un utente nel database di utenti*/
function insertUser (nickname, email, password) {
  users_database.run(
    ` INSERT INTO users (nickname, email, password)
      VALUES (?, ?, ?);`,
    [nickname, email, password],
    (err) => {
      if (err) {
        console.log("Error inserting user: " + err);
        return false;
      }
    }
  );
  return true;
}

/*Pulisce il database di utenti confirm da codici di verifica scaduti*/
function cleanDatabase() {
  tempUsers.all("SELECT * FROM users", (err, rows) => {
    if (err) {
      console.log(err);
    } else {
      rows.forEach((row) => {
        if (row.expiration_time < new Date()) {
          db1.run("DELETE FROM users WHERE email = ?", row.email, (err) => {
            if (err) {
              console.log(err);
              return false;
            } else {
              console.log("Utente rimosso da temp-users");
            }
          });
        }
      });
    }
  });
  return true;
}

//ritorna true se l'utente ha meno di 3 tentativi
function getAttempts(email, password){
    tempUsers.all("SELECT * FROM users WHERE email = ? and password = ?", [email,password], (err, rows) => {
        if (err) {
        console.log(err);
        return false
        } else {
        return rows.attempts <= 3;
        }
    });
}

//ritorna true se il codice di verifica è corretto
function checkVerificationCode(email, password, verification_code){
    tempUsers.all("SELECT * FROM users WHERE email = ? and password = ?", [email,password], (err, rows) => {
        if (err) {
        console.log(err);
        return false
        } else {
        return rows.verification_code == verification_code;
        }
    });
}

//rimuove un utente da TempUsers
function removeTempUsers(email,password){
    tempUsers.run("DELETE FROM users WHERE email = ? and password = ?", [email,password], (err) => {
        if (err) {
        console.log(err);
        return false;
        } else {
        console.log("Utente rimosso da temp-users");
        return true;
        }
    });
}

//aumenta il numero di tentativi di conferma
function increaseConfirmAttempts(email,password){
    tempUsers.run("UPDATE users SET attempts = attempts + 1 WHERE email = ? and password = ?", [email,password], (err) => {
        if (err) {
        console.log(err);
        return false;
        } else {
        console.log("Tentativi di conferma aumentati");
        return true;
        }
    });
}

//setta la data di scandeza dell'account ad adesso
function setExpirationTime(email,password){
    tempUsers.run("UPDATE users SET expiration_time = ? WHERE email = ? and password = ?", [new Date().getTime(),email,password], (err) => {
        if (err) {
        console.log(err);
        return false;
        } else {
        console.log("Expiration time aggiornata");
        return true;
        }
    });
};
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

module.exports = {
  existInDatabase,
  insertTempUsers,
  insertUser,
  cleanDatabase,
  getAttempts,
  checkVerificationCode,
  removeTempUsers,
  increaseConfirmAttempts,
  setExpirationTime,
  tempUsers,
  Users,
};
