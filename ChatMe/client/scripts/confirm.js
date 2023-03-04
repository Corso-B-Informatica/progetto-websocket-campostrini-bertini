if (checkLocalstorageForLogin()) {
    window.location.href = "../chat.html";
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

socket.on("confirmDataError", (crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_check5, crypted_check6, crypted_data1, crypted_data2, crypted_data3, crypted_data4, crypted_data5, crypted_data6) => {
    manageConfirmDataError(crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_check5, crypted_check6, crypted_data1, crypted_data2, crypted_data3, crypted_data4, crypted_data5, crypted_data6);
});


socket.on("confirmError", (msg) => {
    manageConfirmError(msg);
});

socket.on("confirmSuccess", (c_rememberMe, c_aesKey, c_row) => {
    manageConfirmSuccess(c_rememberMe, c_aesKey, c_row);
});


socket.on("requestCodeDataError", (crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_data1, crypted_data2, crypted_data3, crypted_data4) => {
    manageRequestCodeDataError(crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_data1, crypted_data2, crypted_data3, crypted_data4);
});

socket.on("requestCodeError", (msg) => {
    manageRequestCodeError(msg);
});

socket.on("requestCodeSuccess", () => {
    manageRequestCodeSuccess();
});

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
    return url.includes("/confirm.html#") && email.length > 0 && password.length > 0 && nickname.length > 0 && verification_code.length > 0;
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

                socket.emit("getCodeByStorage", crypted_email, crypted_nickname, crypted_password, pubKey);
            } else if (email != null) {
                await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                var crypted_email = await encrypt(email, publicKey);
                var crypted_password = await encrypt(password, publicKey);
                var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                socket.emit("getCodeByStorage", crypted_email, "", crypted_password, pubKey);
            } else {
                await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                var crypted_nickname = await encrypt(nickname, publicKey);
                var crypted_password = await encrypt(password, publicKey);
                var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                socket.emit("getCodeByStorage", "", crypted_nickname, crypted_password, pubKey);
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

                    socket.emit("getCodeByInput", crypted_email, "", crypted_password, pubKey);
                } else {
                    await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                    var crypted_username = await encrypt(validate(ue), publicKey);
                    var crypted_password = await encrypt(validate(document.getElementById("password")), publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                    socket.emit("getCodeByInput", "", crypted_username, crypted_password, pubKey);
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

                socket.emit("confirmViaCodeByStorage", crypted_email, crypted_nickname, crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
            } else if (email != null) {
                await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                var crypted_email = await encrypt(email, publicKey);
                var crypted_password = await encrypt(password, publicKey);
                var crypted_verification_code = await encrypt(verification_code, publicKey);
                var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                var aesKey = await encrypt(generateRandomKey(10), publicKey);

                socket.emit("confirmViaCodeByStorage", crypted_email, "", crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
            } else {
                await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                var crypted_nickname = await encrypt(nickname, publicKey);
                var crypted_password = await encrypt(password, publicKey);
                var crypted_verification_code = await encrypt(verification_code, publicKey);
                var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                var aesKey = await encrypt(generateRandomKey(10), publicKey);

                socket.emit("confirmViaCodeByStorage", "", crypted_nickname, crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
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

                    socket.emit("confirmViaCodeByInput", crypted_email, "", crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                } else {
                    await kM.generateKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

                    var crypted_username = await encrypt(validate(ue), publicKey);
                    var crypted_password = await encrypt(validate(document.getElementById("password")), publicKey);
                    var crypted_verification_code = await encrypt(verification_code, publicKey);
                    var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                    var aesKey = await encrypt(generateRandomKey(10), publicKey);

                    socket.emit("confirmViaCodeByInput", "", crypted_username, crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                }
            }
        }
    } else {
        socket.emit("getPublicKey", "1");
    }
}


/*Manage response*/
async function manageConfirmDataError(crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_check5, crypted_check6, crypted_data1, crypted_data2, crypted_data3, crypted_data4, crypted_data5, crypted_data6) {
    var { data: check1 } = await decrypt(
        crypted_check1,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: check2 } = await decrypt(
        crypted_check2,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: check3 } = await decrypt(
        crypted_check3,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: check4 } = await decrypt(
        crypted_check4,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: check5 } = await decrypt(
        crypted_check5,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: check6 } = await decrypt(
        crypted_check6,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: data1 } = await decrypt(
        crypted_data1,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: data2 } = await decrypt(
        crypted_data2,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: data3 } = await decrypt(
        crypted_data3,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: data4 } = await decrypt(
        crypted_data4,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: data5 } = await decrypt(
        crypted_data5,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: data6 } = await decrypt(
        crypted_data6,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    
    if (!check1 || !check2) {
        var containerUsername = document.getElementById("container-username-email");
        containerUsername.classList.add("error");
        containerUsername.setAttribute("error-message", "Invalid Username or Email");
    }

    if (!check3) {
        var containerPassword = document.getElementById("container-password");
        containerPassword.classList.add("error");
        containerPassword.setAttribute("error-message", data3);
    }

    if (!check4) {
        var prompt = document.getElementById("prompt");

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = "block";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";

        document.getElementById("prompt-error").innerText =
            data4;

        document.getElementById("prompt-text").innerText =
            "";

        document.getElementById("no-button").innerText = "Ok";
    }

    if (!check5) {
        var prompt = document.getElementById("prompt");

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = "block";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";

        document.getElementById("prompt-error").innerText =
            data5;

        document.getElementById("prompt-text").innerText =
            "";

        document.getElementById("no-button").innerText = "Ok";
    }
    
    if (!check6) {
        var containerCode = document.getElementById("container-code");
        containerCode.classList.add("error");
        containerCode.setAttribute("error-message", data6);
    }
}

async function manageConfirmError(message) {
    var { data: msg } = await decrypt(
        message,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );

    if (msg == "Wrong verification code") {
        var containerCode = document.getElementById("container-code");
        containerCode.classList.add("error");
        containerCode.setAttribute("error-message", msg);
    } else if (msg == "User already confirmed") {
        var prompt = document.getElementById("prompt");

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = "block";

        var yesButton = document.getElementById("yes-button");
        yesButton.style.display = "block";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";

        document.getElementById("prompt-error").innerText =
            "User has already been confirmed";
        document.getElementById("prompt-text").innerText =
            "Do you want to go to the login page?";

        // Aggiungi un event listener al bottone "Yes"
        document.getElementById("yes-button").addEventListener("click", () => {
            window.location.href = "../signIn.html";
        });
    } else if (msg == "User not registered") {
        var prompt = document.getElementById("prompt");

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = "block";

        var yesButton = document.getElementById("yes-button");
        yesButton.style.display = "block";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";

        document.getElementById("prompt-error").innerText =
            "User doesn't exist";
        document.getElementById("prompt-text").innerText =
            "Do you want to go to the registration page?";

        // Aggiungi un event listener al bottone "Yes"
        document.getElementById("yes-button").addEventListener("click", () => {
            window.location.href = "../signUp.html";
        });
    } else {
        var prompt = document.getElementById("prompt");

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = "block";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";

        document.getElementById("prompt-error").innerText =
            "Number of attempts exceeded";
        
        var seconds = int(msg) / 1000;
        var time = new Date();
        time.setSeconds(time.getSeconds() + seconds);
        var currentDate = new Date();
        var timeToWait = time - currentDate;
        var hoursToWait = Math.floor(timeToWait / (1000 * 60 * 60));
        if (hoursToWait > 0) {
            hoursToWait += " hours, ";
        } else {
            hoursToWait = "";
        }
        var minutesToWait = Math.floor((timeToWait % (1000 * 60 * 60)) / (1000 * 60));
        if (minutesToWait > 0) {
            minutesToWait += " minutes, ";
        } else {
            minutesToWait = "";
        }
        var secondsToWait = Math.floor((timeToWait % (1000 * 60)) / 1000);
        if (secondsToWait > 0) {
            secondsToWait += " seconds, ";
        } else {
            secondsToWait = "";
        }
        var millisecondsToWait = Math.floor(timeToWait % 1000);

        document.getElementById("prompt-text").innerText =
            "You need to wait " + hoursToWait + minutesToWait + secondsToWait + millisecondsToWait + " milliseconds before trying again"

        document.getElementById("no-button").innerText = "Ok";
    }
}

async function manageConfirmSuccess(c_rememberMe, c_aesKey, c_row) {
    var { data: rememberMe } = await decrypt(
        c_rememberMe,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: aesKey } = await decrypt(
        c_aesKey,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: row } = await decrypt(
        c_row,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );

    localStorage.setItem("rememberMe", rememberMe);
    var data = encryptAES(JSON.stringify(row), aesKey);
    localStorage.setItem("data", data);

    window.location.href = "../chat.html";
}

async function manageRequestCodeDataError(crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_data1, crypted_data2, crypted_data3, crypted_data4) {
    var { data: check1 } = await decrypt(
        crypted_check1,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: check2 } = await decrypt(
        crypted_check2,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: check3 } = await decrypt(
        crypted_check3,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: check4 } = await decrypt(
        crypted_check4,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: data1 } = await decrypt(
        crypted_data1,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: data2 } = await decrypt(
        crypted_data2,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: data3 } = await decrypt(
        crypted_data3,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: data4 } = await decrypt(
        crypted_data4,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );

    if (!check1 || !check2) {
        var containerUsername = document.getElementById("container-username-email");
        containerUsername.classList.add("error");
        containerUsername.setAttribute("error-message", "Invalid Username or Email");
    }

    if (!check3) {
        var containerPassword = document.getElementById("container-password");
        containerPassword.classList.add("error");
        containerPassword.setAttribute("error-message", data3);
    }

    if (!check4) {
        var prompt = document.getElementById("prompt");

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = "block";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";

        document.getElementById("prompt-error").innerText =
            data4;

        document.getElementById("prompt-text").innerText =
            "";

        document.getElementById("no-button").innerText = "Ok";
    }
}

async function manageRequestCodeError(message) {
    var { data: msg } = await decrypt(
        message,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );

    if (msg == "User already confirmed") {
        var prompt = document.getElementById("prompt");

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = "block";

        var yesButton = document.getElementById("yes-button");
        yesButton.style.display = "block";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";

        document.getElementById("prompt-error").innerText =
            "User has already been confirmed";
        document.getElementById("prompt-text").innerText =
            "Do you want to go to the login page?";

        // Aggiungi un event listener al bottone "Yes"
        document.getElementById("yes-button").addEventListener("click", () => {
            window.location.href = "../signIn.html";
        });
    } else if (msg == "User not registered") {
        var prompt = document.getElementById("prompt");

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = "block";

        var yesButton = document.getElementById("yes-button");
        yesButton.style.display = "block";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";

        document.getElementById("prompt-error").innerText =
            "User doesn't exist";
        document.getElementById("prompt-text").innerText =
            "Do you want to go to the registration page?";

        // Aggiungi un event listener al bottone "Yes"
        document.getElementById("yes-button").addEventListener("click", () => {
            window.location.href = "../signUp.html";
        });
    } else {
        var prompt = document.getElementById("prompt");

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = "block";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";

        document.getElementById("prompt-error").innerText =
            "Number of attempts exceeded";

        var seconds = int(msg) / 1000;
        var time = new Date();
        time.setSeconds(time.getSeconds() + seconds);
        var currentDate = new Date();
        var timeToWait = time - currentDate;
        var hoursToWait = Math.floor(timeToWait / (1000 * 60 * 60));
        if (hoursToWait > 0) {
            hoursToWait += " hours, ";
        } else {
            hoursToWait = "";
        }
        var minutesToWait = Math.floor((timeToWait % (1000 * 60 * 60)) / (1000 * 60));
        if (minutesToWait > 0) {
            minutesToWait += " minutes, ";
        } else {
            minutesToWait = "";
        }
        var secondsToWait = Math.floor((timeToWait % (1000 * 60)) / 1000);
        if (secondsToWait > 0) {
            secondsToWait += " seconds, ";
        } else {
            secondsToWait = "";
        }
        var millisecondsToWait = Math.floor(timeToWait % 1000);

        document.getElementById("prompt-text").innerText =
            "You need to wait " + hoursToWait + minutesToWait + secondsToWait + millisecondsToWait + " milliseconds before trying again"

        document.getElementById("no-button").innerText = "Ok";
    }
}

async function manageRequestCodeSuccess() {
    var prompt = document.getElementById("prompt");

    // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
    prompt.style.display = "block";

    var noButton = document.getElementById("no-button");
    noButton.style.display = "block";

    document.getElementById("prompt-error").innerText =
        "Verification code sent successfully";

    document.getElementById("prompt-text").innerText =
        "Please check your email";

    document.getElementById("no-button").innerText = "Ok";
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
    noButton.innerText = "No";
});

/*Reset error message*/
document.getElementById("username").oninput = function () {
    var containerUsername = document.getElementById("container-username-email");
    containerUsername.setAttribute("error-message", "Invalid username or Email");
};

document.getElementById("password").oninput = function () {
    var containerPassword = document.getElementById("container-password");
    containerPassword.setAttribute("error-message", "Invalid password");
}

document.getElementById("code").oninput = function () {
    var containerCode = document.getElementById("container-code");
    containerCode.setAttribute("error-message", "Invalid verification code");
}