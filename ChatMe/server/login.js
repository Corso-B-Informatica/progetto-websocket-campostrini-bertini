const crypto = require('./crypto.js');
const database = require('./database.js');
const validator = require('./validator.js');

async function login(armored_email, armored_nickname, armored_password, armored_rememberMe, armored_publicKey, socket) {
    var { data: validate_email } = "";
    var { data: validate_password } = "";
    var { data: validate_nickname } = "";
    var { data: validate_rememberMe } = "";
    var { data: pubKey } = "";

    try {
        validate_email = await crypto.decrypt(armored_email, crypto.privateKey);
    } catch (error) {
        validate_email = "";
    }
    try {
        validate_password = await crypto.decrypt(armored_password, crypto.privateKey);
    } catch (error) {
        validate_password = "";
    }
    try {
        validate_nickname = await crypto.decrypt(armored_nickname, crypto.privateKey);
    } catch (error) {
        validate_nickname = "";
    }
    try {
        validate_rememberMe = await crypto.decrypt(armored_rememberMe, crypto.privateKey);
    } catch (error) {
        validate_rememberMe = "";
    }
    try {
        pubKey = await crypto.decrypt(armored_publicKey, crypto.privateKey);
    } catch (error) {
        pubKey = "";
    }

    const email = validate_email.data == undefined ? "" : validator.validate(validate_email.data);
    const password = validate_password.data == undefined ? "" : validator.validate(validate_password.data);
    const nickname = validate_nickname.data == undefined ? "" : validator.validate(validate_nickname.data);
    const rememberMe = validate_rememberMe.data == undefined ? "" : validator.validate(validate_rememberMe.data);
    const publicKey = pubKey.data == undefined ? "" : pubKey.data;

    var check1 = validator.checkUsername(nickname);
    var check2 = validator.checkEmail(email);
    var check3 = validator.checkPassword(password);
    var check4 = validator.checkRemember(rememberMe);
    var check5 = await crypto.isValid(publicKey);

    if ((check1 || check2) && check3 && check4 && check5) {
        if (await database.existInDatabase(database.Users, nickname, email, "or")) {
            if (await database.checkDatabase(database.Users, nickname, email, password)) {
                console.log("Utente loggato");
                if (nickname == "") {
                    var nick = await database.getNickname(email);

                    var c_rememberMe = await crypto.encrypt(rememberMe, publicKey);
                    var c_row = await crypto.encrypt(JSON.stringify(await database.getRow(nick)), publicKey);
                    var c_aesKey = await crypto.encrypt(await database.getKeys(nick), publicKey);
                    var c_nickname = await crypto.encrypt(crypto.encryptAES(nick), publicKey);
                    var c_email = await crypto.encrypt(crypto.encryptAES(email), publicKey);
                    var c_password = await crypto.encrypt(crypto.encryptAES(password), publicKey);

                    socket.emit("loginSuccess", c_nickname, c_email, c_password, c_rememberMe, c_aesKey, c_row);
                } else {

                    var c_rememberMe = await crypto.encrypt(rememberMe, publicKey);
                    var c_row = await crypto.encrypt(JSON.stringify(await database.getRow(nickname)), publicKey);
                    var c_aesKey = await crypto.encrypt(await database.getKeys(nickname), publicKey);
                    var c_nick = await crypto.encrypt(crypto.encryptAES(nickname), publicKey);
                    var c_email = await crypto.encrypt(crypto.encryptAES(await database.getEmail(nickname)), publicKey);
                    var c_password = await crypto.encrypt(crypto.encryptAES(password), publicKey);

                    socket.emit("loginSuccess", c_nickname, c_email, c_password, c_rememberMe, c_aesKey, c_row);
                }
            } else {
                console.log("Password non valida");

                const message = await crypto.encrypt("Wrong password", publicKey);

                socket.emit("loginError", message);
            }
        } else if (await database.existInDatabase(database.tempUsers, nickname, email, "or")) {
            console.log("Utente non confermato");

            const message = await crypto.encrypt("User not confirmed", publicKey);

            socket.emit("loginError", message);
        } else {
            console.log("Utente non registrato");

            const message = await crypto.encrypt("User not registered", publicKey);

            socket.emit("loginError", message);
        }
    } else {
        //dati non validi
        console.log("Dati non validi");

        const crypted_check1 = await crypto.encrypt(check1, publicKey);
        const crypted_check2 = await crypto.encrypt(check2, publicKey);
        const crypted_check3 = await crypto.encrypt(check3, publicKey);
        const crypted_check4 = await crypto.encrypt(check4, publicKey);
        const crypted_check5 = await crypto.encrypt(check5, publicKey);
        const errors = validator.getErrors(nickname, password, "", check1, check2, check3, check4, check5, true).split("\n");
        const crypted_data1 = await crypto.encrypt(errors[0], publicKey);
        const crypted_data2 = await crypto.encrypt(errors[1], publicKey);
        const crypted_data3 = await crypto.encrypt(errors[2], publicKey);
        const crypted_data4 = await crypto.encrypt(errors[3], publicKey);
        const crypted_data5 = await crypto.encrypt(errors[4], publicKey);

        socket.emit("loginDataError", crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_check5, crypted_data1, crypted_data2, crypted_data3, crypted_data4, crypted_data5);
    }
}


module.exports = {
    login,
};