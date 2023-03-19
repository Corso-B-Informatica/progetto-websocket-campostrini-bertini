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
    const email = await validator.UltimateValidator(crypted_email, 1, true);
    const password = await validator.UltimateValidator(crypted_password, 1, true);
    const nickname = await validator.UltimateValidator(crypted_nickname, 1, true);
    const publicKey = await validator.UltimateValidator(crypted_pubKey, 0, false);

    var check1 = validator.checkEmail(email);
    var check2 = validator.checkPassword(password);
    var check3 = validator.checkUsername(nickname);
    var check4 = await crypto.isValid(publicKey);

    const aesKey = await database.getAesKey(email, nickname, password);

    if (aesKey == null || aesKey == undefined) {
        socket.emit("errorAesKey");
    } else if (aesKey.trim().length == 0 || aesKey == "false") {
        socket.emit("errorAesKey");
    }
    else if ((check1 || check2) && check3 && check4) {
        var chat = await JSON.parse(await database.GetChat(nickname));

        for (let i = 0; i < Object.keys(chat.chats).length; i++) {
            socket.join(JSON.stringify(chat.chats[i].Id));
        }
        for (let i = 0; i < Object.keys(chat.groups).length; i++) {
            socket.join(JSON.stringify(chat.groups[i].Id));
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

    const message = await validator.UltimateValidator(crypted_message, 0, true);
    const id = await validator.UltimateValidator(crypted_id, 0, true);
    const password = await validator.UltimateValidator(crypted_password, 0, true);
    const nickname = await validator.UltimateValidator(crypted_nickname, 0, true);
    const pubKey = await validator.UltimateValidator(crypted_pubKey, 0, false);

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
    
    const password = await validator.UltimateValidator(crypted_password, 0, true);
    const nickname = await validator.UltimateValidator(crypted_nickname, 0, true);
    const pubKey = await validator.UltimateValidator(crypted_pubKey, 0, false);

    let check = await crypto.isValid(pubKey);

    if (!check) {
        socket.emit("errorPubKeySync");
    }
    else if (await database.checkDatabase(database.Users, nickname, "", password)) {
        var chat = JSON.stringify(JSON.parse(await database.GetChat(nickname)));
        var crypted_chat = await crypto.encrypt(chat, pubKey);
        socket.emit("sync", crypted_chat);
    }
    else {
        socket.emit("errorUserNotFound");
    }
}

async function newChat(crypted_nickname, crypted_password, crypted_id, crypted_pubKey, socket) {

    const password = await validator.UltimateValidator(crypted_password, 0, true);
    const nickname = await validator.UltimateValidator(crypted_nickname, 0, true);
    const id = await validator.UltimateValidator(crypted_id, 0, true);
    const pubKey = await validator.UltimateValidator(crypted_pubKey, 0, false);

    let check = await crypto.isValid(pubKey);

    if (!check) {
        socket.emit("errorPubKeySync");
    }
    
    else if (await database.checkDatabase(database.Users, nickname, "", password)) {
        if (await database.existNickname(id)) {
            if (await database.checkChatExist(nickname, id, "chat")) {
                var chat = JSON.parse(await database.GetChat(nickname));
                let json = {"id" : id , "messages": {}}
                chat.chats.push(json);
                if(await database.newChat(nickname,chat)){
                    socket.join(id);
                    console.log("Cinesello Balsamo")
                }else{
                    socket.emit("errorNewChat");
                }
            } else {
                socket.emit("errorChatAlreadyExist");
            }
        } else {
            socket.emit("errorChatName");
        }
    }
    else {
        socket.emit("errorUserNotFound");
    }
}

module.exports = {
    sendAesKey,
    sendMessage,
    sync,
    newChat
};
