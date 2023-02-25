const crypto = require("./crypto.js");
const database = require("./database.js");
const socket = require("socket.io");

async function confirmUserDataViaLink(armored_email, armored_password, armored_nickname, armored_verification_code, socket) {
    const email = crypto.doubleDecrypt(armored_email);
    const password = crypto.doubleDecrypt(armored_password);
    const nickname = crypto.doubleDecrypt(armored_nickname);
    const verification_code = crypto.doubleDecrypt(armored_verification_code);

    if (database.existInDatabase(database.tempUsers,email, nickname, 'and')) {
        //se l'utente esiste in TempUsers controllo che i tentativi siano minori di 3
        if (database.getAttempts(email, nickname) < 3) {
            //se i tentativi sono minori di 3 controllo che il codice di conferma sia corretto
            if (database.checkVerificationCode(email, password, nickname, verification_code)) {
                //se tutto corrisponde inserisco l'utente nel database di utenti
                database.insertUser(email, password, nickname);
                //rimuovo l'utente dal database confirm
                database.removeFromTempUsers(email, nickname);
                //invio un messaggio di conferma
                socket.emit("confirmSuccess");
            } else {
                //aumento il numero di tentativi
                database.increaseConfirmAttempts(email, nickname);
                //se il numero di tentativi è maggiore di 3 diminuisco il tempo di scadenza del codice di conferma
                if (getConfirmAttempts(email, nickname) > 3) {
                    //se l'utente ha sbagliato più di 3 volte setto il tempo di scadenza a 10 minuti da ora, poi l'utente verrà cancellato in modo che l'utente non possa registrarsi di nuovo con la stessa email
                    database.setConfirmExpirationTime(email, nickname, 10);
                }
                //invio un messaggio di errore
                socket.emit("confirmError", "Wrong data");
            }
        } else {
            //se il numero di tentativi è maggiore di 3 invio un messaggio di errore
            socket.emit("confirmError", "Too many attempts");
        }
    } else {
        //altrimenti se l'utente non esiste nel json restituisco un errore
        socket.emit("confirmError", "User not found");
    }
}

module.exports = {
    confirmUserDataViaLink
}