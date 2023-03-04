var socket = io();
function checkLocalstorageForLogin() {
    var login = localStorage.getItem("login");
    if (login == "true") {
        var rememberMe = localStorage.getItem("rememberMe");
        if (rememberMe == "true") {
            return checkLocalstorageForConfirm();
        }
    }
    return false;
}

function checkLocalstorageForConfirm() {
    var email = localStorage.getItem("email");
    var password = localStorage.getItem("password");
    var nickname = localStorage.getItem("nickname");

    return (email != null || nickname != null) && password != null;
}

function clearLocalStorage() {
    localStorage.clear();
}