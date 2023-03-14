//chiedo al server la chiave aes
//se i dati sono sbagliati rimando l'utente alla pagina di registrazione e cancello localstorage
//su server se i dati sono giusti inseriamo il socket in tutti i gruppi a cui è iscritto
//poi assieme alla chiave aes gli mandiamo i messaggi nuovi
//se i dati sono giusti il server ci manda la chiave aes e noi costruiamo la chat con la chiave aes decripto la chat, poi la prendo le informazioni e creo gli elementi della pagina
//poi controlliamo se il rememeber me è false e se lo è cancelliamo email, password, nickname e remember me, ma i dati della chat ce li teniamo, finchè non viene aggiornata la pagina
//quindi da quel momento in poi dovremmo usare le informazioni di login contenute nella variabile data del localStrorage dentro la chat, la aesKey appena ci arriva la salviamo in una variabile
//poi controlliamo che abbiamo una chat, se non la abbiamo dobbiamo crearla.


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

    if(str == "2"){
        sync();
    }
    if(str == "1"){
        sendMessage();
    }
    
    if (str == "0") {
        login();
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
    //da continuare
    //permette di cercare un contatto in base al valore di "contact-input"
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
//emoji-button e attach button da gestire (bottoni per attaccare file e emoji)
async function openWriteDialog() {
    //da continuare
    //fa apparire nell'html la finestra di dialogo per l'aggiunta di una nuova chat o gruppo ( fa scegliere il nome e i membri)
    //alla conferma viene creata una nuova chat
}

async function manageAesKeySuccess(crypted_aes_key) {
    var { data: aes_key } = await decrypt(
        crypted_aes_key,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );

    kM.setAesKey(aes_key);
    readLocalStorage();
}

async function readLocalStorage() {
    var aes_key = kM.getAesKey();
    
}

async function sync() {
    console.log(kM.getAesKey())
    if(!checkKey()){
        socket.emit("getPublicKey", "2");
    }
    else{
        if(kM.getAesKey() == null || kM.getAesKey() == undefined){
            alert('Wait for page to load')
        }
        else{
            crypted_nickname = localStorage.getItem("nickname")
            crypted_password = localStorage.getItem("password")
            crypted_pubKey = encrypt(kM.getPublicKey(), localStorage.getItem("publicKeyArmored"))
            socket.emit("sync", crypted_nickname, crypted_password, crypted_pubKey )
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

