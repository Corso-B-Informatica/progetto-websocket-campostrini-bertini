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

    if (str == "0") {
        login();
    }
});

socket.on("aesKey", (aesKey) => {
    manageAesKeySuccess(aesKey);
});

socket.on("errorAesKey", ()  => {
    clearLocalStorageWithoutKey();
    window.location.href = "../signUp.html";
});

/*Check if the user is logged in*/
async function login() {
    var a = await genKey();
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
    //pulsante che prende il testo da "message-input" incluse le emoji e poi prende i file che l'utente ha caricato
    //(max 100 file per un massimo di 100mB a file e un massimo di un totale di 5gB si potrebbe anche fare 10gB ma andrebbe a ridurre le prestazioni 50% di maxPotenziale)
    //controlla se i file sono meno di 100 e pesano il giusto
    //controlla che il message-input sia lungo meno di 2000 chars (incluse emoji)
    //invia il messaggio criptato al server assieme al proprio nickname alla password, all'id della chat
    //sul server fare il check chi è online in quella chat, se è una chat singola controllare solo che la persona sia online (mandare nella stanza con l'id della chat il messaggio e inserire nel database degli utenti le robe)
}
async function searchContact() {
    //da continuare
    //permette di cercare un contatto in base al valore di "contact-input"
}

//emoji-button e attach button da gestire (bottoni per attaccare file e emoji)
async function openWriteDialog() {
    //da continuare
    //fa apparire nell'html la finestra di dialogo per l'aggiunta di una nuova chat o gruppo ( fa scegliere il nome e i membri)
    //alla conferma viene creata una nuova chat
}

async function manageAesKeySuccess(crypted_aes_key) {
    console.log(crypted_aes_key)
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