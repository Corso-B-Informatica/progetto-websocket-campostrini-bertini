if (checkLocalstorageForLogin()) {
    window.location.href = "../chat.html";
} else if (checkLocalstorageForConfirm()) {
    var prompt = document.getElementById("prompt");

    // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
    prompt.style.display = "block";

    var yesButton = document.getElementById("yes-button");
    yesButton.style.display = "block";

    var noButton = document.getElementById("no-button");
    noButton.style.display = "block";

    document.getElementById("prompt-error").innerText = "You have saved data";
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
    localStorage.setItem("publicKeyArmored", publicKeyArmored);

    if (str == "0") {
        forgotPassword();
    }
});

socket.on("forgotPasswordDataError", () => {
    forgotPasswordDataError();
});


socket.on("forgotPasswordError", () => {
    forgotPasswordError();
});

socket.on("forgotPasswordSuccess", () => {
    forgotPasswordSuccess();
});

/*Send forgot password request*/
async function forgotPassword() {
    try {
        await kM.generateNewKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");
        
        setTimeout(async function () {
            if (checkKey()) {
                if (checkUsernameOrEmail()) {
                    var ue = document.getElementById("username").value;
                    var crypted_ue = await encrypt(ue, localStorage.getItem("publicKeyArmored"));

                    setTimeout(function () {
                        if (ue.toString().includes('@')) {
                            socket.emit("forgotPassword", crypted_ue, "");
                        } else {
                            socket.emit("forgotPassword", "", crypted_ue);
                        }
                    }, 2000);
                }
            } else {
                localStorage.removeItem("publicKeyArmored");
                socket.emit("getPublicKey", "0");
            }
        }, 1000);
    } catch (err) {
        console.log(err);
    }
}

/*Manage response*/
async function forgotPasswordSuccess() {
    var prompt = document.getElementById("prompt");

    // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
    prompt.style.display = "block";

    var noButton = document.getElementById("no-button");
    noButton.style.display = "block";

    document.getElementById("prompt-error").innerText =
        "Password sent successfully";

    document.getElementById("prompt-text").innerText =
        "Please check your email";

    document.getElementById("no-button").innerText = "Ok";
}

async function forgotPasswordDataError() {
    var containerUsername = document.getElementById("container-username-email");
    containerUsername.classList.add("error");
    containerUsername.setAttribute("error-message", "Invalid Username or Email");
}

async function forgotPasswordError() {
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

document.getElementById("password-1").onclick = function () {
    var containerPassword = document.getElementById("container-password-1");
    containerPassword.classList.remove("error");
};

document.getElementById("span-password-1").onclick = function () {
    var containerPassword = document.getElementById("container-password-1");
    containerPassword.classList.remove("error");
};

document.getElementById("password-2").onclick = function () {
    var containerPassword = document.getElementById("container-password-2");
    containerPassword.classList.remove("error");
};

document.getElementById("span-password-2").onclick = function () {
    var containerPassword = document.getElementById("container-password-2");
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

document.getElementById("password-1").oninput = function () {
    var containerPassword = document.getElementById("container-password-1");
    containerPassword.setAttribute("error-message", "Invalid password");
}

document.getElementById("password-2").oninput = function () {
    var containerPassword = document.getElementById("container-password-2");
    containerPassword.setAttribute("error-message", "Invalid password");
}

/*Password toggle*/
document.getElementById("toggle-password-1").addEventListener("click", () => {
    document.getElementById("toggle-password-1").classList.toggle("fa-eye");
    document.getElementById("toggle-password-1").classList.toggle("fa-eye-slash");
    var password = document.getElementById("password-1");
    if (password.type === "password") {
        password.type = "text";
    } else {
        password.type = "password";
    }
});

document.getElementById("toggle-password-2").addEventListener("click", () => {
    document.getElementById("toggle-password-2").classList.toggle("fa-eye");
    document.getElementById("toggle-password-2").classList.toggle("fa-eye-slash");
    var password = document.getElementById("password-2");
    if (password.type === "password") {
        password.type = "text";
    } else {
        password.type = "password";
    }
});

//se la key è invio premo il bottone
document.onkeydown = function (e) {
    if (e.keyCode == 13) {
        forgotPassword();
    }
}