const crypto = require('./crypto.js');
const database = require('./database.js');

async function sendAesKey(email, nickname, password, pubKey, socket) {
    var validate_email = "";
    var validate_password = "";
    var validate_nickname = "";

    try {
        validate_email = await crypto.doubleDecrypt(email);
    } catch (err) {
        validate_email = "";
    }
    try {
        validate_password = await crypto.doubleDecrypt(password);
    } catch (err) {
        validate_password = "";
    }
    try {
        validate_nickname = await crypto.doubleDecrypt(nickname);
    } catch (err) {
        validate_nickname = "";
    }
    try {
        validate_pubKey = await crypto.decrypt(pubKey);
    } catch (err) {
        validate_pubKey = "";
    }
    if (await database.getAesKey(validate_email, validate_nickname, validate_password) == null) {
        socket.emit("ErrorAesKey");
    }
    else {
        socket.emit("AesKey", await database.getAesKey(validate_email, validate_nickname, validate_password))
    }

}
