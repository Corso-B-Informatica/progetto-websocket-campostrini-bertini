const crypto = require("./crypto.js");
const database = require("./database.js");

async function confirmUserViaLink(armored_email, armored_password, armored_nickname, armored_verification_code, publicKeyArmored, crypted_aesKey, socket) {
    const email = await crypto.doubleDecrypt(armored_email);
    const password = await crypto.doubleDecrypt(armored_password);
    const nickname = await crypto.doubleDecrypt(armored_nickname);
    const verification_code = await crypto.doubleDecrypt(armored_verification_code);
    const publicKey = await crypto.decrypt(publicKeyArmored, crypto.getPrivateKey());
    const aesKey = await crypto.decrypt(crypted_aesKey, crypto.getPrivateKey());

    if (database.existInDatabase(database.getTempDatabase(), email, nickname, 'and')) {
        //se l'utente esiste in TempUsers controllo che i tentativi siano minori di 3
        if (database.hasAttempts(email, password)) {
            //se i tentativi sono minori di 3 controllo che il codice di conferma sia corretto
            if (database.checkVerificationCodeViaEmail(email, password, verification_code)) {
                //se tutto corrisponde inserisco l'utente nel database di utenti
                database.insertUser(email, password, nickname, aesKey);
                //rimuovo l'utente dal database confirm
                database.removeTempUsers(email, password);
                //invio un messaggio di conferma
                socket.emit("confirmSuccess");
            } else {
                //aumento il numero di tentativi
                database.increaseConfirmAttempts(email, password);
                //se il numero di tentativi è maggiore di 3 diminuisco il tempo di scadenza del codice di conferma
                if (!database.hasAttempts(email, password)) {
                    //se l'utente ha sbagliato più di 3 volte setto il tempo di waiting a 10 minuti * il numero di ore passate.
                    var expiration_time = new Date(database.getExipirationTime(email, password));
                    var data = new Date();
                    var multiplier = Math.floor(24 - (Math.abs(expiration_time - data) / 1000 / 60 / 60)) + 1;
                    database.setWaitTime(email, password, 10 * multiplier);
                }
                //invio un messaggio di errore
                var message = await crypto.encrypt("Wrong verification code.", publicKey);
                socket.emit("confirmError", message);
            }
        } else {
            //se il numero di tentativi è maggiore di 3 invio un messaggio di errore
            var wait_time = await crypto.encrypt(database.getWaitTime(), publicKey);
            var message = await crypto.encrypt("You have exceeded the number of attempts.", publicKey); 
            socket.emit("confirmError", message, wait_time);
        }
    } else {
        //altrimenti se l'utente non esiste nel database restituisco un errore
        var message = await crypto.encrypt("User not found.", publicKey);
        socket.emit("confirmError", message);
    }
}

module.exports = {
    confirmUserViaLink
}