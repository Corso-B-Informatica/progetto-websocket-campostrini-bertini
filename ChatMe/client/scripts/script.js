/*Socket.io*/
var socket = io();
//var CryptoJS = require("crypto-js");
//var openpgp = require("openpgp");
function register() {
    socket.emit("getPublicKey");
}

socket.on("publicKey", (publicKey) => {
    // Genera una chiave di 256 bit in formato word array
    var key = CryptoJS.lib.WordArray.random(32);

    // Converte la chiave in formato base64
    var keyBase64 = CryptoJS.enc.Base64.stringify(key);

    let crypted_nickname = encryptPGP(
        encryptAES(document.getElementById("username").value, keyBase64),
        publicKey
    );

    let crypted_email = encryptPGP(
        encryptAES(document.getElementById("email").value, keyBase64),
        publicKey
    );
    let crypted_password = encryptPGP(
        encryptAES(document.getElementById("password").value, keyBase64),
        publicKey
    );
    let crypted_key = encryptPGP(keyBase64, publicKey);
    socket.emit("register", crypted_email, crypted_password, crypted_nickname, crypted_key);
});

/*OpenPGP*/
function encryptPGP(data, publicKey) {
    (async () => {
        //lettura chiavi
        const key = await openpgp.readKey({
            armoredKey: publicKey,
        });

        //cifratura messaggio
        const encrypted = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: data }),
            encryptionKeys: key,
        });

        return encrypted;
    })();
}

/*CryptoJS*/
function encryptAES(data, key) {
    return CryptoJS.AES.encrypt(data, key).toString();
}
