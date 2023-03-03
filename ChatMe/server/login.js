const crypto = require('./crypto.js');
const database = require('./database.js');

async function login(armored_email, armored_nickname, armored_password, armored_rememberMe, armored_publicKey, socket) {
    const { data: validate_email } = await crypto.decrypt(armored_email, crypto.privateKey);
    const { data: validate_password } = await crypto.decrypt(armored_password, crypto.privateKey);
    const { data: validate_nickname } = await crypto.decrypt(armored_nickname, crypto.privateKey);
    const { data: validate_rememberMe } = await crypto.decrypt(armored_rememberMe, crypto.privateKey);
    const { data: pubKey } = await crypto.decrypt(armored_publicKey, crypto.privateKey);

    const email = validator.validate(validate_email);
    const password = validator.validate(validate_password);
    const nickname = validator.validate(validate_nickname);
    const rememberMe = validator.validate(validate_rememberMe);

    var check1 = validator.checkUsername(nickname);
    var check2 = validator.checkEmail(email);
    var check3 = validator.checkPassword(password);
    var check4 = validator.checkRemember(rememberMe);

    if ((check1 || check2) && check3 && check4) {
        if (await database.existInDatabase(database.Users, nickname, email, "or")) {
            if (await database.checkDatabase(database.Users, nickname, email, password)) {
                console.log("Utente loggato");
                //il login manda tutti i messaggi sempre mentre se l'utente ha i dati su localstorage non deve fare il login ma deve fare il getUpdates
                //invia nickname cripato con aes e pubkey + aeskey + data, il client deve generare il timeUpdate e metterlo in localStorage.
            } else {
                console.log("Password non valida");

                const message = await crypto.encrypt("Invalid Password", pubKey);
                
                socket.emit("loginError", message);
            }
        } else if(await database.existInDatabase(database.tempUsers, nickname, email, "or")) {
            console.log("Utente non confermato");

            const message = await crypto.encrypt("User not confirmed", pubKey);

            socket.emit("loginError", message);
        } else {
            console.log("Utente non registrato");

            const message = await crypto.encrypt("User not registered", pubKey);

            socket.emit("loginError", message);
        }
    } else {
        //dati non validi
        console.log("Dati non validi");

        const crypted_check1 = await crypto.encrypt(check1, pubKey);
        const crypted_check2 = await crypto.encrypt(check2, pubKey);
        const crypted_check3 = await crypto.encrypt(check3, pubKey);
        const crypted_check4 = await crypto.encrypt(check4, pubKey);
        const errors = validator.getErrors(nickname, password, check1, check2, check3, check4).split("\n");
        const crypted_data1 = await crypto.encrypt(errors[0], pubKey);
        const crypted_data2 = await crypto.encrypt(errors[1], pubKey);
        const crypted_data3 = await crypto.encrypt(errors[2], pubKey);
        const crypted_data4 = await crypto.encrypt(errors[3], pubKey);

        socket.emit("loginDataError", crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_data1, crypted_data2, crypted_data3, crypted_data4);
    }
}


module.exports = {
    login,
};