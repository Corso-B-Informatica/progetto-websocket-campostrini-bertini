import { createMessage, encrypt, readKey } from "https://cdn.jsdelivr.net/npm/openpgp@5.6.0/dist/openpgp.min.mjs";
/*Socket.io*/
var socket = io();
window.register = function register() {
  socket.emit("getPublicKey");
};

socket.on("publicKey", (publicKey) => {
  // Genera una chiave di 256 bit in formato word array
  console.log(publicKey);
  var key = CryptoJS.lib.WordArray.random(32);

  // Converte la chiave in formato base64
  var keyBase64 = CryptoJS.enc.Base64.stringify(key);

  var username = document.getElementById("username").value;
  var cn = encryptAES(username, keyBase64);
  console.log("nickname " + cn);
  let crypted_nickname = encryptPGP(cn, publicKey);
  console.log("nickname cifrato " + crypted_nickname);

  var email = document.getElementById("email").value;
  var ce = encryptAES(email, keyBase64);
  console.log("email " + ce);
  /*let crypted_email = encryptPGP(ce, publicKey);
  console.log("email cifrata " + crypted_email);*/

  var password = document.getElementById("password").value;
  var cp = encryptAES(password, keyBase64);
  console.log("password " + cp);
  /*let crypted_password = encryptPGP(cp, publicKey);
  console.log("password cifrata " + crypted_password);*/

  /*let crypted_key = encryptPGP(keyBase64, publicKey);
  console.log("chiave cifrata " + crypted_key);*/

  /*socket.emit(
    "register",
    crypted_email,
    crypted_password,
    crypted_nickname,
    crypted_key
  );*/
});

/*OpenPGP*/
function encryptPGP(data, publicKey) {
  (async () => {
    //lettura chiavi
    const key = await readKey({
      armoredKey: publicKey,
    });
    console.log("chiave pgp: " + key);
    //cifratura messaggio
    const encrypted = await encrypt({
      message: await createMessage({ text: data }),
      encryptionKeys: key,
    });
    return encrypted;
  })();
}

/*CryptoJS*/
function encryptAES(data, key) {
  return CryptoJS.AES.encrypt(data, key).toString();
}
