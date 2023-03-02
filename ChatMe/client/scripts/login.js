if (!checkLocalstorageForLogin() && checkLocalstorageForConfirmation()) {
    var prompt = document.getElementById("prompt");

    // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
    prompt.style.display = "block";

    var yesButton = document.getElementById("yes-button");
    yesButton.style.display = "block";

    var noButton = document.getElementById("no-button");
    noButton.style.display = "block";

    document.getElementById("prompt-error").innerText =
        "You have saved data";
    document.getElementById("prompt-text").innerText =
        "Do you want to go to the confirmation page?";

    // Aggiungi un event listener al bottone "Yes"
    document.getElementById("yes-button").addEventListener("click", () => {
        window.location.href = "../confirm.html";
    });
}

/*keyManager*/
const kM = new keyManager();

/*Socket.io*/
var socket = io();

socket.on("publicKey", (publicKeyArmored, str) => {
    if (str == "0") {
        sendLogin(publicKeyArmored);
    }
});

function Login() {
    socket.emit("getPublicKey", "0");
}

async function sendLogin(publicKeyArmored) {
    if (checkUsernameOrEmail() && checkPassword()) {
        await kM.generateNewKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");

        var ue = document.getElementById('username').value.toString();
        var c_password = await encrypt(validate(document.getElementById('password').value.toString()), publicKeyArmored);
        var c_rememberMe = await encrypt(document.getElementById("rememberMe").checked, publicKeyArmored);
        var c_publicKey = await encrypt(kM.getPublicKey(), publicKeyArmored);
        var c_email = "";
        var c_nickname = "";

        if (ue.includes("@")) {
            c_email = await encrypt(validate(ue), publicKeyArmored);
        } else {
            c_nickname = await encrypt(validate(ue), publicKeyArmored);
        }

        socket.emit("login", c_email, c_nickname, c_password, c_rememberMe, c_publicKey);
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
