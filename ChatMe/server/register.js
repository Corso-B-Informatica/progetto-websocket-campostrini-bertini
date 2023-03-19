const crypto = require('./crypto.js');
const database = require('./database.js');
const validator = require('./validator.js');
const emailer = require('./emailer.js');

async function checkUserData(
    armored_email,
    armored_password,
    armored_nickname,
    publicKeyArmored,
    crypted_link,
    socket
) {

    const email = await validator.UltimateValidator(armored_email, 0, true);
    const password = await validator.UltimateValidator(armored_password, 0, true);
    const nickname = await validator.UltimateValidator(armored_nickname, 0, true);
    const publicKey = await validator.UltimateValidator(publicKeyArmored, 0, false);
    const link = await validator.UltimateValidator(crypted_link, 0, false);
    const confirm_link = link.substring(0, link.indexOf("/signUp.html"));
    
    var check1 = validator.checkUsername(nickname);
    var check2 = validator.checkEmail(email);
    var check3 = validator.checkPassword(password);
    var check4 = await crypto.isValid(publicKey);
    var check5 = isUrlConfirmed(link, email, password, nickname);


    //se i dati sono validi
    if (check1 && check2 && check3 && check4 && check5) {
        if (await database.existInDatabase(database.Users, nickname, email, "or")) {
            console.log("Utente già registrato");

            const message = await crypto.encrypt("User already registered", publicKey);

            var first = await database.existInDatabase(database.Users, nickname, email, "and");
            var second = await database.existInDatabase(database.Users, "", email, "or");
            var third = await database.existInDatabase(database.Users, nickname, "", "or");
            var who = first ? "both" : second ? "email" : third ? "nickname" : "both";
            var error = await crypto.encrypt(who, publicKey);

            socket.emit("registerError", message, error);
        } else if (await database.existInDatabase(database.tempUsers, nickname, email, "or")) {
            console.log("Utente già registrato");

            const message = await crypto.encrypt("User must confirm his account", publicKey);

            var first = await database.existInDatabase(database.tempUsers, nickname, email, "and");
            var second = await database.existInDatabase(database.tempUsers, "", email, "or");
            var third = await database.existInDatabase(database.tempUsers, nickname, "", "or");
            var who = first ? "both" : second ? "email" : third ? "nickname" : "both";
            var error = await crypto.encrypt(who, publicKey);

            socket.emit("registerError", message, error);
        } else {
            console.log("Utente non registrato");

            registerUser(email, password, nickname, publicKey, confirm_link, socket);
        }
    } else {
        console.log("Dati non validi");

        const crypted_check1 = await crypto.encrypt(check1.toString(), publicKey);
        const crypted_check2 = await crypto.encrypt(check2.toString(), publicKey);
        const crypted_check3 = await crypto.encrypt(check3.toString(), publicKey);
        const crypted_check4 = await crypto.encrypt(check4.toString(), publicKey);
        const errors = validator.getErrors(nickname, password, "", check1, check2, check3, true, check4, true).split("\n");
        const crypted_data1 = await crypto.encrypt(errors[0], publicKey);
        const crypted_data2 = await crypto.encrypt(errors[1], publicKey);
        const crypted_data3 = await crypto.encrypt(errors[2], publicKey);
        const crypted_data4 = await crypto.encrypt(errors[4], publicKey);

        socket.emit("registerDataError", crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_data1, crypted_data2, crypted_data3, crypted_data4);
    }
}

function isUrlConfirmed(url, email, password, nickname) {
    if (email == null || nickname == null || password == null) {
        return false;
    }
    if (email == undefined || nickname == undefined || password == null) {
        return false;
    }

    return url.includes("/signUp.html") && email.trim().length > 0 && nickname.trim().length > 0 && password.trim().length > 0;
}

async function registerUser(email, password, nickname, publicKeyArmored, confirm_link, socket) {
    const verification_code = crypto.generateRandomKey(10);

    const expiration_time = new Date();

    expiration_time.setDate(expiration_time.getDate() + 1);

    await database.insertTempUsers(nickname, email, password, verification_code, expiration_time.toString(), 0, 0, 0);
    
    console.log("Utente aggiunto a temp-users");

    var crypted_email = crypto.encryptAES(email);
    var crypted_password = crypto.encryptAES(password);
    var crypted_nickname = crypto.encryptAES(nickname);

    emailer.sendConfirmCodeViaEmail(crypted_email, crypted_nickname, crypted_password, verification_code, expiration_time, confirm_link);

    var doubleCrypted_email = await crypto.encrypt(crypted_email, publicKeyArmored);
    var doubleCrypted_password = await crypto.encrypt(crypted_password, publicKeyArmored);
    var doubleCrypted_nickname = await crypto.encrypt(crypted_nickname, publicKeyArmored);

    socket.emit("registerSuccess", doubleCrypted_email, doubleCrypted_password, doubleCrypted_nickname);
}

module.exports = {
    checkUserData,
};
