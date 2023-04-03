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

    const aesKey = await database.getAesKey(email, nickname, password);
    if (aesKey == null || aesKey == undefined) {
        socket.emit("errorAesKey");
    } else if (aesKey.trim().length == 0 || aesKey == "false") {
        socket.emit("errorAesKey");
    }
    else if (await database.checkDatabase(database.Users, nickname, email, password)) {
        var chat = await JSON.parse(await database.GetChat(nickname));
        
        for (let i = 0; i < chat["chats"].length; i++) {
            socket.join(chat["chats"][i].id);
        }
        for (let i = 0; i < chat["groups"].length; i++) {
            socket.join(chat["groups"][i].id);
        }

        socketList.sockets[nickname] = socket;
        socket.broadcast.emit("online", nickname);// da fare

        var message = await crypto.encrypt(
            aesKey,
            publicKey
        );

        socket.emit(
            "aesKey",
            message
        );
    } else {
        socket.emit("errorAesKey");
    }
}

async function getNewMessages(crypted_nickname, crypted_password, crypted_pubKey, socket) {
    const password = await validator.UltimateValidator(crypted_password, 0, true);
    const nickname = await validator.UltimateValidator(crypted_nickname, 0, true);
    const pubKey = await validator.UltimateValidator(crypted_pubKey, 0, false);

    let check = await crypto.isValid(pubKey);

    if (!check) {
        socket.emit("errorPubKey");
    } else if (await database.checkDatabase(database.Users, nickname, "", password)) {
        var chat = JSON.parse(await database.GetChat(nickname));
        var chats = chat["chats"];
        var groups = chat["groups"];

        var chatsToSend = { "chats": [], "groups": [] };

        for (let i = 0; i < chats.length; i++) {
            var chatToPush = { "id": chats[i].id, "name": chats[i].name, "visualized": [], "nonVisualized": [], "removed": [] };
            chatToPush["nonVisualized"] = chats[i].nonVisualized;
            chatsToSend["chats"].push(chatToPush);
        }
        for (let i = 0; i < groups.length; i++) {
            var groupToPush = { "id": groups[i].id, "name": groups[i].name, "visualized": [], "nonVisualized": [], "removed": [], "members": [] };
            groupToPush["nonVisualized"] = groups[i].nonVisualized;
            chatsToSend["groups"].push(groupToPush);
        }

        var crypted_chats = await crypto.encrypt(
            JSON.stringify(chatsToSend),
            pubKey
        );

        socket.emit("newMessages", crypted_chats);
    } else {
        socket.emit("errorGetNewMessages");
    }
}

async function AddMessage(crypted_message, crypted_nickname, crypted_password, crypted_id, crypted_pubKey, socket, io) {
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
        socket.emit("errorPubKey");
    }
    else {
        if (await database.checkDatabase(database.Users, nickname, "", password)) {
            if (await database.checkIdExist(nickname, id)) {
                if (id > 30) {
                    let chat = JSON.parse(await database.GetChat(nickname));
                    console.log(chat)
                    for (let i = 0; i < chat.groups.length; i++) {
                        if (chat.groups[i].id == id) {
                            chat.groups[i].nonVisualized.push({ "message": message, "nickname": nickname, "date": new Date().toISOString() });
                            chat.groups[i].members.forEach(element => {
                                (async () => {
                                    let chat = JSON.parse(await database.GetChat(element));
                                    let json = { "message": message, "nickname": nickname, "date": new Date().toISOString() };
                                    for (let i = 0; i < chat.groups.length; i++) {
                                        if (chat.groups[i].id == id) {
                                            chat.groups[i].nonVisualized.push(json);
                                            database.JsonUpdate(element, JSON.stringify(chat));
                                            //da finire
                                        }
                                    }
                                })
                            });
                        }
                    }

                } else {
                    var chat1 = JSON.parse(await database.GetChat(nickname));
                    let json1 = { "message": message, "nickname": nickname, "date": new Date().toISOString() };
                    for (let i = 0; i < chat1.chats.length; i++) {
                        if (chat1.chats[i].id == id) {
                            chat1.chats[i].visualized.push(json1);
                            database.JsonUpdate(nickname, JSON.stringify(chat1))
                            socket.emit("newMessages", await crypto.encrypt(JSON.stringify({ "chats": [{ "id": chat1.chats[i].id, "name": chat1.chats[i].name, "visualized": [json1], "nonVisualized": [], "removed": [] }], "groups": [] }), pubKey))
                        }
                    }
                    var nickname2 = id.replace(nickname, "");
                    var chat2 = JSON.parse(await database.GetChat(nickname2))
                    let json2 = { "message": message, "nickname": nickname, "date": new Date().toISOString() };
                    for (let i = 0; i < chat2.chats.length; i++) {
                        if (chat2.chats[i].id == id) {
                            chat2.chats[i].nonVisualized.push(json2);
                            database.JsonUpdate(nickname2, JSON.stringify(chat2));
                            socketList.sockets[nickname2].emit("newMessages", await crypto.encrypt(JSON.stringify({ "chats": [{ "id": chat2.chats[i].id, "name": chat2.chats[i].name, "visualized": [], "nonVisualized": [json2], "removed": [] }], "groups": [] }), pubKey));
                        }
                    }
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
        socket.emit("errorPubKey");
    }
    else if (await database.checkDatabase(database.Users, nickname, "", password)) {
        var chat = JSON.stringify(JSON.parse(await database.GetChat(nickname)));
        var crypted_chat = await crypto.encrypt(chat, pubKey);
        socket.emit("sync", crypted_chat);
    }
    else {
        socket.emit("errorUserNotFound");
    }
    //in futuro restituire anche immagini e file
}

async function newChat(crypted_nickname, crypted_password, crypted_chatName, crypted_pubKey, socket) {

    const password = await validator.UltimateValidator(crypted_password, 0, true);
    const nickname = await validator.UltimateValidator(crypted_nickname, 0, true);
    const chatName = await validator.UltimateValidator(crypted_chatName, 0, true);
    const pubKey = await validator.UltimateValidator(crypted_pubKey, 0, false);

    let check = await crypto.isValid(pubKey);

    if (!check) {
        socket.emit("errorPubKey");
    }
    else if (await database.checkDatabase(database.Users, nickname, "", password)) {
        if (await database.existNickname(chatName)) {
            const id = nickname + chatName;
            if (chatName != nickname) {
                if (!await database.checkChatExist(nickname, id, "chats") && !await database.checkChatExist(nickname, chatName + nickname, "groups")) {
                    var data1 = JSON.parse(await database.GetChat(nickname));
                    data1["chats"].push({ "id": id, "name": chatName, "visualized": [], "nonVisualized": [], "removed": [] });
                    if (await database.JsonUpdate(nickname, JSON.stringify(data1))) {
                        var data2 = JSON.parse(await database.GetChat(chatName));
                        data2["chats"].push({ "id": id, "name": nickname, "visualized": [], "nonVisualized": [], "removed": [] });
                        if (await database.JsonUpdate(chatName, JSON.stringify(data2))) {
                            socket.join(id);
                            let socketDestination = socketList.sockets[chatName];
                            socketDestination.emit("getPublicKey", "0", await crypto.encrypt(id, pubKey));
                            //emittiamo all'altro socket un messaggio per ottenere la chiave pubblica
                            //e una volta ottenuta possiamo mandargli i messaggi
                        } else {
                            socket.emit("errorNewChat");
                        }
                    } else {
                        socket.emit("errorNewChat");
                    }
                } else {
                    var data1 = JSON.parse(await database.GetChat(chatName));
                    for (let i = 0; i < data1["chats"].length; i++) {
                        if (data1["chats"][i]["id"] == id || data1["chats"][i]["id"] == chatName + nickname) {
                            var crypted_chat = await crypto.encrypt(JSON.stringify({ "chats": data1["chats"][i], "groups": [] }), pubKey);
                            socket.emit("errorChatAlreadyExist", crypted_chat);
                        }
                    }
                }
            } else {
                socket.emit("errorChatWithYourself");
            }
        } else {
            socket.emit("errorChatUserNotFound");
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
        socket.emit("errorPubKey");
    }
    else if (await database.checkDatabase(database.Users, nickname, "", password)) {

        let id = crypto.encryptAES(groupname) + new Date().toISOString() + crypto.generateRandomKey(10)
        console.log(id)
        let chat = JSON.parse(await database.GetChat(nickname));
        let json = { "id": id, "nome": groupname, "members": {}, "visualized": {}, "nonVisualized": {}, "removed": {} }
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

/**
 * Quando viene creata una nuova chat, viene chiesta la aes key al destinatario e poi una volta che ce la manda gli mandiamo la nuova chat.
 */
async function sendNewChat(publicKey, nickname, password, id, socket) {
    var pubKey = await validator.UltimateValidator(publicKey, 0, false);
    var nick = await validator.UltimateValidator(nickname, 0, true);
    var pass = await validator.UltimateValidator(password, 0, true);
    var chat = await validator.UltimateValidator(id, 0, true);

    let check = await crypto.isValid(pubKey);

    if (!check) {
        socket.emit("errorPubKey");
    } else if (await database.checkDatabase(database.Users, nick, "", pass)) {
        socket.join(chat);
        var newChat2 = await crypto.encrypt(JSON.stringify({ "chats": [{ "id": id, "name": nickname, "visualized": [], "nonVisualized": [], "removed": [] }], "groups": [] }), pubKey);
        socket.emit("newChatCreated", newChat2);
    } else {
        socket.emit("errorUserNotFound");
    }
}

module.exports = {
    newChat,
    newGroup,
    sendAesKey,
    AddMessage,
    sync,
    getNewMessages
    ,sendNewChat
};
