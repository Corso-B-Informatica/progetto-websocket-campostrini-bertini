var socket = io();

var e_mail = null;
var pass_word = null;
var nick_name = null;
var remember_me = null;
var data_chat = null;
var publicKey = null;

function checkLocalstorageForLogin() {
    var rememberMe = localStorage.getItem("rememberMe");

    if (rememberMe == "true") {
        return checkLocalstorageForConfirm();
    } else {
        return false;
    }
}

function checkLocalstorageForConfirm() {
    var email = localStorage.getItem("email");
    var password = localStorage.getItem("password");
    var nickname = localStorage.getItem("nickname");
    var rememberMe = localStorage.getItem("rememberMe");

    if (rememberMe == "false") {
        clearLocalStorage();
    } else {
        return (email != null || nickname != null) && password != null;
    }
}

function clearLocalStorage() {
    e_mail = null;
    pass_word = null;
    nick_name = null;
    remember_me = null;
    data_chat = null;
    publicKey = null;

    localStorage.clear();
}

function clearLocalStorageUser() {
    e_mail = null;
    pass_word = null;
    nick_name = null;
    remember_me = null;

    localStorage.removeItem("email");
    localStorage.removeItem("password");
    localStorage.removeItem("nickname");
    localStorage.removeItem("rememberMe");
}

function clearLocalStorageWithoutKey() {
    e_mail = null;
    pass_word = null;
    nick_name = null;
    remember_me = null;
    data_chat = null;

    localStorage.removeItem("email");
    localStorage.removeItem("password");
    localStorage.removeItem("nickname");
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("data");
}

function registerStorageData() {
    var email = localStorage.getItem("email");
    var password = localStorage.getItem("password");
    var nickname = localStorage.getItem("nickname");
    var remeberMe = localStorage.getItem("rememberMe");
    var dataChat = localStorage.getItem("data");
    var publicKeyArmored = localStorage.getItem("publicKeyArmored");

    if (email != null) {
        if (email.length > 0) {
            e_mail = email;
        }
    }

    if (password != null) {
        if (password.length > 0) {
            pass_word = password;
        }
    }

    if (nickname != null) {
        if (nickname.length > 0) {
            nick_name = nickname;
        }
    }

    if (remeberMe != null) {
        if (remeberMe.length > 0) {
            remember_me = remeberMe;
        }
    }

    if (dataChat != null) {
        if (dataChat.length > 0) {
            data_chat = dataChat;
        }
    }

    if (publicKeyArmored != null) {
        if (publicKeyArmored.length > 0) {
            publicKey = publicKeyArmored;
        }
    }
}

function restoreStorageData() {
    var email = localStorage.getItem("email");
    var password = localStorage.getItem("password");
    var nickname = localStorage.getItem("nickname");
    var remeberMe = localStorage.getItem("rememberMe");
    var dataChat = localStorage.getItem("data");
    var publicKeyArmored = localStorage.getItem("publicKeyArmored");

    if(email == null && e_mail != null) {
        localStorage.setItem("email", e_mail);
    }

    if (password == null && pass_word != null) {
        localStorage.setItem("password", pass_word);
    }

    if (nickname == null && nick_name != null) {
        localStorage.setItem("nickname", nick_name);
    }

    if (remeberMe == null && remember_me != null) {
        localStorage.setItem("rememberMe", remember_me);
    }

    if (dataChat == null && data_chat != null) {
        localStorage.setItem("data", data_chat);
    }

    if (publicKeyArmored == null && publicKey != null) {
        localStorage.setItem("publicKeyArmored", publicKey);
    }
}

function resolveRememberMe() {
    var rememberMe = localStorage.getItem("rememberMe");
    if(rememberMe == null) {
        localStorage.setItem("rememberMe", "false");
    }
    if (rememberMe == undefined) {
        localStorage.setItem("rememberMe", "false");
    }
    if(rememberMe != "true" && rememberMe != "false") {
        localStorage.setItem("rememberMe", "false");
    }
}

function checkData() {
    resolveRememberMe();
    var email = localStorage.getItem("email");
    var password = localStorage.getItem("password");
    var nickname = localStorage.getItem("nickname");
    var remeberMe = localStorage.getItem("rememberMe");

    if ((email == undefined && nickname == undefined) || password == undefined || remeberMe == undefined) {
        return false;
    }
    if ((email == null && nickname == null) || password == null || remeberMe == null) {
        return false;
    }
    if ((email.length == 0 && nickname.length == 0) || password.length == 0 || remeberMe.length == 0) {
        return false;
    }
    return true;
}

function checkKey() {
    var key = localStorage.getItem("publicKeyArmored");

    if(key == undefined) {
        return false;
    }
    if(key == null) {
        return false;
    }
    if (key.length == 0) {
        return false;
    }
    if (!isValid(key)) {
        return false;
    }

    return true;
}

setInterval(registerStorageData, 10);
setInterval(restoreStorageData, 10);