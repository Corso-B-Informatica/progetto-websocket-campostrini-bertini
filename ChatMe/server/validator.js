const crypto = require("./crypto.js");

/*Letters and signs*/
/*var less = "<";
var greater = ">";
var apostrofe = "'";
var quotation = '"';
var and = "&";
var grave = "`";
var slash = "/";
var backslash = '\\'
var equals = "=";
var dot = ".";
var openParenthesis = "(";
var closeParenthesis = ")";
var question = "?";
var comma = ",";
var openBracket = "[";
var closeBracket = "]";
var openCurlyBracket = "{";
var closeCurlyBracket = "}";*/

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
/*function validate(data) {
  return data
    .replace(less, "&lt;")
    .replace(greater, "&gt;")
    .replace(apostrofe, "&apos;")
    .replace(quotation, "&quot;")
    .replace(and, "&amp;")
    .replace(grave, "&grave;")
    .replace(slash, "&sol;")
    .replace(backslash, "&bsol;")
    .replace(equals, "&equals;")
    .replace(dot, "&period;")
    .replace(openParenthesis, "&lpar;")
    .replace(closeParenthesis, "&rpar;")
    .replace(question, "&quest;")
    .replace(comma, "&comma;")
    .replace(openBracket, "&lbrack;")
    .replace(closeBracket, "&rbrack")
    .replace(openCurlyBracket, "&lbrace;")
    .replace(closeCurlyBracket, "&rbrace;")
    .trim();
}*/


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

async function UltimateValidator(data, decryptType, validation) {
  var validate_data = "";
  if (decryptType == 0) {
    try {
      validate_data = await crypto.decrypt(data, crypto.privateKey);
    } catch (err) {
      validate_data = "";
    }
  } else {
    try {
      validate_data = await crypto.doubleDecrypt(data);
    } catch (err) {
      validate_data = "";
    }
  }
  return new Promise((resolve, reject) => {
    //abbiamo momentaneamente tolto la validazione anti injection dei dati per evitare problemi con i dati
    if (validation) {
      if (decryptType == 0) {
        resolve(validate_data.data == undefined ? "" : validate_data.data);
      } else if (decryptType == 1) {
        resolve(validate_data == undefined ? "" : validate_data);
      } else {
        reject("Unknown error");
      }
    } else {
      if (decryptType == 0) {
        resolve(validate_data.data == undefined ? "" : validate_data.data);
      } else if (decryptType == 1) {
        resolve(validate_data == undefined ? "" : validate_data);
      } else {
        reject("Unknown error");
      }
    }
  });
};

module.exports = {
  UltimateValidator,
  checkUsername,
  checkEmail,
  checkPassword,
  checkRemember,
  checkVerificationCode,
  getErrors,
};
