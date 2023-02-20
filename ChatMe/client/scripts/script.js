/*Socket.io*/
var socket = io();
function register() {
  //check di dati in locale
  //se i dati sono validi possiamo richiedere al server la public key altrimenti avvisiamo l'utente
  socket.emit("getPublicKey");
};

socket.on("publicKey", (publicKeyArmored) => {
  sendRegister(publicKeyArmored);
});

function sendRegister(publicKeyArmored) {
  // Genera una chiave di 256 bit in formato word array e la converte in formato base64
  var keyBase64 = CryptoJS.enc.Base64.stringify(
    CryptoJS.lib.WordArray.random(32)
  );

  (async () => {
    //lettura key dalla armored key
    const Publickey = await openpgp.readKey({ armoredKey: publicKeyArmored });

    //cifratura dati
    const crypted_nickname = await openpgp.encrypt({
      message: await openpgp.createMessage({
        text: document.getElementById("username").value,
      }),
      encryptionKeys: Publickey,
    });
    console.log(crypted_nickname);

    const crypted_email = await openpgp.encrypt({
      message: await openpgp.createMessage({
        text: document.getElementById("email").value,
      }),
      encryptionKeys: Publickey,
    });
    console.log(crypted_email);

    const crypted_password = await openpgp.encrypt({
      message: await openpgp.createMessage({
        text: document.getElementById("password").value,
      }),
      encryptionKeys: Publickey,
    });
    console.log(crypted_password);

    const crypted_key = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: keyBase64 }),
      encryptionKeys: Publickey,
    });
    console.log(crypted_key);
    
    //invio dati cifrati al server
    socket.emit(
      "register",
      crypted_email,
      crypted_password,
      crypted_nickname,
      crypted_key
    );
  })();
}

/*CryptoJS*/
function encryptAES(data, key) {
  return CryptoJS.AES.encrypt(data, key).toString();
}
