const crypto = require("./crypto.js");
const database = require("./database.js");
const validator = require("./validator.js");

async function sendAesKey(
    crypted_email,
    crypted_nickname,
    crypted_password,
    crypted_pubKey,
    socket
) {
    var validate_email = "";
    var validate_password = "";
    var validate_nickname = "";
    var validate_pubKey = "";

    try {
        validate_email = await crypto.doubleDecrypt(crypted_email);
    } catch (err) {
        validate_email = "";
    }
    try {
        validate_password = await crypto.doubleDecrypt(crypted_password);
    } catch (err) {
        validate_password = "";
    }
    try {
        validate_nickname = await crypto.doubleDecrypt(crypted_nickname);
    } catch (err) {
        validate_nickname = "";
    }
    try {
        validate_pubKey = await crypto.decrypt(crypted_pubKey);
    } catch (err) {
        validate_pubKey = "";
    }

    const email =
        validate_email == undefined ? "" : validator.validate(validate_email);
    const password =
        validate_password == undefined ? "" : validator.validate(validate_password);
    const nickname =
        validate_nickname == undefined ? "" : validator.validate(validate_nickname);
    const publicKey =
        validate_pubKey.data == undefined ? "" : validate_pubKey.data;

    const aesKey = await database.getAesKey(email, nickname, password);

    if (aesKey == null || aesKey == undefined || aesKey.trim().length == 0) {
        socket.emit("ErrorAesKey");
    } else {
        var chat = await database.GetChat(nickname);
        for (let i = 0; i < (chat.chat.length); i++) {
            socket.join(chat.chat[i].chatId);
        }
        socket.emit(
            "AesKey",
            crypto.encrypt(
                aesKey,
                publicKey
            ),
            crypto.encrypt(chat, publicKey)
        );
    }
}

module.exports = { sendAesKey };
