const crypto = require('./crypto.js');
const database = require('./database.js');
const validator = require('./validator.js');
const emailer = require('./emailer.js');

async function forgotPassword(armored_email, armored_nickname, socket) {
    var { data: validate_email } = "";
    var { data: validate_nickname } = "";

    try {
        validate_email = await crypto.decrypt(armored_email, crypto.privateKey);
    } catch (err) {
        validate_email = "";
    }
    try {
        validate_nickname = await crypto.decrypt(armored_nickname, crypto.privateKey);
    } catch (err) {
        validate_nickname = "";
    }

    const email = validate_email.data == undefined ? "" : validator.validate(validate_email.data);
    const nickname = validate_nickname.data == undefined ? "" : validator.validate(validate_nickname.data);

    var check1 = validator.checkUsername(nickname);
    var check2 = validator.checkEmail(email);

    if (check1 || check2) {
        if (await database.existInDatabase(database.Users, nickname, email, "or")) {
            var password = await database.getPassword(database.Users, email, nickname);
            var e_mail = email;

            if (e_mail.length == 0) {
                e_mail = await database.getEmail(database.Users, nickname);
            }

            emailer.sendForgotPassword(e_mail, password);

            socket.emit("forgotPasswordSuccess");
        } else if (await database.existInDatabase(database.tempUsers, nickname, email, "or")) {
            var password = await database.getPassword(database.tempUsers, email, nickname);
            var e_mail = email;

            if (e_mail.length == 0) {
                e_mail = await database.getEmail(database.tempUsers, nickname);
            }

            emailer.sendForgotPassword(e_mail, password);

            socket.emit("forgotPasswordSuccess");
        }  else {
            socket.emit("forgotPasswordError");
        }
    } else {
        socket.emit("forgotPasswordDataError");
    }
}

module.exports = { forgotPassword };