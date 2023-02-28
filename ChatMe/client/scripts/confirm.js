
/*Socket.io*/
var socket = io();

socket.emit("getPublicKey");

socket.on("publicKey", (publicKeyArmored) => {
    tryConfirmViaLink(publicKeyArmored);
    localStorage.setItem("publicKeyArmored", publicKeyArmored);
});

socket.on("confirmSuccess", (error) => { });

function isUrlConfirmed(url, email, password, nickname, verification_code) {
    return url.includes("/confirm.html#") && email != null && password != null && nickname != null && verification_code != null;
}

async function sendConfirmViaLink(publicKeyArmored, email, password, nickname, verification_code) {
    const crypted_nickname = await encrypt(nickname, publicKeyArmored);
    const crypted_email = await encrypt(email, publicKeyArmored);
    const crypted_password = await encrypt(password, publicKeyArmored);
    const crypted_verification_code = await encrypt(verification_code, publicKeyArmored);

    socket.emit("confirmViaLink", crypted_email, crypted_password, crypted_nickname, crypted_verification_code);
}

/*Page withouth login*/
function setPageWithoutLogin() {
    
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
        var rememberMe = localStorage.getItem("rememberMe");
        
        if ((email != null || nickname != null) && password != null && rememberMe == "true") {
            setPageWithoutLogin();
        } else {
            clearLocalStorage();
        }
    }
}
