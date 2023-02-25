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

module.exports = { checkUsername, checkEmail, checkPassword };
