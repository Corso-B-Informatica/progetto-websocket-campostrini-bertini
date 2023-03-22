//chiedo al server la chiave aes
//se i dati sono sbagliati rimando l'utente alla pagina di registrazione e cancello localstorage
//su server se i dati sono giusti inseriamo il socket in tutti i gruppi a cui è iscritto
//poi assieme alla chiave aes gli mandiamo i messaggi nuovi
//se i dati sono giusti il server ci manda la chiave aes e noi costruiamo la chat con la chiave aes decripto la chat, poi la prendo le informazioni e creo gli elementi della pagina
//poi controlliamo se il rememeber me è false e se lo è cancelliamo email, password, nickname e remember me, ma i dati della chat ce li teniamo, finchè non viene aggiornata la pagina
//quindi da quel momento in poi dovremmo usare le informazioni di login contenute nella variabile data del localStrorage dentro la chat, la aesKey appena ci arriva la salviamo in una variabile
//poi controlliamo che abbiamo una chat, se non la abbiamo dobbiamo crearla.
/*contatto html*/
//gestire le emoji non abbiamo ancora fatto la tabella emoji


/*keyManager*/
const kM = new keyManager();

async function genKey() {
    await kM.generateNewKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");
}

genKey();

/*sortedChats*/
const sortedChats = new sortedChats();

/*Socket.io*/
var socket = io();

socket.on("publicKey", (publicKey, str) => {
    localStorage.setItem("publicKeyArmored", publicKey);
    if (str == "0") {
        login();
    }
    if (str == "1") {
        sendMessage();
    }
    if (str == "2") {
        sync();
    }
    if (str == "3") {
        creaChat();
    }
    if (str == "4") {
        getNewMessages();
    }
});

socket.on("sync", (crypted_chat) => {
    manageSync(crypted_chat);
});

socket.on("aesKey", (aesKey) => {
    manageAesKeySuccess(aesKey);
});

socket.on("errorAesKey", () => {
    clearLocalStorageWithoutKey();
    window.location.href = "../signUp.html";
});

socket.on("errorUserNotFound", () => {
    clearLocalStorageWithoutKey();
    window.location.href = "../signUp.html";
});

socket.on("errorPubKey", () => {
    var prompt = document.getElementById("prompt");

    // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
    prompt.style.display = "block";

    var noButton = document.getElementById("no-button");
    noButton.style.display = "block";

    document.getElementById("prompt-error").innerText =
        "Invalid public key";

    document.getElementById("prompt-text").innerText =
        "Please, try again later";

    document.getElementById("no-button").innerText = "Ok";
    kM.generateNewKeyPair();
    login();
});

socket.on("errorChatUserNotFound", () => {
    var chatName = document.getElementById("container-chatName");
    chatName.classList.add("error");
    chatName.setAttribute("error-message", "User not found");
});

socket.on("errorChatAlreadyExist", (crypted_chat) => {
    var chatName = document.getElementById("container-chatName");
    chatName.classList.add("error");
    chatName.setAttribute("error-message", "Chat already exist");

    manageNewMessages(crypted_chat);
});

socket.on("errorNewChat", () => {
    var prompt = document.getElementById("prompt");

    // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
    prompt.style.display = "block";

    var noButton = document.getElementById("no-button");
    noButton.style.display = "block";

    document.getElementById("prompt-error").innerText =
        "Unknown error";

    document.getElementById("prompt-text").innerText =
        "Please try again later";

    document.getElementById("no-button").innerText = "Ok";
});

socket.on("newChatCreated", (crypted_newChat) => {
    manageNewMessages(crypted_newChat)
});

socket.on("errorChatWithYourself", () => {
    var chatName = document.getElementById("container-chatName");
    chatName.classList.add("error");
    chatName.setAttribute("error-message", "Invalid User");
});

socket.on("errorGetNewMessages", () => {
    clearLocalStorageWithoutKey();
    window.location.href = "../signUp.html";
});

socket.on("newMessages", (newMessages) => {
    manageNewMessages(newMessages);
});

/*window load*/
async function login() {
    await genKey();

    if (checkData()) {
        if (checkKey()) {
            $('#loadingModal').modal('show');

            socket.emit(
                "getAesKey",
                await encrypt(localStorage.getItem("email"), localStorage.getItem("publicKeyArmored")),
                await encrypt(localStorage.getItem("nickname"), localStorage.getItem("publicKeyArmored")),
                await encrypt(localStorage.getItem("password"), localStorage.getItem("publicKeyArmored")),
                await encrypt(kM.getPublicKey(), localStorage.getItem("publicKeyArmored"))
            );

        } else {
            socket.emit("getPublicKey", "0");
        }
    } else {
        clearLocalStorageWithoutKey();
        window.location.href = "../signUp.html";
    }
}

window.onload = function () {
    login();
};

async function manageAesKeySuccess(crypted_aes_key) {
    var { data: aes_key } = await decrypt(
        crypted_aes_key,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );

    kM.setAesKey(aes_key);

    var data = localStorage.getItem("data");
    var chats = JSON.parse(decryptAES(data, aes_key));
    if (chats["chats"].length == 0 && chats["groups"].length == 0) {
        sync();
    } else {
        getNewMessages();
    }
}

/*sync*/
async function sync() {
    $('#loadingModal').modal('show');

    if (checkData()) {
        if (checkKey()) {
            if (kM.getAesKey() == null || kM.getAesKey() == undefined || kM.getAesKey() == "") {
                setTimeout(sync, 100);
            }
            else {
                var data = decryptAES(localStorage.getItem("data"), kM.getAesKey()).replaceAll("\\n", "").replaceAll("\r", "").replaceAll("\t", "").replaceAll(" ", "").replaceAll("\\", "");
                var decrypted_data = JSON.parse(data);
                var nickname = decrypted_data.nickname;
                var password = decrypted_data.password;
                var crypted_nickname = await encrypt(nickname, localStorage.getItem("publicKeyArmored"));
                var crypted_password = await encrypt(password, localStorage.getItem("publicKeyArmored"));
                var crypted_pubKey = await encrypt(kM.getPublicKey(), localStorage.getItem("publicKeyArmored"));
                socket.emit("sync", crypted_nickname, crypted_password, crypted_pubKey);
            }
        } else {
            socket.emit("getPublicKey", "2");
        }
    } else {
        clearLocalStorageWithoutKey();
        window.location.href = "../signUp.html";
    }
}

async function manageSync(crypted_chat) {
    var { data: data } = await decrypt(
        crypted_chat,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );

    localStorage.setItem("data", encryptAES(data, kM.getAesKey()));

    var chatsToupdate = JSON.parse(data).chats;
    var groupsToupdate = JSON.parse(data).groups;

    sortedChats.clear();

    for (let i = 0; i < chatsToupdate.length; i++) {
        sortedChats.add(chatsToupdate[i]);
    }

    for (let i = 0; i < groupsToupdate.length; i++) {
        sortedChats.add(groupsToupdate[i]);
    }

    $('#loadingModal').modal('hide');

    var rememberMe = localStorage.getItem("rememberMe");
    if (rememberMe != "true") {
        clearLocalStorageUser();
    }

    sortedChats.sort();
    createChats();
    showNewMessagesNumber();

    var storage = JSON.parse(decryptAES(localStorage.getItem("data"), kM.getAesKey()));
    var nickname = await encrypt(storage.nickname, localStorage.getItem("publicKeyArmored"));
    var password = await encrypt(storage.password, localStorage.getItem("publicKeyArmored"));
    var key = await encrypt(kM.getPublicKey(), localStorage.getItem("publicKeyArmored"));
    socket.emit("getOnlineUsers", nickname, password, key);
}

/*Get new memssages*/
async function getNewMessages() {
    $('#loadingModal').modal('show');

    if (checkData()) {
        if (checkKey()) {
            var data = decryptAES(localStorage.getItem("data"), kM.getAesKey()).replaceAll("\\n", "").replaceAll("\r", "").replaceAll("\t", "").replaceAll(" ", "").replaceAll("\\", "");
            var decrypted_data = JSON.parse(data);
            var nickname = JSON.stringify(decrypted_data.nickname);
            var password = JSON.stringify(decrypted_data.password);
            var crypted_nickname = await encrypt(nickname.substring(1, nickname.length - 1), localStorage.getItem("publicKeyArmored"));
            var crypted_password = await encrypt(password.substring(1, password.length - 1), localStorage.getItem("publicKeyArmored"));
            var crypted_pubKey = await encrypt(kM.getPublicKey(), localStorage.getItem("publicKeyArmored"));
            socket.emit("getNewMessages", crypted_nickname, crypted_password, crypted_pubKey);
        } else {
            socket.emit("getPublicKey", "4");
        }
    } else {
        clearLocalStorageWithoutKey();
        window.location.href = "../signUp.html";
    }
}

async function manageNewMessages(crypted_updates) {
    var { data: updates } = await decrypt(
        crypted_updates,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );

    var data = decryptAES(localStorage.getItem("data"), kM.getAesKey());
    var chats = data["chats"];
    var groups = data["groups"];
    
    var chatsToupdate = updates["chats"];
    var groupsToupdate = updates["groups"];

    for (let i = 0; i < chatsToupdate.length; i++) {
        var chatToupdate = chatsToupdate[i];
        var chat = chats.find(x => x.id == chatToupdate.id);
        var index = chats.indexOf(chat);
        if (chat != undefined) {
            for (let j = 0; j < chatToupdate.nonVisualized.length; j++) {
                chat.nonVisualized.push(chatToupdate.nonVisualized[j]);
            }
            chats[index] = chat;
            sortedChats.add(chat);
        } else {
            chats.push(chatToupdate);
            sortedChats.add(chatToupdate);
        }
    }

    for (let i = 0; i < groupsToupdate.length; i++) {
        var groupToupdate = groupsToupdate[i];
        var group = groups.find(x => x.id == groupToupdate.id);
        var index = groups.indexOf(group);
        if (group != undefined) {
            for (let j = 0; j < groupToupdate.nonVisualized.length; j++) {
                group.nonVisualized.push(groupToupdate.nonVisualized[j]);
            }
            groups[index] = group;
            sortedChats.add(group);
        } else {
            groups.push(groupToupdate);
            sortedChats.add(groupToupdate);
        }
    }

    data["chats"] = chats;
    data["groups"] = groups;
    
    localStorage.setItem("data", encryptAES(data, kM.getAesKey()));

    $('#loadingModal').modal('hide');

    var rememberMe = localStorage.getItem("rememberMe");
    if (rememberMe != "true") {
        clearLocalStorageUser();
    }

    sortedChats.sort();
    createChats();
    showNewMessagesNumber();

    var storage = JSON.parse(decryptAES(localStorage.getItem("data"), kM.getAesKey()));
    var nickname = await encrypt(storage.nickname, localStorage.getItem("publicKeyArmored"));
    var password = await encrypt(storage.password, localStorage.getItem("publicKeyArmored"));
    var key = await encrypt(kM.getPublicKey(), localStorage.getItem("publicKeyArmored"));
    socket.emit("getOnlineUsers", nickname, password, key);
}

/*Show new messages number*/
function showNewMessagesNumber() {
    var data = decryptAES(localStorage.getItem("data"), kM.getAesKey());
    var chats = data["chats"];
    var groups = data["groups"];

    var newMessagesNumber = 0;

    for (let i = 0; i < chats.length; i++) {
        newMessagesNumber += chats[i].nonVisualized.length;
    }

    for (let i = 0; i < groups.length; i++) {
        newMessagesNumber += groups[i].nonVisualized.length;
    }

    if (newMessagesNumber > 0) {
        $("#new-messages-number").html(newMessagesNumber);
        $("#new-messages-number").show();
    } else {
        $("#new-messages-number").hide();
    }
}

/*Crea contatti*/
function createChats() {
    
    var chats = sortedChats.getChats();

    for (let i = 0; i < chats.length; i++) {
        var contacts = document.getElementById("contact-list");
        var contact = document.createElement("button");
        contact.setAttribute("id", "contact-" + i);
        contact.setAttribute("onclick", "openChat(" + i + ")");
        contact.classList.add("bg-transparent");
        contact.classList.add("contact");
        contact.classList.add("d-flex");
        contact.classList.add("flex-wrap");
        contact.classList.add("align-items-center");
        contact.classList.add("justify-content-center");
        contact.classList.add("p-t-10");
        contact.classList.add("p-b-10");
        contact.classList.add("p-r-20");
        contact.classList.add("p-l-20");
        contact.classList.add("w-95");
        var contactDiv = document.createElement("div");
        contactDiv.classList.add("d-flex");
        contactDiv.classList.add("flex-wrap");
        contactDiv.classList.add("align-items-center");
        contactDiv.classList.add("justify-content-start");
        contactDiv.classList.add("w-100");
        var contactDiv2 = document.createElement("div");
        contactDiv2.classList.add("d-flex");
        contactDiv2.classList.add("flex-wrap");
        contactDiv2.classList.add("align-items-center");
        contactDiv2.classList.add("justify-content-start");
        contactDiv2.classList.add("w-80");
        var contactIcon = document.createElement("i");
        contactIcon.setAttribute("id", "contact-icon");
        contactIcon.classList.add("icon");
        contactIcon.classList.add("fa");
        contactIcon.classList.add("fa-user-o");
        contactIcon.classList.add("text-white");
        contactIcon.classList.add("p-r-15");
        contactIcon.classList.add("p-l-15");
        contactIcon.setAttribute("aria-hidden", "true");
        var contactDiv3 = document.createElement("div");
        contactDiv3.classList.add("d-flex");
        contactDiv3.classList.add("flex-column");
        var contactName = document.createElement("p");
        contactName.setAttribute("id", "contact-name");
        contactName.classList.add("user-select-none");
        contactName.classList.add("text-white");
        contactName.innerHTML = chats[i].name;
        var contactLastMessage = document.createElement("p");
        contactLastMessage.setAttribute("id", "contact-last-message");
        contactLastMessage.classList.add("user-select-none");
        contactLastMessage.classList.add("text-white");
        contactLastMessage.style.color = "var(--last-status-transparent);"
        contactLastMessage.innerHTML = chats[i].nonVisualized[chats[i].visualized.length - 1].message;
        var contactLastMessageTime = document.createElement("div");
        contactLastMessageTime.setAttribute("id", "contact-last-message-time");
        contactLastMessageTime.classList.add("w-20");
        contactLastMessageTime.classList.add("d-flex");
        contactLastMessageTime.classList.add("flex-wrap");
        contactLastMessageTime.classList.add("align-items-center");
        contactLastMessageTime.classList.add("justify-content-end");
        contactLastMessageTime.classList.add("p-r-15");
        var contactLastMessageTimeText = document.createElement("p");
        contactLastMessageTimeText.setAttribute("id", "contact-last-message-time-text");
        contactLastMessageTimeText.classList.add("user-select-none");
        contactLastMessageTimeText.classList.add("text-white");
        contactLastMessageTimeText.innerHTML = chats[i].nonVisualized[chats[i].visualized.length - 1].date;

        contactLastMessageTime.appendChild(contactLastMessageTimeText);
        contactDiv3.appendChild(contactName);
        contactDiv3.appendChild(contactLastMessage);
        contactDiv2.appendChild(contactIcon);
        contactDiv2.appendChild(contactDiv3);
        contactDiv.appendChild(contactDiv2);
        contactDiv.appendChild(contactLastMessageTime);
        contact.appendChild(contactDiv);
        contacts.appendChild(contact);
    }
}

async function sendMessage() {
    //da continuare
    var message = document.getElementById("message-input").value
    console.log(message)
    if (message.length > 2000) {
        //mostra un errore
    }
    else {
        let crypted_message = encrypt(message, localStorage.getItem("publicKeyArmored"))
        let crypted_nickname = encrypt(localStorage.getItem("nickname"), localStorage.getItem("publicKeyArmored"))
        let crypted_password = encrypt(localStorage.getItem("password"), localStorage.getItem("publicKeyArmored"))
        let crypted_id = encrypt("sos", localStorage.getItem("publicKeyArmored"))
        let crypted_publickey = encrypt(kM.getPublicKey(), localStorage.getItem("publicKeyArmored"))
        if (checkKey()) {
            socket.emit("message", crypted_message, crypted_nickname, crypted_password, crypted_id, crypted_publickey)
        }
        else {
            socket.emit("getPublicKey", "1")
        }
    }
    //pulsante che prende il testo da "message-input" incluse le emoji e poi prende i file che l'utente ha caricato
    //(max 20 file per un massimo di 100mB a file
    //controlla se i file sono meno di 20 e pesano il giusto
    //sul server fare il check chi è online in quella chat, se è una chat singola controllare solo che la persona sia online (mandare nella stanza con l'id della chat il messaggio e inserire nel database degli utenti le robe)
}


function openChat(index) {
    if (index >= 0 && index < sortedChats.size()) {
        if (index != sortedChats.getSelectedChat()) {
            $("#typezone").show();
            $("#header-chat").show();
            if (window.innerWidth < 901) {
                $("#menu").hide();
                $("#conversation").show();
            } else {
                document.getElementById("contact-" + index).classList.add("selected-chat");
                document.getElementById("contact-" + sortedChats.getSelectedChat()).classList.remove("selected-chat");
            }
            sortedChats.selectedChat(index);
            document.getElementById("messages").innerHTML = "";
            createChat(index);//da fare
            var selectedChat = sortedChats.get(index);
            if (selectedChat.nonVisualized.length > 0) {
                for (let i = 0; i < selectedChat.nonVisualized.length; i++) {
                    selectedChat.visualized.push(selectedChat.nonVisualized[i]);
                }
                selectedChat.nonVisualized = [];
                sortedChats.clear();
                sortedChats.addAll(selectedChat);
                var data = localStorage.getItem("data");
                var decrypted_data = decryptAES(data, kM.getAesKey());
                var chats = JSON.parse(decrypted_data);
                for (let i = 0; i < chats.length; i++) {
                    if (chats[i].id == selectedChat.id) {
                        chats[i].visualized = selectedChat.visualized;
                        chats[i].nonVisualized = selectedChat.nonVisualized;
                    }
                }
                var encrypted_data = encryptAES(JSON.stringify(chats), kM.getAesKey());
                localStorage.setItem("data", encrypted_data);
                showNewMessagesNumber();
            }
        }

    } else {
        var prompt = document.getElementById("prompt");

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = "block";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";

        document.getElementById("prompt-error").innerText =
            "An error occurred";

        document.getElementById("prompt-text").innerText =
            "Please try again later";

        document.getElementById("no-button").innerText = "Ok";
    }
}

async function searchContact() {
    var contact = document.getElementById("contact-input").value;

    if (contact.trim().length > 0) {
        var data = localStorage.getItem("data");
        var decrypted_data = decryptAES(data, kM.getAesKey());
        var chats = JSON.parse(decrypted_data);
        for (let i = 0; i < chats["chats"].length; i++) {
            if (chats["chats"][i].name != contact) {
                if (!chats["chats"][i].name.includes(contact)) {
                    document.getElementById("contact-" + i).style.display = "none";
                }
            }
        }

        for (let i = 0; i < chats["groups"].length; i++) {
            if (chats["groups"][i].name != contact) {
                if (!chats["groups"][i].name.includes(contact)) {
                    document.getElementById("contact-" + i).style.display = "none";
                }
            }
        }
    }
}

function attachFile() {
    var fileInput = document.getElementById("myFile");
    fileInput.click();
}

//emoji-button e attach button da gestire (bottoni per attaccare file e emoji)
function changeNewChatType() {
    var checkbox = document.getElementById("isGroup");

    if (checkbox.checked) {
        document.getElementById("chatNameLabel").innerText = "Group name";
    } else {
        document.getElementById("chatNameLabel").innerText = "Nickname";
    }
}

function signOut() {
    clearLocalStorageWithoutKey();
    window.location.href = "../signUp.html";
}

/*Input limit*/
document.getElementById("message-input").addEventListener("input", function () {
    var text = document.getElementById("message-input").value;
    if (text.length > 2000) {
        var prompt = document.getElementById("prompt");
        prompt.style.display = "block";

        var yesButton = document.getElementById("yes-button");
        yesButton.style.display = "block";
        yesButton.innerText = "Upload as file";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";
        noButton.innerText = "Cancel";

        document.getElementById("prompt-error").innerText =
            "Your message is too long...";
        document.getElementById("prompt-text").innerText =
            "You have exceeded the limit of 2000 characters.";

        // Aggiungi un event listener al bottone "Yes"
        document.getElementById("yes-button").addEventListener("click", () => {
            //gestisci la creazione del file
        });

        document.getElementById("no-button").addEventListener("click", () => {
            document.getElementById("message-input").value = text.substring(0, 2000);
        });
    }
});

/*Toggle prompt*/
document.getElementById("no-button").addEventListener("click", () => {
    var prompt = document.getElementById("prompt");
    prompt.style.display = "none";

    var yesButton = document.getElementById("yes-button");
    yesButton.style.display = "none";
    yesButton.innerText = "Yes";

    var noButton = document.getElementById("no-button");
    noButton.style.display = "none";
    noButton.innerText = "No";
});

document.getElementById("yes-button").addEventListener("click", () => {
    var prompt = document.getElementById("prompt");
    prompt.style.display = "none";

    var yesButton = document.getElementById("yes-button");
    yesButton.style.display = "none";
    yesButton.innerText = "Yes";

    var noButton = document.getElementById("no-button");
    noButton.style.display = "none";
    noButton.innerText = "No";
});

//se la key è invio premo il bottone
document.onkeydown = function (e) {
    if (e.keyCode == 13) {
        if (document.getElementById("message-input").value != "") {
            sendMessage();
        }
    }
}

document.getElementById("contact-input").addEventListener("input", function () {
    searchContact();
    var text = document.getElementById("contact-input").value;
    if (text.length > 30) {
        document.getElementById("contact-input").value = text.substring(0, 30);
    }
});

/*Reset error message*/
document.getElementById("chatName").oninput = function () {
    if (document.getElementById("isGroup").checked) {
        var containerEmail = document.getElementById("container-chatName");
        containerEmail.setAttribute("error-message", "Invalid Group");
    } else {
        var containerEmail = document.getElementById("container-chatName");
        containerEmail.setAttribute("error-message", "Invalid User");
    }
};

/*Reset errori*/
document.getElementById("chatName").onclick = function () {
    var containerEmail = document.getElementById("container-chatName");
    containerEmail.classList.remove("error");
};

document.getElementById("chatNameLabel").onclick = function () {
    var containerEmail = document.getElementById("container-chatName");
    containerEmail.classList.remove("error");
};