const crypto = require('./crypto.js');
const database = require('./database.js');
const validator = require('./validator.js');
const emailer = require('./emailer.js');

async function forgotPassword(armored_email, armored_nickname, socket) {
    
    var email = await validator.UltimateValidator(armored_email, 0, true);
    var nickname = await validator.UltimateValidator(armored_nickname, 0, true);

    var check1 = validator.checkUsername(nickname);
    var check2 = validator.checkEmail(email);

    if (check1 || check2) {
        if (await database.existInDatabase(database.Users, nickname, email, "or")) {
            var password = await database.getPassword(database.Users, email, nickname);
            if (email == undefined || email == null) {
                email = await database.getEmail(database.Users, nickname);
            }
            if (email.length == 0) {
                email = await database.getEmail(database.Users, nickname);
            }

            emailer.sendForgotPassword(email, password);

            socket.emit("forgotPasswordSuccess");
        } else if (await database.existInDatabase(database.tempUsers, nickname, email, "or")) {
            var password = await database.getPassword(database.tempUsers, email, nickname);
            if (email == undefined || email == null) {
                email = await database.getEmail(database.tempUsers, nickname);
            }
            if (email.length == 0) {
                email = await database.getEmail(database.tempUsers, nickname);
            }

            emailer.sendForgotPassword(email, password);

            socket.emit("forgotPasswordSuccess");
        }  else {
            socket.emit("forgotPasswordError");
        }
    } else {
        socket.emit("forgotPasswordDataError");
    }
}

module.exports = { forgotPassword };