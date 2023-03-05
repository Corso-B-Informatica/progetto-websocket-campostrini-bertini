/*Letters and signs*/
var less = /</g;
var greater = />/g;
var apostrofe = /'/g;
var quotation = /"/g;
var and = /&/g;
var grave = /`/g;
var slash = /\//g;

/*Controlla se l'username è valido*/
function checkUsername() {
    var username = document.getElementById("username").value.toString();
    if (username.length == 0) {
        var containerUsername = document.getElementById("container-username");
        containerUsername.classList.add("error");
        containerUsername.setAttribute("error-message", "Username must be filled out");
        return false;
    }
    if (username.length > 30) {
        var containerUsername = document.getElementById("container-username");
        containerUsername.classList.add("error");
        containerUsername.setAttribute("error-message", "Username must be at most 30 characters long");
        return false;
    }
    if (!/[a-zA-Z0-9]/.test(username)) {
        var containerUsername = document.getElementById("container-username");
        containerUsername.classList.add("error");
        containerUsername.setAttribute("error-message", "Username must contain at least one letter or number");
        return false;
    }
    if (username.includes("@")) {
        var containerUsername = document.getElementById("container-username");
        containerUsername.classList.add("error");
        containerUsername.setAttribute("error-message", "Username must not contain '@'");
        return false;
    }
    return true;
}

/*Controlla se l'email è valida*/
function checkEmail() {
    var email = document.getElementById("email").value.toString();

    if (
        email
            .trim()
            .match(
                /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/
            ) == null
    ) {
        var containerEmail = document.getElementById("container-email");
        containerEmail.classList.add("error");
        containerEmail.setAttribute("error-message", "Email must be valid");
        return false;
    }
    return true;
}

/*Controlla se la password è valida*/
function checkPassword() {
    var password = document.getElementById("password").value.toString();

    if (password.length == 0) {
        var containerPassword = document.getElementById("container-password");
        containerPassword.classList.add("error");
        containerPassword.setAttribute("error-message", "Password must be filled out");
        return false;
    }
    if (password.length < 8) {
        var containerPassword = document.getElementById("container-password");
        containerPassword.classList.add("error");
        containerPassword.setAttribute("error-message", "Password must be at least 8 characters long");
        return false;
    }
    if (password.length > 50) {
        var containerPassword = document.getElementById("container-password");
        containerPassword.classList.add("error");
        containerPassword.setAttribute("error-message", "Password must be at most 50 characters long");
        return false;
    }
    if (!/[a-z]/.test(password)) {
        var containerPassword = document.getElementById("container-password");
        containerPassword.classList.add("error");
        containerPassword.setAttribute("error-message", "Password must contain at least one lowercase letter");
        return false;
    }
    if (!/[A-Z]/.test(password)) {
        var containerPassword = document.getElementById("container-password");
        containerPassword.classList.add("error");
        containerPassword.setAttribute("error-message", "Password must contain at least one uppercase letter");
        return false;
    }
    if (!/[0-9]/.test(password)) {
        var containerPassword = document.getElementById("container-password");
        containerPassword.classList.add("error");
        containerPassword.setAttribute("error-message", "Password must contain at least one number");
        return false;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        var containerPassword = document.getElementById("container-password");
        containerPassword.classList.add("error");
        containerPassword.setAttribute("error-message", "Password must contain at least one special character");
        return false;
    }
    return true;
}

function checkVerificationCode() {
    var code = document.getElementById("code").value.toString();

    if (code.length != 10) {
        var containerCode = document.getElementById("container-code");
        containerCode.classList.add("error");
        containerCode.setAttribute("error-message", "Code must be 10 characters long");
        return false;
    }
    if (!/^[a-z0-9]+$/.test(code)) {
        var containerCode = document.getElementById("container-code");
        containerCode.classList.add("error");
        containerCode.setAttribute("error-message", "Invalid code");
        return false;
    }
    return true;
}


function checkUsernameOrEmail() {
    var ue = document.getElementById("username").value.toString();

    if (
        ue.trim()
            .match(
                /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/
        ) == null && (ue.length < 0 || ue.length > 30 || !/[a-zA-Z0-9]/.test(ue) || ue.includes('@'))
    ) {
        var containerEmail = document.getElementById("container-username-email");
        containerEmail.classList.add("error");
        containerEmail.setAttribute("error-message", "Invalid username or email");
        return false;
    }
    return true;
}

/*Rimpiazza i caratteri speciali con i rispettivi codici html*/
function validate(data) {
    return data
        .replace(less, "&lt;")
        .replace(greater, "&gt;")
        .replace(apostrofe, "&#39;")
        .replace(quotation, "&#34;")
        .replace(and, "&#38;")
        .replace(grave, "&#96;")
        .replace(slash, "&#47;")
        .trim();
}