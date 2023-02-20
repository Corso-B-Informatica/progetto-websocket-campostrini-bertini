/*Socket.io*/
var socket = io();

socket.on("publicKey", (publicKeyArmored) => {
  sendRegister(publicKeyArmored);
});

function register() {
  if (checkUsername() && checkEmail() && checkPassword()) {
    socket.emit("getPublicKey");
  }
}

function checkUsername() {
  var username = document.getElementById("username").value;
  return true;
}

function checkEmail() {
  var email = document.getElementById("email").value;
  if (
    email
      .trim()
      .match(
        /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/
      ) == null
  ) {
    return false;
  }
  return true;
}

function checkPassword() {
  var password = document.getElementById("password").value;
  if (password.length < 8) {
    document.getElementById("container-password").classList.add("short-password");
    return false;
  }
  if (password.length > 50) {
    document.getElementById("container-password").classList.add("long-password");
    return false;
  }
  return true;
}

function sendRegister(publicKeyArmored) {
  // Genera una chiave di 256 bit in formato word array e la converte in formato base64
  var keyBase64 = CryptoJS.enc.Base64.stringify(
    CryptoJS.lib.WordArray.random(32)
  );

  (async () => {
    //lettura key dalla armored key
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

    //cifratura dati
    const crypted_nickname = await openpgp.encrypt({
      message: await openpgp.createMessage({
        text: document.getElementById("username").value,
      }),
      encryptionKeys: publicKey,
    });
    console.log(crypted_nickname);

    const crypted_email = await openpgp.encrypt({
      message: await openpgp.createMessage({
        text: document.getElementById("email").value,
      }),
      encryptionKeys: publicKey,
    });
    console.log(crypted_email);

    const crypted_password = await openpgp.encrypt({
      message: await openpgp.createMessage({
        text: document.getElementById("password").value,
      }),
      encryptionKeys: publicKey,
    });
    console.log(crypted_password);

    const crypted_key = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: keyBase64 }),
      encryptionKeys: publicKey,
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
