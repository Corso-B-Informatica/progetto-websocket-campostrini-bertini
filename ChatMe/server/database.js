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
  getConfirmUsers,
  insertUser,
  cleanDatabase,
  tempUsers,
  Users,
};
