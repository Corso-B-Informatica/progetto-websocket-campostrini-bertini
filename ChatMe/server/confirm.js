const crypto = require("./crypto.js");
const database = require("./database.js");
const validator = require('./validator.js');
const emailer = require('./emailer.js');

async function confirmUserViaLink(armored_email, armored_password, armored_nickname, armored_verification_code, armored_rememberMe, publicKeyArmored, crypted_aesKey, socket) {
    const validate_email = await crypto.doubleDecrypt(armored_email);
    const validate_password = await crypto.doubleDecrypt(armored_password);
    const validate_nickname = await crypto.doubleDecrypt(armored_nickname);
    const verification_code = await crypto.doubleDecrypt(armored_verification_code);
    const { data: validate_rememberMe } = await crypto.decrypt(armored_rememberMe, crypto.privateKey);
    const { data: pubKey } = await crypto.decrypt(publicKeyArmored, crypto.privateKey);
    const { data: aesKey } = await crypto.decrypt(crypted_aesKey, crypto.privateKey);

    const email = validator.validate(validate_email);
    const password = validator.validate(validate_password);
    const nickname = validator.validate(validate_nickname);
    const rememberMe = validator.validate(validate_rememberMe);

    var check1 = validator.checkUsername(nickname);
    var check2 = validator.checkEmail(email);
    var check3 = validator.checkPassword(password);
    var check4 = validator.checkRemember(rememberMe);
    var check5 = await crypto.isValid(pubKey);
    var check6 = validator.checkVerificationCode(verification_code);

    if (check1 && check2 && check3 && check4 && check5 && check6) {
        if (await database.existInDatabase(database.tempUsers, nickname, email, "and")) {
            if (await database.hasAttempts(email, password) && await database.getWaitTime(email, password) == 0) {
                if (await database.checkVerificationCode(email, nickname, password, verification_code)) {
                    await database.insertUser(nickname, email, password, aesKey);
                    await database.removeTempUsers(email, password);
                    await database.insertChat(nickname, `{"nickname" : "` + nickname + `", "chats": []}`);

                    var c_rememberMe = await crypto.encrypt(rememberMe, pubKey);
                    var c_row = await crypto.encrypt(`{"nickname" : "` + nickname + `", "chats": []}`, pubKey);
                    var c_aesKey = await crypto.encrypt(aesKey, pubKey);
                    socket.emit("confirmSuccess", c_rememberMe, c_aesKey, c_row);
                } else {
                    await database.increaseConfirmAttempts(email, password);

                    if (!await database.hasAttempts(email, password)) {
                        var wait_time = await database.getWaitTime(email, password)
                        if (wait_time == 0) {
                            await database.resetAttempts(email, password);
                            await database.increaseTimes(email, password);
                            var times = await database.getTimes(email, password);

                            switch (times) {
                                case 1:
                                    await database.setWaitTime(email, password, 600000);
                                    break;
                                case 2:
                                    await database.setWaitTime(email, password, 1800000);
                                    break;
                                case 3:
                                    await database.setWaitTime(email, password, 7200000);
                                    break;
                                case 4:
                                    await database.setWaitTime(email, password, 18000000);
                                    break;
                                case 5:
                                    await database.setWaitTime(email, password, 36000000);
                                    break;
                                default:
                                    database.removeTempUsers(email, password);
                            }
                        }
                    }
                    var message = await crypto.encrypt("Wrong verification code", pubKey);

                    socket.emit("confirmError", message);
                }
            } else {
                console.log("Numero di tentativi superato");

                var time = await database.getWaitTime(email, password);
                var wait_time = await crypto.encrypt(time.toString(), pubKey);

                socket.emit("confirmError", wait_time);
            }
        } else if (await database.existInDatabase(database.Users, nickname, email, "or")) {
            console.log("Utente già confermato");

            const message = await crypto.encrypt("User already confirmed", pubKey);

            socket.emit("confirmError", message);
        } else {
            console.log("Utente non registrato");

            const message = await crypto.encrypt("User not registered", pubKey);

            socket.emit("confirmError", message);
        }
    } else {
        //dati non validi
        console.log("Dati non validi");

        const crypted_check1 = await crypto.encrypt(check1, pubKey);
        const crypted_check2 = await crypto.encrypt(check2, pubKey);
        const crypted_check3 = await crypto.encrypt(check3, pubKey);
        const crypted_check4 = await crypto.encrypt(check4, pubKey);
        const crypted_check5 = await crypto.encrypt(check5, pubKey);
        const crypted_check6 = await crypto.encrypt(check6, pubKey);
        const errors = validator.getErrors(nickname, password, verification_code, check1, check2, check3, check4, check5, check6).split("\n");
        const crypted_data1 = await crypto.encrypt(errors[0], pubKey);
        const crypted_data2 = await crypto.encrypt(errors[1], pubKey);
        const crypted_data3 = await crypto.encrypt(errors[2], pubKey);
        const crypted_data4 = await crypto.encrypt(errors[3], pubKey);
        const crypted_data5 = await crypto.encrypt(errors[4], pubKey);
        const crypted_data6 = await crypto.encrypt(errors[5], pubKey);

        socket.emit("confirmDataError", crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_check5, crypted_check6, crypted_data1, crypted_data2, crypted_data3, crypted_data4, crypted_data5, crypted_data6);
    }
}

async function sendCode(armored_email, armored_nickname, armored_password, publicKeyArmored, socket, method) {
    var validate_email = null;
    var validate_nickname = null;
    var validate_password = null;

    if (method == "input") {
        validate_email = await crypto.decrypt(armored_email, crypto.privateKey).data;
        validate_password = await crypto.decrypt(armored_password, crypto.privateKey).data;
        validate_nickname = await crypto.decrypt(armored_nickname, crypto.privateKey).data;
    } else {
        validate_email = await crypto.doubleDecrypt(armored_email);
        validate_password = await crypto.doubleDecrypt(armored_password);
        validate_nickname = await crypto.doubleDecrypt(armored_nickname);
    }

    const { data: pubKey } = await crypto.decrypt(publicKeyArmored, crypto.privateKey);

    const e_mail = validator.validate(validate_email);
    const password = validator.validate(validate_password);
    const nickname = validator.validate(validate_nickname);

    var check1 = validator.checkUsername(nickname);
    var check2 = validator.checkEmail(e_mail);
    var check3 = validator.checkPassword(password);
    var check4 = await crypto.isValid(pubKey);

    if ((check1 || check2) && check3 && check4) {
        var email = e_mail;
        if (e_mail.length == 0) {
            email = await database.getEmail(nickname);
        }

        if (await database.existInDatabase(database.tempUsers, nickname, email, "or")) {
            if (await database.getWaitTimeCode(email, password) == 0) {
                if (await database.getTimes(email, password) <= 5) {
                    const verification_code = crypto.generateRandomKey(10);

                    database.setVerificationCode(email, password, verification_code);

                    var mail = email;
                    if (email.length == 0) {
                        mail = nickname;
                    }

                    const expiration_time = await database.getExipirationTime(mail, password);

                    var crypted_email = crypto.encryptAES(email);
                    var crypted_password = crypto.encryptAES(password);
                    var crypted_nickname = crypto.encryptAES(nickname);

                    emailer.sendConfirmCodeViaEmail(crypted_email, crypted_nickname, crypted_password, verification_code, expiration_time);

                    var wait_time = await database.getWaitTimeCode(email, password)
                    if (wait_time == 0) {
                        await database.setWaitTimeCode(email, password, 600000);
                    }

                    socket.emit("requestCodeSuccess");
                } else {
                    console.log("Numero di tentativi superato, necessario attendere per richiedere un altro codice");

                    var time = await database.getWaitTimeCode(email, password);
                    var wait_time = await crypto.encrypt(time.toString(), pubKey);

                    socket.emit("requestCodeError", "User deleted");
                }
            } else {
                console.log("Numero di tentativi superato, necessario attendere per richiedere un altro codice");

                var time = await database.getWaitTimeCode(email, password);
                var wait_time = await crypto.encrypt(time.toString(), pubKey);

                socket.emit("requestCodeError", wait_time);
            }
        } else if (await database.existInDatabase(database.Users, nickname, email, "or")) {
            console.log("Utente già confermato");

            const message = await crypto.encrypt("User already confirmed", pubKey);

            socket.emit("requestCodeError", message);
        } else {
            console.log("Utente non registrato");

            const message = await crypto.encrypt("User not registered", pubKey);

            socket.emit("requestCodeError", message);
        }
    } else {
        //dati non validi
        console.log("Dati non validi");

        const crypted_check1 = await crypto.encrypt(check1, pubKey);
        const crypted_check2 = await crypto.encrypt(check2, pubKey);
        const crypted_check3 = await crypto.encrypt(check3, pubKey);
        const crypted_check4 = await crypto.encrypt(check4, pubKey);
        const errors = validator.getErrors(nickname, password, "", check1, check2, check3, true, check4, true).split("\n");
        const crypted_data1 = await crypto.encrypt(errors[0], pubKey);
        const crypted_data2 = await crypto.encrypt(errors[1], pubKey);
        const crypted_data3 = await crypto.encrypt(errors[2], pubKey);
        const crypted_data4 = await crypto.encrypt(errors[4], pubKey);

        socket.emit("requestCodeDataError", crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_data1, crypted_data2, crypted_data3, crypted_data4);
    }
}

async function confirmUserViaCode(armored_email, armored_nickname, armored_password, armored_verification_code, armored_rememberMe, publicKeyArmored, crypted_aesKey, socket, method) {
    var validate_email = null;
    var validate_nickname = null;
    var validate_password = null;

    if (method == "input") {
        validate_email = await crypto.decrypt(armored_email, crypto.privateKey).data;
        validate_password = await crypto.decrypt(armored_password, crypto.privateKey).data;
        validate_nickname = await crypto.decrypt(armored_nickname, crypto.privateKey).data;
    } else {
        validate_email = await crypto.doubleDecrypt(armored_email);
        validate_password = await crypto.doubleDecrypt(armored_password);
        validate_nickname = await crypto.doubleDecrypt(armored_nickname);
    }

    const { data: verification_code } = await crypto.decrypt(armored_verification_code, crypto.privateKey);
    const { data: validate_rememberMe } = await crypto.decrypt(armored_rememberMe, crypto.privateKey);
    const { data: pubKey } = await crypto.decrypt(publicKeyArmored, crypto.privateKey);
    const { data: aesKey } = await crypto.decrypt(crypted_aesKey, crypto.privateKey);

    const email = validator.validate(validate_email);
    const password = validator.validate(validate_password);
    const nickname = validator.validate(validate_nickname);
    const rememberMe = validator.validate(validate_rememberMe);

    var check1 = validator.checkUsername(nickname);
    var check2 = validator.checkEmail(email);
    var check3 = validator.checkPassword(password);
    var check4 = validator.checkRemember(rememberMe);
    var check5 = await crypto.isValid(pubKey);
    var check6 = validator.checkVerificationCode(verification_code);

    if ((check1 || check2) && check3 && check4 && check5 && check6) {
        if (await database.existInDatabase(database.tempUsers, nickname, email, "or")) {
            if (await database.hasAttempts(email, password) && await database.getWaitTime(email, password) == 0) {
                if (await database.checkVerificationCode(email, nickname, password, verification_code)) {
                    await database.insertUser(nickname, email, password, aesKey);
                    await database.removeTempUsers(email, password);
                    await database.insertChat(nickname, `{"nickname" : "` + nickname + `", "chats": []}`);

                    var c_rememberMe = await crypto.encrypt(rememberMe, pubKey);
                    var c_row = await crypto.encrypt(`{"nickname" : "` + nickname + `", "chats": []}`, pubKey);
                    var c_aesKey = await crypto.encrypt(aesKey, pubKey);

                    socket.emit("confirmSuccess", c_rememberMe, c_aesKey, c_row);
                } else {
                    await database.increaseConfirmAttempts(email, password);

                    if (!await database.hasAttempts(email, password)) {
                        var wait_time = await database.getWaitTime(email, password)
                        if (wait_time == 0) {
                            await database.resetAttempts(email, password);
                            await database.increaseTimes(email, password);
                            var times = await database.getTimes(email, password);

                            switch (times) {
                                case 1:
                                    await database.setWaitTime(email, password, 600000);
                                    break;
                                case 2:
                                    await database.setWaitTime(email, password, 1800000);
                                    break;
                                case 3:
                                    await database.setWaitTime(email, password, 7200000);
                                    break;
                                case 4:
                                    await database.setWaitTime(email, password, 18000000);
                                    break;
                                case 5:
                                    await database.setWaitTime(email, password, 36000000);
                                    break;
                                default:
                                    database.removeTempUsers(email, password);
                            }
                        }
                        var message = await crypto.encrypt("Wrong verification code", pubKey);

                        socket.emit("confirmError", message);
                    }
                }
            } else {
                console.log("Numero di tentativi superato");

                var time = await database.getWaitTime(email, password);
                var wait_time = await crypto.encrypt(time.toString(), pubKey);

                socket.emit("confirmError", wait_time);
            }
        } else if (await database.existInDatabase(database.Users, nickname, email, "or")) {
            console.log("Utente già confermato");

            const message = await crypto.encrypt("User already confirmed", pubKey);

            socket.emit("confirmError", message);
        } else {
            console.log("Utente non registrato");

            const message = await crypto.encrypt("User not registered", pubKey);

            socket.emit("confirmError", message);
        }
    } else {
        //dati non validi
        console.log("Dati non validi");

        const crypted_check1 = await crypto.encrypt(check1, pubKey);
        const crypted_check2 = await crypto.encrypt(check2, pubKey);
        const crypted_check3 = await crypto.encrypt(check3, pubKey);
        const crypted_check4 = await crypto.encrypt(check4, pubKey);
        const crypted_check5 = await crypto.encrypt(check5, pubKey);
        const crypted_check6 = await crypto.encrypt(check6, pubKey);
        const errors = validator.getErrors(nickname, password, verification_code, check1, check2, check3, check4, check5, check6).split("\n");
        const crypted_data1 = await crypto.encrypt(errors[0], pubKey);
        const crypted_data2 = await crypto.encrypt(errors[1], pubKey);
        const crypted_data3 = await crypto.encrypt(errors[2], pubKey);
        const crypted_data4 = await crypto.encrypt(errors[3], pubKey);
        const crypted_data5 = await crypto.encrypt(errors[4], pubKey);
        const crypted_data6 = await crypto.encrypt(errors[5], pubKey);

        socket.emit("confirmDataError", crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_check5, crypted_check6, crypted_data1, crypted_data2, crypted_data3, crypted_data4, crypted_data5, crypted_data6);
    }
}

module.exports = {
    confirmUserViaLink,
    sendCode,
    confirmUserViaCode
}