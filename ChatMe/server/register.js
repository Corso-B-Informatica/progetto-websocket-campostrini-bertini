const crypto = require('./crypto.js');
const database = require('./database.js');
const validator = require('./validator.js');
const emailer = require('./emailer.js');

async function checkUserData(
    armored_email,
    armored_password,
    armored_nickname,
    publicKeyArmored,
    socket
) {
    const { data: validate_email } = await crypto.decrypt(armored_email, crypto.privateKey);
    const { data: validate_password } = await crypto.decrypt(armored_password, crypto.privateKey);
    const { data: validate_nickname } = await crypto.decrypt(armored_nickname, crypto.privateKey);
    const { data: pubKey } = await crypto.decrypt(publicKeyArmored, crypto.privateKey);

    const email = validator.validate(validate_email);
    const password = validator.validate(validate_password);
    const nickname = validator.validate(validate_nickname);

    var check1 = validator.checkUsername(nickname);
    var check2 = validator.checkEmail(email);
    var check3 = validator.checkPassword(password);

    //se i dati sono validi
    if (check1 && check2 && check3) {
        if (await database.existInDatabase(database.Users, nickname, email, "or")) {
            //se l'utente è già registrato
            //mando all'utente che la mail è già stata utilizzata o il nickname è già stato utilizzato o entrambi
            console.log("Utente già registrato");

            const message = await crypto.encrypt("User already registered", pubKey);

            var first = await database.existInDatabase(database.Users, nickname, email, "and");
            var second = await database.existInDatabase(database.Users, "", email, "or");
            var third = await database.existInDatabase(database.Users, nickname, "", "or");
            var who = first ? "both" : second ? "email" : third ? "nickname" : "both";
            var error = await crypto.encrypt(who, pubKey);

            socket.emit("registerError", message, error);
        } else if (await database.existInDatabase(database.tempUsers, nickname, email, "or")) {
            console.log("Utente già registrato");

            const message = await crypto.encrypt("User must confirm his account", pubKey);

            var first = await database.existInDatabase(database.tempUsers, nickname, email, "and");
            var second = await database.existInDatabase(database.tempUsers, "", email, "or");
            var third = await database.existInDatabase(database.tempUsers, nickname, "", "or");
            var who = first ? "both" : second ? "email" : third ? "nickname" : "both";
            var error = await crypto.encrypt(who, pubKey);

            socket.emit("registerError", message, error);
        } else {
            console.log("Utente non registrato");

            registerUser(email, password, nickname, pubKey, socket);
        }
    } else {
        console.log("Dati non validi");

        const crypted_check1 = await crypto.encrypt(check1, pubKey);
        const crypted_check2 = await crypto.encrypt(check2, pubKey);
        const crypted_check3 = await crypto.encrypt(check3, pubKey);
        const errors = validator.getErrors(nickname, password, check1, check2, check3).split("\n");
        const crypted_data1 = await crypto.encrypt(errors[0], pubKey);
        const crypted_data2 = await crypto.encrypt(errors[1], pubKey);
        const crypted_data3 = await crypto.encrypt(errors[2], pubKey);

        socket.emit("registerDataError", crypted_check1, crypted_check2, crypted_check3, crypted_data1, crypted_data2, crypted_data3);
    }
}

async function registerUser(email, password, nickname, publicKeyArmored, socket) {
    const verification_code = crypto.generateRandomKey(10);

    const expiration_time = new Date();

    expiration_time.setDate(expiration_time.getDate() + 1);

    //non vanno i database

    if (await database.insertTempUsers(nickname, email, password, verification_code, expiration_time.toString(), 0, 0, 0)) {
        console.log("Utente aggiunto a temp-users");

        var crypted_email = crypto.encryptAES(email);
        var crypted_password = crypto.encryptAES(password);
        var crypted_nickname = crypto.encryptAES(nickname);

        emailer.sendConfirmCodeViaEmail(crypted_email, crypted_nickname, crypted_password, verification_code, expiration_time);

        var doubleCrypted_email = await crypto.encrypt(crypted_email, publicKeyArmored);
        var doubleCrypted_password = await crypto.encrypt(crypted_password, publicKeyArmored);
        var doubleCrypted_nickname = await crypto.encrypt(crypted_nickname, publicKeyArmored);

        socket.emit("registerSuccess", doubleCrypted_email, doubleCrypted_password, doubleCrypted_nickname);
    } else {
        console.log("Errore durante l'aggiunta dell'utente a temp-users");
        const message = await crypto.encrypt("Error during registration, please try again", publicKeyArmored);
        socket.emit(
            "registerError", message
        );
    }
}

module.exports = {
    checkUserData,
};
