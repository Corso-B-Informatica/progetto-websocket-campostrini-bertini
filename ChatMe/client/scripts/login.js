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

async function genKey() {
    await kM.generateNewKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");
}

genKey();

/*Socket.io*/
var socket = io();

socket.on("publicKey", (publicKeyArmored, str) => {
    if (str == "0") {
        sendLogin(publicKeyArmored);
    }
});

socket.on("loginSuccess", (c_nickname, c_email, c_password, c_rememberMe, c_aesKey, c_row) => {
    manageLoginSuccess(c_nickname, c_email, c_password, c_rememberMe, c_aesKey, c_row);
});

socket.on("loginError", (msg) => {
    manageLoginError(msg);
});

socket.on("loginDataError", (crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_check5, crypted_data1, crypted_data2, crypted_data3, crypted_data4, crypted_data5) => {
    manageLoginDataError(crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_check5, crypted_data1, crypted_data2, crypted_data3, crypted_data4, crypted_data5);
});

function Login() {
    socket.emit("getPublicKey", "0");
}

async function sendLogin(publicKeyArmored) {
    if (checkUsernameOrEmail() && checkPassword()) {
        var ue = document.getElementById('username').value.toString();
        var c_password = await encrypt(validate(document.getElementById('password').value.toString()), publicKeyArmored);
        var c_rememberMe = await encrypt(document.getElementById("checkbox").checked.toString(), publicKeyArmored);
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

async function manageLoginSuccess(c_nickname, c_email, c_password, c_rememberMe, c_aesKey, c_row) {
    var { data: nickname } = await decrypt(
        c_nickname,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    var { data: email } = await decrypt(
        c_email,
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
    
    localStorage.setItem("nickname", nickname);
    localStorage.setItem("email", email);
    localStorage.setItem("password", password);
    localStorage.setItem("rememberMe", rememberMe);
    var data = encryptAES(JSON.stringify(row), aesKey);
    localStorage.setItem("data", data);

    window.location.href = "../chat.html";
}


async function manageLoginError(message) {
    var { data: msg } = await decrypt(
        message,
        kM.getPrivateKey(),
        kM.getPassphrase()
    );
    
    if (msg == "Wrong password") {
        var containerPassword = document.getElementById("container-password");
        containerPassword.classList.add("error");
        containerPassword.setAttribute("error-message", msg);
    } else if (msg == "User not confirmed") {
        var prompt = document.getElementById("prompt");

        // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
        prompt.style.display = "block";

        var yesButton = document.getElementById("yes-button");
        yesButton.style.display = "block";

        var noButton = document.getElementById("no-button");
        noButton.style.display = "block";

        document.getElementById("prompt-error").innerText =
            "User must confirm his account";
        document.getElementById("prompt-text").innerText =
            "Do you want to go to the confirmation page?";

        // Aggiungi un event listener al bottone "Yes"
        document.getElementById("yes-button").addEventListener("click", () => {
            window.location.href = "../confirm.html";
        });
    } else if(msg == "User not registered") {
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
        var containerUsername = document.getElementById("container-username-email");
        containerUsername.classList.add("error");
        containerUsername.setAttribute("error-message", "Invalid Username or Email");
        var containerPassword = document.getElementById("container-password");
        containerPassword.classList.add("error");
        containerPassword.setAttribute("error-message", "Invalid Password");
    }
}

async function manageLoginDataError(crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_check5, crypted_data1, crypted_data2, crypted_data3, crypted_data4, crypted_data5) {
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
    noButton.innerText = "No";
});

/*Reset error message*/
document.getElementById("username").oninput = function () {
    var containerUsername = document.getElementById("container-username-email");
    containerUsername.setAttribute("error-message", "Invalid username");
};

document.getElementById("password").oninput = function () {
    var containerPassword = document.getElementById("container-password");
    containerPassword.setAttribute("error-message", "Invalid password");
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