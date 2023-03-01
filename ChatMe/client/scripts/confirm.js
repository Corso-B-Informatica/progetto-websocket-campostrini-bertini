/*keyManager*/
const kM = new keyManager();

/*Socket.io*/
var socket = io();

socket.emit("getPublicKey");

socket.on("publicKey", (publicKeyArmored) => {
    tryConfirmViaLink(publicKeyArmored);
    localStorage.setItem("publicKeyArmored", publicKeyArmored);
});

socket.on("confirmSuccess", (error) => { });

function isUrlConfirmed(url, email, password, nickname, verification_code) {
    //il controllo va fatto meglio
    return url.includes("/confirm.html#") && email != null && password != null && nickname != null && verification_code != null;
}

async function sendConfirmViaLink(publicKeyArmored, email, password, nickname, verification_code) {
    const crypted_nickname = await encrypt(nickname, publicKeyArmored);
    const crypted_email = await encrypt(email, publicKeyArmored);
    const crypted_password = await encrypt(password, publicKeyArmored);
    const crypted_verification_code = await encrypt(verification_code, publicKeyArmored);
    // il remember me è false di default
    var remeberMe = false;
    const crypted_remeberMe = await encrypt(remeberMe, publicKeyArmored);
    await kM.generateNewKeyPair(nickname, email, password);
    var pubKey = await crypto.encrypt(kM.getPublicKey(), publicKeyArmored);
    socket.emit("confirmViaLink", crypted_email, crypted_password, crypted_nickname, crypted_verification_code, crypted_remeberMe, pubKey);
}

/*Page withouth login*/
function setPageWithoutLogin() {
    var containerUsernameEmail = document.getElementById("container-username-email");
    containerUsernameEmail.style.display = "none";
    var containerPassword = document.getElementById("container-password");
    containerPassword.style.display = "none";
}

/*On page load*/
async function tryConfirmViaLink(publicKeyArmored) {
    var url = window.location.href;
    url = url.substring(url.indexOf("/confirm.html#") + 1);
    var email = url.substring(0, url.indexOf("&"));
    url = url.replace(email + "&password=", "");
    var password = url.substring(0, url.indexOf("&"));
    url = url.replace(password + "&nickname=", "");
    var nickname = url.substring(0, url.indexOf("&"));
    url = url.replace(nickname + "&code=", "");
    var verification_code = url;

    if (isUrlConfirmed(url, email, password, nickname, verification_code)) {
        sendConfirmViaLink(email, password, nickname, verification_code, publicKeyArmored);
    } else {
        var email = localStorage.getItem("email");
        var password = localStorage.getItem("password");
        var nickname = localStorage.getItem("nickname");
        
        if ((email != null || nickname != null) && password != null) {
            setPageWithoutLogin();
        } else {
            clearLocalStorage();
        }
    }
}

function clearLocalStorage() {
    localStorage.clear();
}

async function getCode() {
    var email = localStorage.getItem("email");
    var password = localStorage.getItem("password");
    var nickname = localStorage.getItem("nickname");
    var publicKey = localStorage.getItem("publicKeyArmored");

    if ((email != null || nickname != null) && password != null) {
        if (email != null) {
            var crypted_email = null;
            var crypted_password = null;
            try {
                crypted_email = await encrypt(email, publicKey);
                crypted_password = await encrypt(password, publicKey);
            } catch (error) {
                clearLocalStorage();
                window.location.href = "../confirm.html";
            }
            await kM.generateKeyPair("nickname" ,email, password);
            var pubKey = await crypto.encrypt(await kM.getPublicKey(), publicKeyArmored);
            socket.emit("getCodeViaEmail", crypted_email, crypted_password, pubKey);
        } else {
            var crypted_nickname = null;
            var crypted_password = null;
            try {
                crypted_nickname = await encrypt(nickname, publicKey);
                crypted_password = await encrypt(password, publicKey);
            } catch (error) {
                clearLocalStorage();
                window.location.href = "../confirm.html";
            }
            socket.emit("getCodeViaNickname", crypted_nickname, crypted_password );
        }
    } else {
        //se sono presenti nell'input email e password oppure nickname e password
        var check1 = checkUE_Email();
        var check2 = checkUE_Username();
        var check3 = checkPassword();

        if (check1 && check3) {
            //se sono presenti input invio i dati al server
            //ma non salvo i dati sul localstorage per ora
            //ma devo generare una nuova chiave pubblica e privata da mandare al server
            //il server verifica i dati e quando mi risponde se con successo mi rimanda anche i dati e io li salvo sul localstorage
            var em = document.getElementById("username").value;
            var pass = document.getElementById("password").value;

            var crypted_email = null;
            var crypted_password = null;

            try {
                crypted_email = await encrypt(em, publicKey);
                crypted_password = await encrypt(pass, publicKey);
            } catch (error) {
                clearLocalStorage();
                window.location.href = "../confirm.html";
            }
            kM.generateKeyPair("ChatMe",em,pass);
            socket.emit("getCodeViaEmail", crypted_email, crypted_password);
        } else if (check2 && check3) {
            var nick = document.getElementById("username").value;
            var pass = document.getElementById("password").value;

            var crypted_nickname = null;
            var crypted_password = null;

            try {
                crypted_nickname = await encrypt(nick, publicKey);
                crypted_password = await encrypt(pass, publicKey);
            } catch (error) {
                clearLocalStorage();
                window.location.href = "../confirm.html";
            }
            kM.generateKeyPair(nick,"email@gmail.com",pass);
            socket.emit("getCodeViaNickname", crypted_nickname, crypted_password);
        } else {
            //gestisci errore
            //se non sono presenti input digli all'utente che deve inserire i dati
        }
    }
}

//fare la parte del confirm con codice
