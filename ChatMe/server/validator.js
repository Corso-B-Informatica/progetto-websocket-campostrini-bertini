/*Letters and signs*/
var less = /</g;
var greater = />/g;
var apostrofe = /'/g;
var quotation = /"/g;
var and = /&/g;
var grave = /`/g;
var slash = /\//g;

/*Controlla se l'username è valido*/
function checkUsername(username) {
  if (
    username.length == 0 ||
    username.length > 30 ||
    !/[a-zA-Z0-9]/.test(username) ||
    username.includes("@")
  ) {
    return false;
  }
  return true;
}

/*Controlla se l'email è valida*/
function checkEmail(email) {
  if (
    email
      .trim()
      .match(
        /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/
      ) == null
  ) {
    return false;
  }
  return true;
}

/*Controlla se la password è valida*/
function checkPassword(password) {
  if (
    password.length == 0 ||
    password.length < 8 ||
    password.length > 50 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    return false;
  }
  return true;
}

/*Controlla se il campo remember è valido*/
function checkRemember(remember) {
  if (remember == "true" || remember == "false") {
    return true;
  }
  return false;
}

function checkVerificationCode(code) {
  return code.length == 10 && /^[a-z0-9]+$/.test(code);
}

/*Rimpiazza i caratteri speciali con i rispettivi codici html*/
function validate(data) {
  return data.toString()
    .replace(less, "&lt;")
    .replace(greater, "&gt;")
    .replace(apostrofe, "&#39;")
    .replace(quotation, "&#34;")
    .replace(and, "&#38;")
    .replace(grave, "&#96;")
    .replace(slash, "&#47;")
    .trim();
}

function getErrors(nickname, password, code, check1, check2, check3, check4, check5, check6) {
  var errors = "";

  if (!check1) {
    if (nickname.length == 0) {
      errors += "Username must be filled out\n";
    } else if (nickname.length > 30) {
      errors += "Username must be at most 30 characters long\n";
    } else if (!/[a-zA-Z0-9]/.test(nickname)) {
      errors += "Username must contain at least one letter or number\n";
    } else if (nickname.includes("@")) {
      errors += "Username must not contain '@'\n";
    } else {
      errors += "\n";
    }
  } else {
    errors += "\n";
  }

  if (!check2) {
    errors += "Email must be valid\n";
  } else {
    errors += "\n";
  }

  if (!check3) {
    if (password.length == 0) {
      errors += "Password must be filled out\n";
    } else if (password.length < 8) {
      errors += "Password must be at least 8 characters long\n";
    } else if (password.length > 50) {
      errors += "Password must be at most 50 characters long\n";
    } else if (!/[a-z]/.test(password)) {
      errors += "Password must contain at least one lowercase letter\n";
    } else if (!/[A-Z]/.test(password)) {
      errors += "Password must contain at least one uppercase letter\n";
    } else if (!/[0-9]/.test(password)) {
      errors += "Password must contain at least one number\n";
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors += "Password must contain at least one special character\n";
    } else {
      errors += "\n";
    }
  } else {
    errors += "\n";
  }

  if (!check4) {
    errors += "Remember me must be valid\n";
  } else {
    errors += "\n";
  }

  if (!check5) {
    errors += "PublicKey must be valid\n";
  } else {
    errors += "\n";
  }
  
  if (!check6) {
    if (code.length != 10) {
      errors += "Verification code must be 10 characters long\n";
    } else if (!/^[a-z0-9]+$/.test(code)) {
      errors += "Verification code must contain only letters and numbers\n";
    } else {
      errors += "\n";
    }
  } else {
    errors += "\n";
  }

  return errors;
}

module.exports = {
  checkUsername,
  checkEmail,
  checkPassword,
  checkRemember,
  checkVerificationCode,
  validate,
  getErrors,
};
