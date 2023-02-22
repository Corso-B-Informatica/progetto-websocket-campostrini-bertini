/*Socket.io*/
var socket = io();

socket.on("publicKey", (publicKeyArmored) => {
  sendRegister(publicKeyArmored);
});

socket.on("registerError", (error) => {
  alert(error);
});

socket.on("registerSuccess", () => {
  window.location.href = "../confirm.html";
});

socket.on("registerDataError", (check1, check2, check3, error) => {
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
});
/*Letters and signs*/
var alertMessage = "";
var less = /</g;
var greater = />/g;
var apostrofe = /'/g;
var quotation = /"/g;
var and = /&/g;
var grave = /`/g;
var slash = /\//g;

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
  //lettura key dalla armored key
  const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

  //cifratura dati
  const crypted_nickname = await openpgp.encrypt({
    message: await openpgp.createMessage({
      text: document
        .getElementById("username")
        .value.toString()
        .replace(less, "&lt;")
        .replace(greater, "&gt;")
        .replace(apostrofe, "&#39;")
        .replace(quotation, "&#34;")
        .replace(and, "&#38;")
        .replace(grave, "&#96;")
        .replace(slash, "&#47;"),
    }),
    encryptionKeys: publicKey,
  });

  const crypted_email = await openpgp.encrypt({
    message: await openpgp.createMessage({
      text: document
        .getElementById("email")
        .value.toString()
        .replace(less, "&lt;")
        .replace(greater, "&gt;")
        .replace(apostrofe, "&#39;")
        .replace(quotation, "&#34;")
        .replace(and, "&#38;")
        .replace(grave, "&#96;")
        .replace(slash, "&#47;"),
    }),
    encryptionKeys: publicKey,
  });

  const crypted_password = await openpgp.encrypt({
    message: await openpgp.createMessage({
      text: document
        .getElementById("password")
        .value.toString()
        .replace(less, "&lt;")
        .replace(greater, "&gt;")
        .replace(apostrofe, "&#39;")
        .replace(quotation, "&#34;")
        .replace(and, "&#38;")
        .replace(grave, "&#96;")
        .replace(slash, "&#47;"),
    }),
    encryptionKeys: publicKey,
  });

  socket.emit("register", crypted_email, crypted_nickname, crypted_password);
}

/*Check functions*/
function checkUsername() {
  var username = document.getElementById("username").value;
  if (username.length == 0) {
    var containerUsername = document.getElementById("container-username");
    containerUsername.classList.add("error");
    alertMessage += "Username must be filled out\n";
    return false;
  }
  if (username.length > 30) {
    var containerUsername = document.getElementById("container-username");
    containerUsername.classList.add("error");
    alertMessage += "Username must be at most 30 characters long\n";
    return false;
  }
  if (!/[a-zA-Z0-9]/.test(username)) {
    var containerUsername = document.getElementById("container-username");
    containerUsername.classList.add("error");
    alertMessage += "Username must contain at least one letter or number\n";
    return false;
  }
  return true;
}

function checkEmail() {
  var email = document.getElementById("email").value;
  if (
    email
      .trim()
      .match(
        /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/
      ) == null
  ) {
    var containerEmail = document.getElementById("container-email");
    containerEmail.classList.add("error");
    alertMessage += "Email must be valid\n";
    return false;
  }
  return true;
}

function checkPassword() {
  var password = document.getElementById("password").value;

  if (password.length == 0) {
    var containerPassword = document.getElementById("container-password");
    containerPassword.classList.add("error");
    alertMessage += "Password must be filled out";
    return false;
  }
  if (password.length < 8) {
    var containerPassword = document.getElementById("container-password");
    containerPassword.classList.add("error");
    alertMessage += "Password must be at least 8 characters long";
    return false;
  }
  if (password.length > 50) {
    var containerPassword = document.getElementById("container-password");
    containerPassword.classList.add("error");
    alertMessage += "Password must be at most 50 characters long";
    return false;
  }
  if (!/[a-z]/.test(password)) {
    var containerPassword = document.getElementById("container-password");
    containerPassword.classList.add("error");
    alertMessage += "Password must contain at least one lowercase letter";
    return false;
  }
  if (!/[A-Z]/.test(password)) {
    var containerPassword = document.getElementById("container-password");
    containerPassword.classList.add("error");
    alertMessage += "Password must contain at least one uppercase letter";
    return false;
  }
  if (!/[0-9]/.test(password)) {
    var containerPassword = document.getElementById("container-password");
    containerPassword.classList.add("error");
    alertMessage += "Password must contain at least one number";
    return false;
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    var containerPassword = document.getElementById("container-password");
    containerPassword.classList.add("error");
    alertMessage += "Password must contain at least one special character";
    return false;
  }
  return true;
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
