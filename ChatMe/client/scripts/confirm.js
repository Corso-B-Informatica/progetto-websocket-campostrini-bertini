if (checkLocalstorageForLogin()) {
    window.location.href = "../signIn.html";
}

/*vars*/
var e_mail = "";
var pass_word = "";
var nick_name = "";

/*Controllo il localStorage ogni 500ms per vedere se ci sono i dati e se non ci sono mette la pagina Without Login*/
function checkLocalstorage() {
    var email = localStorage.getItem("email");
    var password = localStorage.getItem("password");
    var nickname = localStorage.getItem("nickname");

    if ((email.length > 0 || nickname.length > 0) && password.length > 0) {
        e_mail = email;
        pass_word = password;
        nick_name = nickname;
        setPageWithoutLogin();
    } else {
        if ((e_mail.length > 0 || nick_name.length > 0) && pass_word.length > 0) {
            localStorage.setItem("email", e_mail);
            localStorage.setItem("password", pass_word);
            localStorage.setItem("nickname", nick_name);
            setPageWithoutLogin();
        } else {
            setPageWithLogin();
            var publicKey = localStorage.getItem("publicKeyArmored");
            clearLocalStorage();
            localStorage.setItem("publicKeyArmored", publicKey);
        }
    }
}

setInterval(checkLocalstorage, 500);

/*keyManager*/
const kM = new keyManager();

/*Socket.io*/
var socket = io();

socket.emit("getPublicKey", "0");

socket.on("publicKey", (publicKeyArmored, str) => {
    localStorage.setItem("publicKeyArmored", publicKeyArmored);

    if (str == "0") {
        tryConfirmViaLink(publicKeyArmored);
    } else if (str == "1") {
        confirmCode();
    } else if (str == "2") {
        getCode();
    }
});

socket.on("confirmSuccess", (error) => { });

/*Confirm via link*/
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
        checkLocalstorage();
    }
}

function isUrlConfirmed(url, email, password, nickname, verification_code) {
    //il controllo va fatto meglio ma per ora va bene così
    return url.includes("/confirm.html#") && email != null && password != null && nickname != null && verification_code != null;
}

async function sendConfirmViaLink(email, password, nickname, verification_code, publicKeyArmored) {
    await kM.generateNewKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

    const crypted_nickname = await encrypt(nickname, publicKeyArmored);
    const crypted_email = await encrypt(email, publicKeyArmored);
    const crypted_password = await encrypt(password, publicKeyArmored);
    const crypted_verification_code = await encrypt(verification_code, publicKeyArmored);
    const crypted_rememberMe = await encrypt(false, publicKeyArmored);
    var pubKey = await encrypt(kM.getPublicKey(), publicKeyArmored);
    var aesKey = await encrypt(generateRandomKey(10), publicKeyArmored);

    socket.emit("confirmViaLink", crypted_email, crypted_password, crypted_nickname, crypted_verification_code, crypted_rememberMe, pubKey, aesKey);
}

/*Page format*/
function setPageWithoutLogin() {
    var containerUsernameEmail = document.getElementById("container-username-email");
    containerUsernameEmail.style.display = "none";
    var containerPassword = document.getElementById("container-password");
    containerPassword.style.display = "none";
}

function setPageWithLogin() {
    var containerUsernameEmail = document.getElementById("container-username-email");
    containerUsernameEmail.style.display = "none";
    var containerPassword = document.getElementById("container-password");
    containerPassword.style.display = "none";
}

async function getCode() {
    var email = localStorage.getItem("email");
    var password = localStorage.getItem("password");
    var nickname = localStorage.getItem("nickname");
    var publicKey = localStorage.getItem("publicKeyArmored");

    if (publicKey != null && checkVerificationCode()) {
        if ((email.length > 0 || nickname.length > 0) && password.length > 0) {
            if (email != null && nickname != null) {
                await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                var crypted_email = await encrypt(email, publicKey);
                var crypted_nickname = await encrypt(nickname, publicKey);
                var crypted_password = await encrypt(password, publicKey);
                var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                socket.emit("getCode", crypted_email, crypted_nickname, crypted_password, pubKey);
            } else if (email != null) {
                await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                var crypted_email = await encrypt(email, publicKey);
                var crypted_password = await encrypt(password, publicKey);
                var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                socket.emit("getCode", crypted_email, "", crypted_password, pubKey);
            } else {
                await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                var crypted_nickname = await encrypt(nickname, publicKey);
                var crypted_password = await encrypt(password, publicKey);
                var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                socket.emit("getCode", "", crypted_nickname, crypted_password, pubKey);
            }
        } else {
            clearLocalStorage();
            localStorage.setItem("publicKeyArmored", publicKey);

            var check1 = checkUsernameOrEmail();
            var check2 = checkPassword();
            var check3 = checkVerificationCode();

            if (check1 && check2 && check3) {
                var ue = document.getElementById("username").value;
                if (ue.toString().contains("@")) {
                    await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                    var crypted_email = await encrypt(validate(ue), publicKey);
                    var crypted_password = await encrypt(validate(document.getElementById("password")), publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                    socket.emit("getCode", crypted_email, "", crypted_password, pubKey);
                } else {
                    await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                    var crypted_username = await encrypt(validate(ue), publicKey);
                    var crypted_password = await encrypt(validate(document.getElementById("password")), publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                    socket.emit("getCode", "", crypted_username, crypted_password, pubKey);
                }
            }
        }
    } else {
        socket.emit("getPublicKey", "2");
    }
}

async function confirmCode() {
    var email = localStorage.getItem("email");
    var password = localStorage.getItem("password");
    var nickname = localStorage.getItem("nickname");
    var publicKey = localStorage.getItem("publicKeyArmored");
    var verification_code = validate(document.getElementById("code").value);
    var remeberMe = document.getElementById("checkbox").checked;

    if (publicKey != null && checkVerificationCode()) {
        if ((email.length > 0 || nickname.length > 0) && password.length > 0) {
            if (email != null && nickname != null) {
                await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                var crypted_email = await encrypt(email, publicKey);
                var crypted_nickname = await encrypt(nickname, publicKey);
                var crypted_password = await encrypt(password, publicKey);
                var crypted_verification_code = await encrypt(verification_code, publicKey);
                var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                var aesKey = await encrypt(generateRandomKey(10), publicKey);

                socket.emit("confirmViaCode", crypted_email, crypted_nickname, crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
            } else if (email != null) {
                await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                var crypted_email = await encrypt(email, publicKey);
                var crypted_password = await encrypt(password, publicKey);
                var crypted_verification_code = await encrypt(verification_code, publicKey);
                var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                var aesKey = await encrypt(generateRandomKey(10), publicKey);

                socket.emit("confirmViaCode", crypted_email, "", crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
            } else {
                await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                var crypted_nickname = await encrypt(nickname, publicKey);
                var crypted_password = await encrypt(password, publicKey);
                var crypted_verification_code = await encrypt(verification_code, publicKey);
                var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                var aesKey = await encrypt(generateRandomKey(10), publicKey);

                socket.emit("confirmViaCode", "", crypted_nickname, crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
            }
        } else {
            clearLocalStorage();
            localStorage.setItem("publicKeyArmored", publicKey);

            var check1 = checkUsernameOrEmail();
            var check2 = checkPassword();
            var check3 = checkVerificationCode();

            if (check1 && check2 && check3) {
                var ue = document.getElementById("username").value;
                if (ue.toString().contains("@")) {
                    await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                    var crypted_email = await encrypt(validate(ue), publicKey);
                    var crypted_password = await encrypt(validate(document.getElementById("password")), publicKey);
                    var crypted_verification_code = await encrypt(verification_code, publicKey);
                    var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                    var aesKey = await encrypt(generateRandomKey(10), publicKey);

                    socket.emit("confirmViaCode", crypted_email, "", crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                } else {
                    await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                    var crypted_username = await encrypt(validate(ue), publicKey);
                    var crypted_password = await encrypt(validate(document.getElementById("password")), publicKey);
                    var crypted_verification_code = await encrypt(verification_code, publicKey);
                    var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                    var aesKey = await encrypt(generateRandomKey(10), publicKey);

                    socket.emit("confirmViaCode", "", crypted_username, crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                }
            }
        }
    } else {
        socket.emit("getPublicKey", "1");
    }
}

/*Reset errori*/
document.getElementById("username").onclick = function () {
    var containerUsername = document.getElementById("container-username-email");
    containerUsername.classList.remove("error");
};

document.getElementById("span-username").onclick = function () {
    var containerUsername = document.getElementById("container-username-email");
    containerUsername.classList.remove("error");
};

document.getElementById("password").onclick = function () {
    var containerPassword = document.getElementById("container-password");
    containerPassword.classList.remove("error");
};

document.getElementById("span-password").onclick = function () {
    var containerPassword = document.getElementById("container-password");
    containerPassword.classList.remove("error");
};

document.getElementById("code").onclick = function () {
    var containerCode = document.getElementById("container-code");
    containerCode.classList.remove("error");
};

document.getElementById("span-code").onclick = function () {
    var containerCode = document.getElementById("container-code");
    containerCode.classList.remove("error");
};

/*Toggle prompt*/
document.getElementById("no-button").addEventListener("click", () => {
    var prompt = document.getElementById("prompt");
    prompt.style.display = "none";

    var yesButton = document.getElementById("yes-button");
    yesButton.style.display = "none";

    var noButton = document.getElementById("no-button");
    noButton.style.display = "none";
});

document.getElementById("yes-button").addEventListener("click", () => {
    var prompt = document.getElementById("prompt");
    prompt.style.display = "none";

    var yesButton = document.getElementById("yes-button");
    yesButton.style.display = "none";

    var noButton = document.getElementById("no-button");
    noButton.style.display = "none";
});

/*Reset error message*/
document.getElementById("username").oninput = function () {
    var containerUsername = document.getElementById("container-username-email");
    containerUsername.setAttribute("error-message", "Invalid username");
};
