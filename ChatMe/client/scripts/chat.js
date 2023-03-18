//chiedo al server la chiave aes
//se i dati sono sbagliati rimando l'utente alla pagina di registrazione e cancello localstorage
//su server se i dati sono giusti inseriamo il socket in tutti i gruppi a cui è iscritto
//poi assieme alla chiave aes gli mandiamo i messaggi nuovi
//se i dati sono giusti il server ci manda la chiave aes e noi costruiamo la chat con la chiave aes decripto la chat, poi la prendo le informazioni e creo gli elementi della pagina
//poi controlliamo se il rememeber me è false e se lo è cancelliamo email, password, nickname e remember me, ma i dati della chat ce li teniamo, finchè non viene aggiornata la pagina
//quindi da quel momento in poi dovremmo usare le informazioni di login contenute nella variabile data del localStrorage dentro la chat, la aesKey appena ci arriva la salviamo in una variabile
//poi controlliamo che abbiamo una chat, se non la abbiamo dobbiamo crearla.
/*contatto html*/
/*
                    <button class="bg-transparent contact d-flex flex-wrap align-items-center justify-content-center p-t-10 p-b-10 p-r-20 p-l-20 w-95">
                        <div class="d-flex flex-wrap align-items-center justify-content-start w-100">
                            <div class="d-flex flex-wrap align-items-center justify-content-start w-80">
                                <i id="contact-icon" class="icon fa fa-user-o text-white p-r-15 p-l-15" aria-hidden="true"></i>
                                <div class="d-flex flex-column">
                                    <p id="contact-name" class="user-select-none text-white">Nome</p>
                                    <p id="contact-last-message" class="user-select-none text-white">Ultimo messaggio</p>
                                </div>
                            </div>
                            <div id="contact-last-message-time" class="w-20 d-flex flex-wrap justify-content-end align-items-center p-r-15">
                                <p id="contact-last-message-time-text" class="user-select-none text-white">00:00</p>
                            </div>
                        </div>
                    </button>
*/
//gestire le emoji non abbiamo ancora fatto la tabella emoji

/*keyManager*/
const kM = new keyManager();

async function genKey() {
    await kM.generateNewKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");
}

genKey();

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
    if(str == "3"){
        creaChat();
    }
});

socket.on("sync", (crypted_chat) =>{
    manageSync(crypted_chat);
});

socket.on("aesKey", (aesKey) => {
    manageAesKeySuccess(aesKey);
});

socket.on("errorAesKey", ()  => {
    clearLocalStorageWithoutKey();
    window.location.href = "../signUp.html";
});

socket.on("errorUserNotFound", () => {
    clearLocalStorageWithoutKey();
    window.location.href = "../signUp.html";
});

socket.on("errorPubKeySync", () => {
    alert("Error: public key sync");
});

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

/*Check if the user is logged in*/
async function login() {
    await genKey();
    if (checkData()) {
        if (checkKey()) {
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

login();

async function sendMessage() {
        //da continuare
        var message = document.getElementById("message-input").value
        console.log(message)
        if(message.length > 2000) {
            //mostra un errore
        }
        else{
            let crypted_message = encrypt(message, localStorage.getItem("publicKeyArmored"))
            let crypted_nickname = encrypt(localStorage.getItem("nickname"), localStorage.getItem("publicKeyArmored"))
            let crypted_password = encrypt(localStorage.getItem("password"), localStorage.getItem("publicKeyArmored"))
            let crypted_id = encrypt("sos", localStorage.getItem("publicKeyArmored"))
            let crypted_publickey = encrypt(kM.getPublicKey(), localStorage.getItem("publicKeyArmored"))
            if(checkKey()){
                socket.emit("message", crypted_message, crypted_nickname, crypted_password, crypted_id, crypted_publickey)
            }
            else{
                socket.emit("getPublicKey", "1")
            }
        }
    //pulsante che prende il testo da "message-input" incluse le emoji e poi prende i file che l'utente ha caricato
    //(max 100 file per un massimo di 100mB a file e un massimo di un totale di 5gB si potrebbe anche fare 10gB ma andrebbe a ridurre le prestazioni 50% di maxPotenziale)
    //controlla se i file sono meno di 100 e pesano il giusto
    //sul server fare il check chi è online in quella chat, se è una chat singola controllare solo che la persona sia online (mandare nella stanza con l'id della chat il messaggio e inserire nel database degli utenti le robe)
}
async function searchContact() {
    var contact = document.getElementById("contact-input").value;

    if (contact.trim().length > 0) {
        var data = localStorage.getItem("data");
        var decrypted_data = decryptAES(data, kM.getAesKey());
        var chats = JSON.parse(decrypted_data);
        for(let i = 0; i < chats.chat.length; i++){
            if(chats.chat[i].nickname != contact){
                if (!chats.group[i].nickname.includes(contact)) {
                    document.getElementById("chat-" + i).style.display = "none";
                }
            }
        }

        for (let i = 0; i < chats.group.length; i++) {
            if (chats.group[i].name != contact) {
                if(!chats.group[i].nickname.includes(contact)){
                    document.getElementById("group-" + i).style.display = "none";
                }
            }
        }
    }
}

async function addContact() {
}


async function manageSync(crypted_chat) {
    var { data: chat } = await decrypt(
        crypted_chat,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    console.log("frocio")
    localStorage.setItem("data", encryptAES(chat, kM.getAesKey()));
}

function attachFile() {
    var fileInput = document.getElementById("myFile");
    fileInput.click();
}
async function creaChat() {
    if (checkKey()) {
        var chatName = document.getElementById("chatName").value;

        if (document.getElementById("isGroup").checked) {
            //nel caso di un gruppo lo gestiremo più avanti
        } else {
            if (chatName.trim().length > 0) {
                if (chatName.trim().length <= 30) {
                    if (!chatName.includes("@")) {
                        if (/[a-zA-Z0-9]/.test(chatName)) {
                            //se aesKey è valida posso decriptare i dati nel localstorage, vedo se sono presenti username e password, se ci sono chill, se no tento di vedere se ci sono con email password e nickname se no lo sloggo
                            var aesKey = kM.getAesKey();
                            if (aesKey != null && aesKey != undefined && aesKey != "") {
                                var data = localStorage.getItem("data");
                                var decrypted_data = decryptAES(data, aesKey);
                                var chats = JSON.parse(decrypted_data);
                                var nickname = chats.nickname;
                                var password = chats.password;
                                var crypted_nickname = await encrypt(nickname, localStorage.getItem("publicKeyArmored"));
                                var crypted_password = await encrypt(password, localStorage.getItem("publicKeyArmored"));
                                
                            } else {
                                //si dovrebbe controllare lo storage per vedere se è presente il nickname e la password in modo da richiedere nuovamente l'aesKey
                                //ma non abbiamo tempo
                                clearLocalStorageWithoutKey();
                                window.location.href = "../signUp.html";
                            }
                        } else {
                            chatName.classList.add("error");
                            chatName.setAttribute("error-message", "Nickname must contain at least one letter or number");
                        }
                    } else {
                        chatName.classList.add("error");
                        chatName.setAttribute("error-message", "Nickname must not contain '@'");
                    }
                } else {
                    chatName.classList.add("error");
                    chatName.setAttribute("error-message", "Nickname must be at most 30 characters long");
                }
            } else {
                chatName.classList.add("error");
                chatName.setAttribute("error-message", "Nickname must be filled out");
            }
        }
    } else {
        socket.emit("getPublicKey", "3");
    }
}

//emoji-button e attach button da gestire (bottoni per attaccare file e emoji)

async function manageAesKeySuccess(crypted_aes_key) {
    var { data: aes_key } = await decrypt(
        crypted_aes_key,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );

    kM.setAesKey(aes_key);
    readLocalStorage();//da fare
    getNewMessages();//da fare
}

async function readLocalStorage() {
    var aes_key = kM.getAesKey();
    var data = localStorage.getItem("data");
    var { data: decrypted_data } = decryptAES(data, aes_key);
    //costruiamo le chat
}

async function sync() {
    if(!checkKey()){
        socket.emit("getPublicKey", "2");
    }
    else{
        if(kM.getAesKey() == null || kM.getAesKey() == undefined || kM.getAesKey() == ""){
            alert('Wait for page to load')
        }
        else {
            var data = localStorage.getItem("data");
            var decrypted_data = decryptAES(data, kM.getAesKey()).replaceAll("\\n", "").replaceAll("\r", "").replaceAll("\t", "").replaceAll(" ", "").replaceAll("\\", "");
            var decrypted_data = decrypted_data.substring(2, decrypted_data.length - 2);
            
            console.log(decrypted_data)
            var decrypted_dataParsed = JSON.parse(decrypted_data.toString());
            console.log("json " + decrypted_dataParsed.toString())
            console.log(decrypted_dataParsed[0])
            crypted_nickname = await encrypt(decrypted_data.nickname, localStorage.getItem("publicKeyArmored"));
            crypted_password = await encrypt(decrypted_data.password, localStorage.getItem("publicKeyArmored"));
            crypted_pubKey = await encrypt(kM.getPublicKey(), localStorage.getItem("publicKeyArmored"));
            socket.emit("sync", crypted_nickname, crypted_password, crypted_pubKey )
            console.log("frocio")
        }
    }


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
        if(document.getElementById("message-input").value != ""){
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