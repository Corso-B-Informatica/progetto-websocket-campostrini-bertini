if (checkLocalstorageForLogin()) {
    window.location.href = "../chat.html";
}
if (checkLocalstorageForConfirm()) {
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
  sendRegister(publicKeyArmored);
});

socket.on("registerError", (message, error) => {
  manageRegisterError(message, error);
});

socket.on(
  "registerDataError",
  (crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_data1, crypted_data2, crypted_data3, crypted_data4) => {
    manageRegisterDataError(crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_data1, crypted_data2, crypted_data3, crypted_data4);
  }
);

socket.on("registerSuccess", (email, password, nickname) => {
  manageRegisterSuccess(email, password, nickname);
});

/*Register*/
async function register() {
  if (checkUsername() && checkEmail() && checkPassword()) {
    await kM.generateNewKeyPair("nickname", "email@gmail.com", "P4ssw0rd!");
    socket.emit("getPublicKey", "");
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

  const crypted_publicKeyArmored = await encrypt(
    kM.getPublicKey(),
    publicKeyArmored
  );

  socket.emit(
    "register",
    crypted_email,
    crypted_password,
    crypted_nickname,
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
    } else if (error == "nickname") {
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
    } else if (error == "nickname") {
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
    var containerEmail = document.getElementById("container-email");
    containerEmail.classList.add("error");
    containerEmail.setAttribute("error-message", "Email already used");
    var containerUsername = document.getElementById("container-username");
    containerUsername.classList.add("error");
    containerUsername.setAttribute("error-message", "Username already used");
  }
}

async function manageRegisterDataError(
  crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_data1, crypted_data2, crypted_data3, crypted_data4
) {
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

  if (!check1) {
    var containerUsername = document.getElementById("container-username");
    containerUsername.classList.add("error");
    containerUsername.setAttribute("error-message", data1);
  }

  if (!check2) {
    var containerEmail = document.getElementById("container-email");
    containerEmail.classList.add("error");
    containerEmail.setAttribute("error-message", data2);
  }

  if (!check3) {
    var containerPassword = document.getElementById("container-password");
    containerPassword.classList.add("error");
    containerPassword.setAttribute("error-message", data3);
  }

  if(!check4) {
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
}

/*Managa success*/
async function manageRegisterSuccess(
  crypted_email,
  crypted_password,
  crypted_nickname
) {
  var { data: email } = await decrypt(
    crypted_email,
    kM.getPrivateKey(),
    kM.getPassphrase()
  );
  var { data: password } = await decrypt(
    crypted_password,
    kM.getPrivateKey(),
    kM.getPassphrase()
  );
  var { data: nickname } = await decrypt(
    crypted_nickname,
    kM.getPrivateKey(),
    kM.getPassphrase()
  );

  window.location.href = "../confirm.html";
  localStorage.setItem("email", email);
  localStorage.setItem("password", password);
  localStorage.setItem("nickname", nickname);
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
  noButton.innerText = "No";
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

document.getElementById("password").oninput = function () {
  var containerPassword = document.getElementById("container-password");
  containerPassword.setAttribute("error-message", "Invalid password");
}