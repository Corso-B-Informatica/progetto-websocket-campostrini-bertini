const sqlite3 = require("sqlite3").verbose();

/*Inizializzazione database utenti*/
const users_database = new sqlite3.Database(
  "./db/users.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the users database.");
  }
);

/*Inizializzazione database utenti temporanei*/
const confirm_database = new sqlite3.Database(
  "./db/temp-users.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the temp-users database.");
  }
);

/*Controlla se un utente ha gia quello username o email nel database di utenti confirm*/
function existDuplicatesInConfirmDatabase (email, nickname) {
  confirm_database.all(
    `select * from users where nickname = ? or email = ?`,
    [nickname, email],
    (err, rows) => {
      if (err) {
        console.log("Error selecting user: " + err);
      } else {
        console.log(rows);
        return rows.length > 0;
      }
    }
  );
  return false;
}

/*Controlla se un utente esiste già nel database di utenti confirm*/
function existInConfirmDatabase (email, nickname) {
  confirm_database.all(
    `select * from users where nickname = ? and email = ?`,
    [nickname, email],
    (err, rows) => {
      if (err) {
        console.log("Error selecting user: " + err);
      } else {
        console.log(rows);
        return rows.length > 0;
      }
    }
  );
  return false;
}

/*Controlla se un utente ha gia quello username o email nel database di utenti*/
function existDuplicatesInUsersDatabase (email, nickname) {
  users_database.all(
    `select * from users where nickname = ? or email = ?`,
    [nickname, email],
    (err, rows) => {
      if (err) {
        console.log("Error selecting user: " + err);
      } else {
        console.log(rows);
        return rows.length > 0;
      }
    }
  );
  return false;
}

/*Controlla se un utente esiste già nel database di utenti*/
function existInUsersDatabase (email, nickname) {
  users_database.all(
    `select * from users where nickname = ? and email = ?`,
    [nickname, email],
    (err, rows) => {
      if (err) {
        console.log("Error selecting user: " + err);
      } else {
        console.log(rows);
        return rows.length > 0;
      }
    }
  );
  return false;
}

/*Restituisce tutti gli utenti confirm*/
function getConfirmUsers() {
  var users = [];
  confirm_database.all("SELECT * FROM users", (err, rows) => {
    if (err) {
      console.log(err);
    } else {
      rows.forEach((row) => {
        console.log(row);
        users.push(row);
      });
    }
  });
  return users;
}

/*Restituisce tutti gli utenti*/
function getUsers() {
  var users = [];
  users_database.all("SELECT * FROM users", (err, rows) => {
    if (err) {
      console.log(err);
    } else {
      rows.forEach((row) => {
        console.log(row);
        users.push(row);
      });
    }
  });
  return users;
}

/*Inserisce un utente nel database di utenti confirm*/
function insertInConfirmDatabase (
  nickname,
  email,
  password,
  verification_code,
  expiration_time,
  attempts
) {
  confirm_database.run(
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
function insertInUsersDatabase (nickname, email, password) {
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
function cleanConfirmDatabase() {
  confirm_database.all("SELECT * FROM users", (err, rows) => {
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
  existDuplicatesInConfirmDatabase,
  existInConfirmDatabase,
  existInUsersDatabase,
  existDuplicatesInUsersDatabase,
  insertInConfirmDatabase,
  getUsers,
  getConfirmUsers,
  insertInUsersDatabase,
  cleanConfirmDatabase,
};
