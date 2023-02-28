/*keyManager*/
const kM = new keyManager();

/*Socket.io*/
var socket = io();

socket.on("publicKey", (publicKeyArmored) => {
  sendRegister(publicKeyArmored);
});

socket.on("registerError", (message, error) => {
  manageRegisterError(message, error);
});

socket.on("registerDataError", (check1, check2, check3, error) => {
  manageRegisterDataError(check1, check2, check3, error);
});

socket.on("registerSuccess", (email, password, nickname, remeber) => {
  manageRegisterSuccess(email, password, nickname, remeber);
});

/*Register*/
async function register() {
  var check1 = checkUsername();
  var check2 = checkEmail();
  var check3 = checkPassword();
  if (check1 && check2 && check3) {
    await kM.generateKeyPair(
      document.getElementById("username").value,
      document.getElementById("email").value,
      document.getElementById("password").value
    );
    socket.emit("getPublicKey");
  } else {
    alert(alertMessage);
    alertMessage = "";
  }
}

async function sendRegister(publicKeyArmored) {
  //cifratura dati
  const crypted_nickname = await encrypt(
    validate(document.getElementById("username").value.toString()),
    publicKeyArmored
  );

  const crypted_email = await encrypt(
    validate(document.getElementById("email").value.toString()),
    publicKeyArmored
  );

  const crypted_password = await encrypt(
    validate(document.getElementById("password").value.toString()),
    publicKeyArmored
  );

  const crypted_remember = await encrypt(
    validate(document.getElementById("checkbox").checked.toString()),
    publicKeyArmored
  );

  const crypted_publicKeyArmored = await encrypt(
    kM.getPublicKey(),
    publicKeyArmored
  );

  socket.emit(
    "register",
    crypted_email,
    crypted_password,
    crypted_nickname,
    crypted_remember,
    crypted_publicKeyArmored
  );
}

/*Manage errors*/
async function manageRegisterError(msg, err) {
  var { data: message } = await decrypt(
    msg,
    kM.getPrivateKey(),
    kM.getPassphrase()
  );
  var { data: error } = await decrypt(
    err,
    kM.getPrivateKey(),
    kM.getPassphrase()
  );

  if (message == "User already registered") {
    if (error == "both") {
      var prompt = document.getElementById("prompt");

      // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
      prompt.style.display = "block";

      var yesButton = document.getElementById("yes-button");
      yesButton.style.display = "block";

      var noButton = document.getElementById("no-button");
      noButton.style.display = "block";

      document.getElementById("prompt-error").innerText =
        "User already registered";
      document.getElementById("prompt-text").innerText =
        "Do you want to go to the login page?";

      // Aggiungi un event listener al bottone "Yes"
      document.getElementById("yes-button").addEventListener("click", () => {
        window.location.href = "../signIn.html";
      });
    } else if (error == "email") {
      var containerEmail = document.getElementById("container-email");
      containerEmail.classList.add("error");
      containerEmail.setAttribute("error-message", "Email already used");
    } else if (error == "username") {
      var containerUsername = document.getElementById("container-username");
      containerUsername.classList.add("error");
      containerUsername.setAttribute("error-message", "Username already used");
    } else {
      var containerEmail = document.getElementById("container-email");
      containerEmail.classList.add("error");
      containerEmail.setAttribute("error-message", "Email already used");
      var containerUsername = document.getElementById("container-username");
      containerUsername.classList.add("error");
      containerUsername.setAttribute("error-message", "Username already used");
    }
  } else if (message == "User must confirm his account") {
    if (error == "both") {
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
    } else if (error == "email") {
      var containerEmail = document.getElementById("container-email");
      containerEmail.classList.add("error");
      containerEmail.setAttribute("error-message", "Email already used");
    } else if (error == "username") {
      var containerUsername = document.getElementById("container-username");
      containerUsername.classList.add("error");
      containerUsername.setAttribute("error-message", "Username already used");
    } else {
      var containerEmail = document.getElementById("container-email");
      containerEmail.classList.add("error");
      containerEmail.setAttribute("error-message", "Email already used");
      var containerUsername = document.getElementById("container-username");
      containerUsername.classList.add("error");
      containerUsername.setAttribute("error-message", "Username already used");
    }
  } else {
    alert(message);
  }
}

async function manageRegisterDataError(
  crypted_check1,
  crypted_check2,
  crypted_check3,
  crypted_error
) {
  var { data: check1 } = await decrypt(
    crypted_check1,
    kM.getMyPrivateKey(),
    kM.getPassphrase()
  );
  var { data: check2 } = await decrypt(
    crypted_check2,
    kM.getMyPrivateKey(),
    kM.getPassphrase()
  );
  var { data: check3 } = await decrypt(
    crypted_check3,
    kM.getMyPrivateKey(),
    kM.getPassphrase()
  );
  var { data: error } = await decrypt(
    crypted_error,
    kM.getMyPrivateKey(),
    kM.getPassphrase()
  );

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
async function manageRegisterSuccess(
  crypted_email,
  crypted_password,
  crypted_nickname,
  crypted_remember
) {
  var { data: email } = await decrypt(
    crypted_email,
    kM.getMyPrivateKey(),
    kM.getPassphrase()
  );
  var { data: password } = await decrypt(
    crypted_password,
    kM.getMyPrivateKey(),
    kM.getPassphrase()
  );
  var { data: nickname } = await decrypt(
    crypted_nickname,
    kM.getMyPrivateKey(),
    kM.getPassphrase()
  );
  var { data: remember } = await decrypt(
    crypted_remember,
    kM.getMyPrivateKey(),
    kM.getPassphrase()
  );

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
document.getElementById("email").oninput = function () {
  var containerEmail = document.getElementById("container-email");
  containerEmail.setAttribute("error-message", "Invalid email");
};

document.getElementById("username").oninput = function () {
  var containerUsername = document.getElementById("container-username");
  containerUsername.setAttribute("error-message", "Invalid username");
};