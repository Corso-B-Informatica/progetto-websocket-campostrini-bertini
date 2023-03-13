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

socket.on("AesKey", (aesKey, chat) => {
    console.log("gesù figlio di troia")
});

socket.on("ErrorAesKey", ()  => {
    clearLocalStorageWithoutKey();
    window.location.href = "../signUp.html";
});

/*Check if the user is logged in*/
async function login() {
    if (checkData()) {
        if (checkKey()) {
            console.log(kM.getPublicKey())
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