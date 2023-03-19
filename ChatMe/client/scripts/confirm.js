if (checkLocalstorageForLogin()) {
    window.location.href = "../chat.html";
}

/*vars*/
var waitSeconds = 0;

/*Update time global*/
function updateTimeGlobal() {
    var prompt = document.getElementById("prompt");

    if (document.getElementById("prompt-error").innerText == "Number of attempts exceeded" && document.getElementById("no-button").innerText == "Ok") {
        if (waitSeconds > 0) {
            waitSeconds -= 1;
            var time = new Date();
            time.setSeconds(time.getSeconds() + waitSeconds);
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
                minutesToWait += " minutes and ";
            } else {
                minutesToWait = "";
            }
            var secondsToWait = Math.floor((timeToWait % (1000 * 60)) / 1000);
            if (secondsToWait > 0) {
                secondsToWait += " seconds ";
            } else {
                secondsToWait = "";
            }

            document.getElementById("prompt-text").innerText =
                "You need to wait " + hoursToWait + minutesToWait + secondsToWait + " before trying again";
        } else {
            var prompt = document.getElementById("prompt");
            prompt.style.display = "none";

            var yesButton = document.getElementById("yes-button");
            yesButton.style.display = "none";

            var noButton = document.getElementById("no-button");
            noButton.style.display = "none";
            noButton.innerText = "No";
        }
    }
}

setInterval(updateTimeGlobal, 1000);

/*Controllo il localStorage ogni 500ms per vedere se ci sono i dati e se non ci sono mette la pagina Without Login*/
function checkLocalstorage() {
    var email = localStorage.getItem("email");
    var password = localStorage.getItem("password");
    var nickname = localStorage.getItem("nickname");
    var remeberMe = localStorage.getItem("rememberMe");
    if (remeberMe == null) {
        if (email != null && nickname != null && password != null) {
            if (email.length > 0 && nickname.length > 0 && password.length > 0) {
                setPageWithoutLogin();
            } else {
                setPageWithLogin();
                clearLocalStorageWithoutKey();
            }
        } else {
            setPageWithLogin();
            clearLocalStorageWithoutKey();
        }
    } else if (remeberMe == "false") {
        clearLocalStorageWithoutKey();
    }
}

setInterval(checkLocalstorage, 500);

/*keyManager*/
const kM = new keyManager();

async function genKey() {
    await kM.generateNewKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");
}

genKey();

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

socket.on("confirmSuccess", (c_email, c_nickname, c_password, c_rememberMe, c_aesKey, c_row) => {
    manageConfirmSuccess(c_email, c_nickname, c_password, c_rememberMe, c_aesKey, c_row);
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
    url = url.substring(url.indexOf("/confirm.html#email=") + 20);
    var email = url.substring(0, url.indexOf("&"));
    url = url.replace(email + "&nickname=", "")
    var nickname = url.substring(0, url.indexOf("&"));
    url = url.replace(nickname + "&password=", "");
    var password = url.substring(0, url.indexOf("&"));
    url = url.replace(password + "&code=", "");
    var verification_code = url;
    url = window.location.href;
    
    if (isUrlConfirmed(url, email, password, nickname, verification_code)) {
        sendConfirmViaLink(email, password, nickname, verification_code, publicKeyArmored);
    } else {
        checkLocalstorage();
    }
}

function isUrlConfirmed(url, email, password, nickname, verification_code) {
    if (email == null || password == null || nickname == null || verification_code == null) {
        return false;
    }
    if (email == undefined || password == null || nickname == undefined || verification_code == undefined) {
        return false;
    }

    return url.includes("/confirm.html#") && email.trim().length > 0 && password.trim().length > 0 && nickname.trim().length > 0 && verification_code.trim().length > 0;
}

async function sendConfirmViaLink(email, password, nickname, verification_code, publicKeyArmored, url) {
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
    containerUsernameEmail.style.display = "block";
    var containerPassword = document.getElementById("container-password");
    containerPassword.style.display = "block";
}

async function getCode() {
    var email = localStorage.getItem("email");
    var password = localStorage.getItem("password");
    var nickname = localStorage.getItem("nickname");
    var publicKey = localStorage.getItem("publicKeyArmored");

    if (publicKey != null) {
        var link = await encrypt(window.location.href, publicKey);
        if ((email != null || nickname != null) && password != null) {
            if (email != null && nickname != null) {
                if (email.length > 0 && nickname.length > 0 && password.length > 0) {
                    var crypted_email = await encrypt(email, publicKey);
                    var crypted_nickname = await encrypt(nickname, publicKey);
                    var crypted_password = await encrypt(password, publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                    socket.emit("getCodeByStorage", crypted_email, crypted_nickname, crypted_password, pubKey, link);
                } else if (email.length > 0 && password.length > 0) {
                    var crypted_email = await encrypt(email, publicKey);
                    var crypted_password = await encrypt(password, publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                    socket.emit("getCodeByStorage", crypted_email, "", crypted_password, pubKey, link);
                } else if (nickname.length > 0 && password.length > 0) {
                    var crypted_nickname = await encrypt(nickname, publicKey);
                    var crypted_password = await encrypt(password, publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                    socket.emit("getCodeByStorage", "", crypted_nickname, crypted_password, pubKey, link);
                } else {
                    clearLocalStorageWithoutKey();

                    var check1 = checkUsernameOrEmail();
                    var check2 = checkPassword();
                    var check3 = checkVerificationCode();

                    if (check1 && check2 && check3) {
                        var ue = document.getElementById("username").value;

                        if (ue.toString().contains("@")) {
                            var crypted_email = await encrypt(ue, publicKey);
                            var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                            var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                            socket.emit("getCodeByInput", crypted_email, "", crypted_password, pubKey, link);
                        } else {
                            var crypted_username = await encrypt(ue, publicKey);
                            var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                            var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                            socket.emit("getCodeByInput", "", crypted_username, crypted_password, pubKey, link);
                        }
                    }
                }
            } else if (email != null) {
                if (email.length > 0 && password.length > 0) {
                    var crypted_email = await encrypt(email, publicKey);
                    var crypted_password = await encrypt(password, publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                    socket.emit("getCodeByStorage", crypted_email, "", crypted_password, pubKey, link);
                } else {
                    clearLocalStorageWithoutKey();

                    var check1 = checkUsernameOrEmail();
                    var check2 = checkPassword();
                    var check3 = checkVerificationCode();

                    if (check1 && check2 && check3) {
                        var ue = document.getElementById("username").value;

                        if (ue.toString().contains("@")) {
                            var crypted_email = await encrypt(ue, publicKey);
                            var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                            var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                            socket.emit("getCodeByInput", crypted_email, "", crypted_password, pubKey, link);
                        } else {
                            var crypted_username = await encrypt(ue, publicKey);
                            var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                            var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                            socket.emit("getCodeByInput", "", crypted_username, crypted_password, pubKey, link);
                        }
                    }
                }
            } else {
                if (nickname.length > 0 && password.length > 0) {
                    var crypted_nickname = await encrypt(nickname, publicKey);
                    var crypted_password = await encrypt(password, publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                    socket.emit("getCodeByStorage", "", crypted_nickname, crypted_password, pubKey, link);
                } else {
                    clearLocalStorageWithoutKey();

                    var check1 = checkUsernameOrEmail();
                    var check2 = checkPassword();
                    var check3 = checkVerificationCode();

                    if (check1 && check2 && check3) {
                        var ue = document.getElementById("username").value;

                        if (ue.toString().contains("@")) {
                            var crypted_email = await encrypt(ue, publicKey);
                            var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                            var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                            socket.emit("getCodeByInput", crypted_email, "", crypted_password, pubKey, link);
                        } else {
                            var crypted_username = await encrypt(ue, publicKey);
                            var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                            var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                            socket.emit("getCodeByInput", "", crypted_username, crypted_password, pubKey, link);
                        }
                    }
                }
            }
        } else {
            clearLocalStorageWithoutKey();

            var check1 = checkUsernameOrEmail();
            var check2 = checkPassword();
            var check3 = checkVerificationCode();

            if (check1 && check2 && check3) {
                var ue = document.getElementById("username").value;

                if (ue.toString().contains("@")) {
                    var crypted_email = await encrypt(ue, publicKey);
                    var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                    socket.emit("getCodeByInput", crypted_email, "", crypted_password, pubKey, link);
                } else {
                    var crypted_username = await encrypt(ue, publicKey);
                    var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);

                    socket.emit("getCodeByInput", "", crypted_username, crypted_password, pubKey, link);
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
    var verification_code = document.getElementById("code").value;
    var remeberMe = document.getElementById("checkbox").checked;

    if (publicKey != null && checkVerificationCode()) {
        if ((email != null || nickname != null) && password != null) {
            if (email != null && nickname != null) {
                if (email.length > 0 && nickname.length > 0 && password.length > 0) {
                    var crypted_email = await encrypt(email, publicKey);
                    var crypted_nickname = await encrypt(nickname, publicKey);
                    var crypted_password = await encrypt(password, publicKey);
                    var crypted_verification_code = await encrypt(verification_code, publicKey);
                    var crypted_remeberMe = await encrypt(remeberMe.toString(), publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                    var aesKey = await encrypt(generateRandomKey(10), publicKey);

                    socket.emit("confirmViaCodeByStorage", crypted_email, crypted_nickname, crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                } else if (email.length > 0 && password.length > 0) {
                    var crypted_email = await encrypt(email, publicKey);
                    var crypted_password = await encrypt(password, publicKey);
                    var crypted_verification_code = await encrypt(verification_code, publicKey);
                    var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                    var aesKey = await encrypt(generateRandomKey(10), publicKey);

                    socket.emit("confirmViaCodeByStorage", crypted_email, "", crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                } else if (nickname.length > 0 && password.length > 0) {
                    var crypted_nickname = await encrypt(nickname, publicKey);
                    var crypted_password = await encrypt(password, publicKey);
                    var crypted_verification_code = await encrypt(verification_code, publicKey);
                    var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                    var aesKey = await encrypt(generateRandomKey(10), publicKey);

                    socket.emit("confirmViaCodeByStorage", "", crypted_nickname, crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                } else {
                    clearLocalStorageWithoutKey();

                    var check1 = checkUsernameOrEmail();
                    var check2 = checkPassword();
                    var check3 = checkVerificationCode();

                    if (check1 && check2 && check3) {
                        var ue = document.getElementById("username").value;

                        if (ue.toString().contains("@")) {
                            var crypted_email = await encrypt(ue, publicKey);
                            var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                            var crypted_verification_code = await encrypt(verification_code, publicKey);
                            var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                            var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                            var aesKey = await encrypt(generateRandomKey(10), publicKey);

                            socket.emit("confirmViaCodeByInput", crypted_email, "", crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                        } else {
                            var crypted_username = await encrypt(ue, publicKey);
                            var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                            var crypted_verification_code = await encrypt(verification_code, publicKey);
                            var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                            var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                            var aesKey = await encrypt(generateRandomKey(10), publicKey);

                            socket.emit("confirmViaCodeByInput", "", crypted_username, crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                        }
                    }
                }
            } else if (email != null) {
                if (email.length > 0 && password.length > 0) {
                    var crypted_email = await encrypt(email, publicKey);
                    var crypted_password = await encrypt(password, publicKey);
                    var crypted_verification_code = await encrypt(verification_code, publicKey);
                    var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                    var aesKey = await encrypt(generateRandomKey(10), publicKey);

                    socket.emit("confirmViaCodeByStorage", crypted_email, "", crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                } else {
                    clearLocalStorageWithoutKey();

                    var check1 = checkUsernameOrEmail();
                    var check2 = checkPassword();
                    var check3 = checkVerificationCode();

                    if (check1 && check2 && check3) {
                        var ue = document.getElementById("username").value;

                        if (ue.toString().contains("@")) {
                            var crypted_email = await encrypt(ue, publicKey);
                            var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                            var crypted_verification_code = await encrypt(verification_code, publicKey);
                            var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                            var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                            var aesKey = await encrypt(generateRandomKey(10), publicKey);

                            socket.emit("confirmViaCodeByInput", crypted_email, "", crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                        } else {
                            var crypted_username = await encrypt(ue, publicKey);
                            var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                            var crypted_verification_code = await encrypt(verification_code, publicKey);
                            var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                            var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                            var aesKey = await encrypt(generateRandomKey(10), publicKey);

                            socket.emit("confirmViaCodeByInput", "", crypted_username, crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                        }
                    }
                }
            } else {
                if (nickname.length > 0 && password.length > 0) {
                    var crypted_nickname = await encrypt(nickname, publicKey);
                    var crypted_password = await encrypt(password, publicKey);
                    var crypted_verification_code = await encrypt(verification_code, publicKey);
                    var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                    var aesKey = await encrypt(generateRandomKey(10), publicKey);

                    socket.emit("confirmViaCodeByStorage", "", crypted_nickname, crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                } else {
                    clearLocalStorageWithoutKey();

                    var check1 = checkUsernameOrEmail();
                    var check2 = checkPassword();
                    var check3 = checkVerificationCode();

                    if (check1 && check2 && check3) {
                        var ue = document.getElementById("username").value;

                        if (ue.toString().contains("@")) {
                            var crypted_email = await encrypt(ue, publicKey);
                            var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                            var crypted_verification_code = await encrypt(verification_code, publicKey);
                            var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                            var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                            var aesKey = await encrypt(generateRandomKey(10), publicKey);

                            socket.emit("confirmViaCodeByInput", crypted_email, "", crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                        } else {
                            var crypted_username = await encrypt(ue, publicKey);
                            var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                            var crypted_verification_code = await encrypt(verification_code, publicKey);
                            var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                            var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                            var aesKey = await encrypt(generateRandomKey(10), publicKey);

                            socket.emit("confirmViaCodeByInput", "", crypted_username, crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                        }
                    }
                }
            }
        } else {
            clearLocalStorageWithoutKey();

            var check1 = checkUsernameOrEmail();
            var check2 = checkPassword();
            var check3 = checkVerificationCode();

            if (check1 && check2 && check3) {
                var ue = document.getElementById("username").value;

                if (ue.toString().contains("@")) {
                    var crypted_email = await encrypt(ue, publicKey);
                    var crypted_password = await encrypt(document.getElementById("password"), publicKey);
                    var crypted_verification_code = await encrypt(verification_code, publicKey);
                    var crypted_remeberMe = await encrypt(remeberMe, publicKey);
                    var pubKey = await encrypt(kM.getPublicKey(), publicKey);
                    var aesKey = await encrypt(generateRandomKey(10), publicKey);

                    socket.emit("confirmViaCodeByInput", crypted_email, "", crypted_password, crypted_verification_code, crypted_remeberMe, pubKey, aesKey);
                } else {
                    var crypted_username = await encrypt(ue, publicKey);
                    var crypted_password = await encrypt(document.getElementById("password"), publicKey);
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

    if (!check1 && !check2 && !check3) {
        e_mail = "";
        pass_word = "";
        nick_name = "";

        clearLocalStorageWithoutKey();
    }

    if((check1 || check2) && check3 && check4 && check5 && check6) {
        window.location.href = "../confirm.html";
    }
}

async function manageConfirmError(message) {
    var { data: msg } = await decrypt(
        message,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );

    if (msg == "User deleted") {
        clearLocalStorageWithoutKey();

        var prompt = document.getElementById("prompt");

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = "block";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";

        document.getElementById("prompt-error").innerText =
            "Number of attempts exceeded";

        document.getElementById("prompt-text").innerText =
            "User has been deleted";

        document.getElementById("no-button").innerText = "Ok";
    } else if (msg == "Wrong verification code") {
        var containerCode = document.getElementById("container-code");
        containerCode.classList.add("error");
        containerCode.setAttribute("error-message", msg);
    } else if (msg == "User already confirmed") {
        clearLocalStorageWithoutKey();

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
        clearLocalStorageWithoutKey();

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

        waitSeconds = parseInt(msg.toString()) / 1000;
        var time = new Date();
        time.setSeconds(time.getSeconds() + waitSeconds);
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
            minutesToWait += " minutes and ";
        } else {
            minutesToWait = "";
        }
        var secondsToWait = Math.floor((timeToWait % (1000 * 60)) / 1000);
        if (secondsToWait > 0) {
            secondsToWait += " seconds ";
        } else {
            secondsToWait = "";
        }

        document.getElementById("prompt-text").innerText =
            "You need to wait " + hoursToWait + minutesToWait + secondsToWait + " before trying again";

        document.getElementById("no-button").innerText = "Ok";
    }
}

async function manageConfirmSuccess(c_email, c_nickname, c_password, c_rememberMe, c_aesKey, c_row) {
    var { data: email } = await decrypt(
        c_email,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: nickname } = await decrypt(
        c_nickname,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: password } = await decrypt(
        c_password,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
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
    
    localStorage.setItem("email", email);
    localStorage.setItem("nickname", nickname);
    localStorage.setItem("password", password);
    localStorage.setItem("rememberMe", rememberMe);
    var data = encryptAES(row, aesKey);
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

    if (!check1 && !check2 && !check3) {
        clearLocalStorageWithoutKey();
    }
}

async function manageRequestCodeError(message) {
    var { data: msg } = await decrypt(
        message,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );

    if (msg == "User deleted") {
        clearLocalStorageWithoutKey();

        var prompt = document.getElementById("prompt");

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = "block";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";

        document.getElementById("prompt-error").innerText =
            "Number of attempts exceeded";

        document.getElementById("prompt-text").innerText =
            "User has been deleted";

        document.getElementById("no-button").innerText = "Ok";
    } else if (msg == "User already confirmed") {
        clearLocalStorageWithoutKey();

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
        clearLocalStorageWithoutKey();

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

        waitSeconds = parseInt(msg.toString()) / 1000;
        var time = new Date();
        time.setSeconds(time.getSeconds() + waitSeconds);
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
            minutesToWait += " minutes and ";
        } else {
            minutesToWait = "";
        }
        var secondsToWait = Math.floor((timeToWait % (1000 * 60)) / 1000);
        if (secondsToWait > 0) {
            secondsToWait += " seconds ";
        } else {
            secondsToWait = "";
        }

        document.getElementById("prompt-text").innerText =
            "You need to wait " + hoursToWait + minutesToWait + secondsToWait + " before trying again";

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
    noButton.innerText = "No";
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

/*Password toggle*/
document.getElementById("toggle-password").addEventListener("click", () => {
    document.getElementById("toggle-password").classList.toggle("fa-eye");
    document.getElementById("toggle-password").classList.toggle("fa-eye-slash");
    var password = document.getElementById("password");
    if (password.type === "password") {
        password.type = "text";
    } else {
        password.type = "password";
    }
});

//se la key è invio premo il bottone
document.onkeydown = function (e) {
    if (e.keyCode == 13) {
        confirmCode();
    }
}