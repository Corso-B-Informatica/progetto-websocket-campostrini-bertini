/*Socket.io*/
var socket = io();

socket.on("confirmSuccess", (error) => { });

function isUrlConfirmed() {
    var url = window.location.href;
    if (url.includes("/confirm.html#")) {
        url = url.substring(url.indexOf("/confirm.html#") + 1);
        var email = url.substring(0, url.indexOf("&"));
        url = url.replace(email + "&password=", "");
        var password = url.substring(0, url.indexOf("&"));
        url = url.replace(password + "&nickname=", "");
        var nickname = url.substring(0, url.indexOf("&"));
        url = url.replace(nickname + "&code=", "");
        var verification_code = url;
        if(email != null && password != null && nickname != null && verification_code != null){
            sendConfirmViaLink(email, password, nickname, verification_code, publicKeyArmored);
            return true;
        }
    }
    return false;
}

async function sendConfirmViaLink(email, password, nickname, verification_code) {
    var publicKeyArmored = localStorage.getItem("publicKeyArmored");
    //lettura key dalla armored key
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

    //cifratura dati
    const crypted_nickname = await openpgp.encrypt({
        message: await openpgp.createMessage({
            text: nickname,
        }),
        encryptionKeys: publicKey,
    });

    const crypted_email = await openpgp.encrypt({
        message: await openpgp.createMessage({
            text: email,
        }),
        encryptionKeys: publicKey,
    });

    const crypted_password = await openpgp.encrypt({
        message: await openpgp.createMessage({
            text: password,
        }),
        encryptionKeys: publicKey,
    });

    const crypted_verification_code = await openpgp.encrypt({
        message: await openpgp.createMessage({
            text: verification_code,
        }),
        encryptionKeys: publicKey,
    });

    socket.emit("confirmViaLink", crypted_email, crypted_password, crypted_nickname, crypted_verification_code);
}


/*On page open*/
if (localStorage.getItem("publicKeyArmored") == null) {
    socket.emit("getPublicKey");
} else {
    if (!isUrlConfirmed()) {
        var email = localStorage.getItem("email");
        var password = localStorage.getItem("password");
        var nickname = localStorage.getItem("nickname");
        if ((email == null && nickname == null) || password == null) {
            setPageWithLogin();
        }
    }
}

socket.on("publicKey", (publicKeyArmored) => {
    localStorage.setItem("publicKeyArmored", publicKeyArmored);
    if (!isUrlConfirmed()) {
        var email = localStorage.getItem("email");
        var password = localStorage.getItem("password");
        var nickname = localStorage.getItem("nickname");
        if ((email == null && nickname == null) || password == null) {
            setPageWithLogin();
        }
    }
});