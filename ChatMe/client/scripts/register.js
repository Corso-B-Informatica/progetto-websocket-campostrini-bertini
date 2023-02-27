/*Socket.io*/
var socket = io();

socket.on("publicKey", (publicKeyArmored) => {
    sendRegister(publicKeyArmored);
});

socket.on("registerError", (err) => {
    manageRegisterError(err);
});

socket.on("registerDataError", (check1, check2, check3, error) => {
    manageRegisterDataError(check1, check2, check3, error);
});

socket.on("registerSuccess", (email, password, nickname, remeber) => {
    manageRegisterSuccess(email, password, nickname, remeber);
});

/*Register*/
function register() {
    var check1 = checkUsername();
    var check2 = checkEmail();
    var check3 = checkPassword();
    if (check1 && check2 && check3) {
        socket.emit("getPublicKey");
    } else {
        alert(alertMessage);
        alertMessage = "";
    }
}

async function sendRegister(publicKeyArmored) {
    //cifratura dati
    const crypted_nickname = await encrypt(validate(document
        .getElementById("username")
        .value.toString()), publicKeyArmored);

    const crypted_email = await encrypt(validate(document
        .getElementById("email")
        .value.toString()), publicKeyArmored);

    const crypted_password = await encrypt(validate(document
        .getElementById("password")
        .value.toString()), publicKeyArmored);

    const crypted_remember = await encrypt(validate(document
        .getElementById("checkbox")
        .checked.toString()), publicKeyArmored);

    socket.emit("register", crypted_email, crypted_password, crypted_nickname, crypted_remember, getMyPublicKey());
}

/*Manage errors*/
async function manageRegisterError(err) {
    var error = await decrypt(err, getMyPrivateKey());

    if (error == "User already registered") {
        var prompt = document.getElementById('prompt');

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = 'block';
        document.getElementById("prompt-error").innerText = "Error: " + error;
        document.getElementById("prompt-text").innerText = "Do you want to go to the login page?";

        // Aggiungi un event listener al bottone "Yes"
        document.getElementById('yes-button').addEventListener('click', () => {
            window.location.href = '../signIn.html';
        });
    } else if (error == "User must confirm his account") {
        var prompt = document.getElementById('prompt');

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = 'block';
        document.getElementById("prompt-error").innerText = "Error: " + error;
        document.getElementById("prompt-text").innerText = "Do you want to go to the confirmation page?";

        // Aggiungi un event listener al bottone "Yes"
        document.getElementById('yes-button').addEventListener('click', () => {
            window.location.href = '../confirm.html';
        });
    } else {
        alert(error);
    }
}

async function manageRegisterDataError(crypted_check1, crypted_check2, crypted_check3, crypted_error) {
    var check1 = await decrypt(crypted_check1, getMyPrivateKey());
    var check2 = await decrypt(crypted_check2, getMyPrivateKey());
    var check3 = await decrypt(crypted_check3, getMyPrivateKey());
    var error = await decrypt(crypted_error, getMyPrivateKey());

    if (!check1) {
        var containerUsername = document.getElementById("container-username");
        containerUsername.classList.add("error");
    }

    if (!check2) {
        var containerEmail = document.getElementById("container-email");
        containerEmail.classList.add("error");
    }

    if (!check3) {
        var containerPassword = document.getElementById("container-password");
        containerPassword.classList.add("error");
    }

    alert(error);
}

/*Managa success*/
async function manageRegisterSuccess(crypted_email, crypted_password, crypted_nickname, crypted_remember) {
    var email = await decrypt(crypted_email, getMyPrivateKey());
    var password = await decrypt(crypted_password, getMyPrivateKey());
    var nickname = await decrypt(crypted_nickname, getMyPrivateKey());
    var remember = await decrypt(crypted_remember, getMyPrivateKey());

    window.location.href = "../confirm.html";
    localStorage.setItem("email", email);
    localStorage.setItem("password", password);
    localStorage.setItem("nickname", nickname);
    localStorage.setItem("rememberMe", remember);
}

/*Reset errori*/
document.getElementById("email").onclick = function () {
    var containerEmail = document.getElementById("container-email");
    containerEmail.classList.remove("error");
};

document.getElementById("span-email").onclick = function () {
    var containerEmail = document.getElementById("container-email");
    containerEmail.classList.remove("error");
};

document.getElementById("username").onclick = function () {
    var containerUsername = document.getElementById("container-username");
    containerUsername.classList.remove("error");
};

document.getElementById("span-username").onclick = function () {
    var containerUsername = document.getElementById("container-username");
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
document.getElementById('no-button').addEventListener('click', () => {
    var prompt = document.getElementById('prompt');
    prompt.style.display = 'none';
});