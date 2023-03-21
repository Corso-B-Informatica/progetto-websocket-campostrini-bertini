const crypto = require("./crypto.js");
const database = require("./database.js");
const validator = require("./validator.js");
const socketList = require("./socketList.js");

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

        socketList.pushSocket(nickname, socket);

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
    else if (!check) {
        socket.emit("errorPubKeySendMessage");
    }
    else {
        if (await database.checkDatabase(database.Users, nickname, "", password)) {
            if (await database.checkIdExist(nickname, id)) {
                console.log('si')
                if(id > 30){
                let chat = JSON.parse(await database.GetChat(nickname));
                chat.groups[id].members.forEach(element => {
                    (async () => {
                        let chat = JSON.parse(await database.GetChat(element));
                        let json = {"message": message, "nickname": nickname, "date": new Date().toISOString()};
                        chat.groups[id].nonVisualized.push(json);
                        }) 
                });

            }else{
                var chat1 = JSON.stringify(JSON.parse(await database.GetChat(nickname)));
                let json1 = {"message": message, "nickname": nickname, "date": new Date().toISOString()};
                chat1.chats[id].nonVisualized.push(json1);
                var chat2 = JSON.stringify(JSON.parse(await database.GetChat(id)))
                let json2 = {"message": message, "nickname": nickname, "date": new Date().toISOString()};
                chat2.chats[id].nonVisualized.push(json2);
            }
            }
        }
        else {
            socket.emit("errorIdNotFound");
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
                let json = { "id": id, "visualized": {},"nonVisualized": {},"removed": {} }
                chat.chats.push(json);
                if (await database.JsonUpdate(nickname, chat)) {
                    socket.join(id);
                    console.log("Cinesello Balsamo")
                } else {
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

async function newGroup(crypted_nickname, crypted_password, crypted_members, crypted_pubKey, crypted_groupname, socket) {

    const password = await validator.UltimateValidator(crypted_password, 0, true);
    const nickname = await validator.UltimateValidator(crypted_nickname, 0, true);
    // array di nickname, vedere se validazione funziona
    const members = await validator.UltimateValidator(crypted_members, 0, true);
    const pubKey = await validator.UltimateValidator(crypted_pubKey, 0, false);
    const groupname = await validator.UltimateValidator(crypted_groupname, 0, true);

    let check = await crypto.isValid(pubKey);

    if (!check) {
        socket.emit("errorPubKeySync");
    }
    else if (await database.checkDatabase(database.Users, nickname, "", password)) {

        let id = crypto.encryptAES(groupname) + new Date().toISOString() + crypto.generateRandomKey(10)
        console.log(id)
        let chat = JSON.parse(await database.GetChat(nickname));
        let json = { "id": id, "nome": groupname, "members": {}, "visualized": {},"nonVisualized": {},"removed": {} }
        chat.chats.push(json);
        members.forEach(member => {
            //penso che il path sia sbagliato
            chat.groups.members.push(member)
        });
        if (await database.JsonUpdate(nickname, chat)) {
            socket.join(id);
            console.log("Cinesello Balsamo")
        } else {
            socket.emit("errorNewGroup");
        }
    } else {
        socket.emit("errorNewGroupCredentials");
    }

}

module.exports = {
    newChat,
    newGroup,
    sendAesKey,
    sendMessage,
    sync,
    newChat
};
