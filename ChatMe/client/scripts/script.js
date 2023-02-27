function checkLocalstorage() {
    if (checkLocalstorageForLogin()) {
        window.location.href = "../signIn.html";
    } else if (checkLocalstorageForConfirm()) {
        window.location.href = "../confirm.html";
    } else {
        clearLocalStorage();
    }
}

function checkLocalstorageForLogin() {
    var login = localStorage.getItem("login");
    if (login == "true") {
        return checkLocalstorageForConfirm();
    }
    return false;
}

function checkLocalstorageForConfirm() {
    var email = localStorage.getItem("email");
    var password = localStorage.getItem("password");
    var nickname = localStorage.getItem("nickname");
    var rememberMe = localStorage.getItem("rememberMe");

    return (email != null || nickname != null) && password != null && rememberMe == "true";
}

function clearLocalStorage() {
    localStorage.clear();
}