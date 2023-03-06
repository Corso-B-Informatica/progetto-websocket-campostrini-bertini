//chiedo al server la chiave aes
//se i dati sono sbagliati rimando l'utente alla pagina di registrazione e cancello localstorage
//su server se i dati sono giusti inseriamo il socket in tutti i gruppi a cui è iscritto
//poi assieme alla chiave aes gli mandiamo i messaggi nuovi
//se i dati sono giusti il server ci manda la chiave aes e noi costruiamo la chat con la chiave aes decripto la chat, poi la prendo le informazioni e creo gli elementi della pagina
//poi controlliamo se il rememeber me è false e se lo è cancelliamo email, password, nickname e remember me, ma i dati della chat ce li teniamo, finchè non viene aggiornata la pagina
//quindi da quel momento in poi dovremmo usare le informazioni di login contenute nella variabile data del localStrorage dentro la chat, la aesKey appena ci arriva la salviamo in una variabile
//poi controlliamo che abbiamo una chat, se non la abbiamo dobbiamo crearla.
/*KeyManager*/
const kM = keyManager();

async function genKey() {
    await kM.generateNewKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");
}

genKey();

/*Socket.io*/
var socket = io();

/*if (checkData()) {
    if (checkKey()) {
        getAesKey();
    } else {
        socket.emit("getPublicKey", "0");
    }
} else {
    clearLocalStorageWithoutKey();
    window.location.href = "../signUp.html";
}

async function getAesKey(){
    socket.emit("getAesKey", localStorage.getItem('email'), localStorage.getItem('nickname'), localStorage.getItem('password'),await encrypt(kM.publicKey, localStorage.getItem("publicKeyArmored")));
}*/