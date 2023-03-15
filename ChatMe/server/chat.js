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
    const publicKey =
        validate_pubKey.data == undefined ? "" : validate_pubKey.data;
    var check = await crypto.isValid(publicKey);
    const aesKey = await database.getAesKey(email, nickname, password);

    if (aesKey == null || aesKey == undefined || aesKey.trim().length == 0) {
        socket.emit("errorAesKey");
    } else {

        var chat = JSON.parse(await database.GetChat(nickname));

        for (let i = 0; i < (chat.chat.length); i++) {
            socket.join(chat.chat[i].chatId);
        }

        var message = await crypto.encrypt(
            aesKey,
            publicKey
        );

        socket.emit(
            "aesKey",
            message
        );
    }
}


async function sendMessage(crypted_message, crypted_nickname, crypted_password, crypted_id, crypted_pubKey, socket) {
    var validate_id = "";
    var validate_password = "";
    var validate_nickname = "";
    var validate_pubKey = "";
    var validate_message = "";


    try {
        validate_message = await crypto.decrypt(crypted_message, crypto.privateKey);
    } catch (err) {
        validate_message = "";
    }

    try {
        validate_id = await crypto.decrypt(crypted_id, crypto.privateKey);
    } catch (err) {
        validate_id = "";
    }
    try {
        validate_password = await crypto.decrypt(crypted_password, crypto.privateKey);
    } catch (err) {
        validate_password = "";
    }
    try {
        validate_nickname = await crypto.decrypt(crypted_nickname, crypto.privateKey);
    } catch (err) {
        validate_nickname = "";
    }
    try {
        validate_pubKey = await crypto.decrypt(crypted_pubKey, crypto.privateKey);
    } catch (err) {
        validate_pubKey = "";
    }

    const message =
        validate_message == undefined ? "" : validator.validate(validate_message);
    const id =
        validate_id == undefined ? "" : validator.validate(validate_id);
    const password =
        validate_password == undefined ? "" : validator.validate(validate_password);
    const nickname =
        validate_nickname == undefined ? "" : validator.validate(validate_nickname);
    const pubKey =
        validate_pubKey.data == undefined ? "" : validate_pubKey.data;

    let check = await crypto.isValid(pubKey);

    if (message == null || message == undefined || message.trim().length == 0 || message > 2000) {
        socket.emit("errorSendMessage");
    }
    else if (check) {
        socket.emit("errorPubKeySendMessage");
    }
    else {
        if (await database.checkDatabase(database.Users, nickname, "", password)) {
            if (await database.checkDestinationUser(nickname, id)) {
                console.log('si')
                var chat = JSON.parse(await database.GetChat(nickname));
            }
        }
        else {
            socket.emit("errorUserNotFound");
        }
    }

}

async function sync(crypted_nickname, crypted_password, crypted_pubKey, socket) {
    
    var validate_password = "";
    var validate_nickname = "";
    var validate_pubKey = "";

    try {
        validate_password = await crypto.decrypt(crypted_password, crypto.privateKey);
    } catch (err) {
        validate_password = "";
    }
    try {
        validate_nickname = await crypto.decrypt(crypted_nickname, crypto.privateKey);
    } catch (err) {
        validate_nickname = "";
    }
    try {
        validate_pubKey = await crypto.decrypt(crypted_pubKey, crypto.privateKey);
    } catch (err) {
        validate_pubKey = "";
    }

    const password =
        validate_password.data == undefined ? "" : validator.validate(validate_password.data);
    const nickname =
        validate_nickname.data == undefined ? "" : validator.validate(validate_nickname.data);
    const pubKey =
        validate_pubKey.data == undefined ? "" : validate_pubKey.data;

    let check = await crypto.isValid(pubKey);

    if(!check){
        socket.emit("errorPubKeySync");
    }
    else if (await database.checkDatabase(database.Users, nickname, "", password)){
        var crypted_chat = crypto.encrypt(await database.GetChat(nickname), pubKey);
        socket.emit("sync", crypted_chat);
    }
    else{
        socket.emit("errorUserNotFound");
    }
}

module.exports = {
    sendAesKey,
    sendMessage,
    sync
};
