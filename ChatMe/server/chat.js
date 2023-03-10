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
        validate_pubKey = await crypto.decrypt(crypted_pubKey, crypto.privateKey);
    } catch (err) {
        validate_pubKey = "";
    }

    const email =
        validate_email == undefined ? "" : validator.validate(validate_email);
    const password =
        validate_password == undefined ? "" : validator.validate(validate_password);
    const nickname =
        validate_nickname == undefined ? "" : validator.validate(validate_nickname);
    const pubKey =
        validate_pubKey.data == undefined ? "" : validate_pubKey.data;
    console.log(email, password, nickname)
    const aesKey = await database.getAesKey(email, nickname, password);

    if (aesKey == null || aesKey == undefined || aesKey.trim().length == 0) {
        socket.emit("errorAesKey");
    } else {
        var chat = JSON.parse(await database.GetChat(nickname));
        console.log(chat)
        for (let i = 0; i < (chat.chats.length); i++) {
            socket.join(chat.chats[i].chatId);
        }
        socket.emit(
            "aesKey",
            await crypto.encrypt(
                aesKey,
                pubKey
            )
        );
    }
}

module.exports = { sendAesKey };
