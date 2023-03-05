const crypto = require("./crypto.js");
const database = require("./database.js");
const validator = require('./validator.js');
const emailer = require('./emailer.js');

async function confirmUserViaLink(armored_email, armored_password, armored_nickname, armored_verification_code, armored_rememberMe, publicKeyArmored, crypted_aesKey, socket) {
    var validate_email = "";
    var validate_password = "";
    var validate_nickname = "";
    var verification_code = "";
    var { data: validate_rememberMe } = "";
    var { data: pubKey } = "";
    var { data: aesKey } = "";

    try {
        validate_email = await crypto.doubleDecrypt(armored_email);
    } catch (err) {
        validate_email = "";
    }
    try {
        validate_password = await crypto.doubleDecrypt(armored_password);
    } catch (err) {
        validate_password = "";
    }
    try {
        validate_nickname = await crypto.doubleDecrypt(armored_nickname);
    } catch (err) {
        validate_nickname = "";
    }
    try {
        verification_code = await crypto.doubleDecrypt(armored_verification_code);
    } catch (err) {
        verification_code = "";
    }
    try {
        validate_rememberMe = await crypto.decrypt(armored_rememberMe, crypto.privateKey);
    } catch (err) {
        validate_rememberMe = "";
    }
    try {
        pubKey = await crypto.decrypt(publicKeyArmored, crypto.privateKey);
    } catch (err) {
        pubKey = "";
    }
    try {
        aesKey = await crypto.decrypt(crypted_aesKey, crypto.privateKey);
    } catch (err) {
        aesKey = "";
    }

    const email = validator.validate(validate_email);
    const password = validator.validate(validate_password);
    const nickname = validator.validate(validate_nickname);
    const rememberMe = validate_rememberMe.data == undefined ? "" : validator.validate(validate_rememberMe.data);
    const publicKey = pubKey.data == undefined ? "" : pubKey.data;
    const keyAES = aesKey.data == undefined ? "" : aesKey.data;

    var check1 = validator.checkUsername(nickname);
    var check2 = validator.checkEmail(email);
    var check3 = validator.checkPassword(password);
    var check4 = validator.checkRemember(rememberMe);
    var check5 = await crypto.isValid(publicKey);
    var check6 = validator.checkVerificationCode(verification_code);

    if (check1 && check2 && check3 && check4 && check5 && check6) {
        if (await database.existInDatabase(database.tempUsers, nickname, email, "and")) {
            if (await database.hasAttempts(email, password) && await database.getWaitTime(email, password) == 0) {
                if (await database.checkVerificationCode(email, nickname, password, verification_code)) {
                    await database.insertUser(nickname, email, password, keyAES);
                    await database.removeTempUsers(email, password);
                    await database.insertChat(nickname, `{"nickname" : "` + nickname + `", "chats": []}`);

                    var c_rememberMe = await crypto.encrypt(rememberMe, publicKey);
                    var c_row = await crypto.encrypt(`{"nickname" : "` + nickname + `", "chats": []}`, publicKey);
                    var c_aesKey = await crypto.encrypt(keyAES, publicKey);

                    socket.emit("confirmSuccess", c_rememberMe, c_aesKey, c_row);
                } else {
                    await database.increaseConfirmAttempts(email, password);

                    var message = await crypto.encrypt("Wrong verification code", publicKey);

                    socket.emit("confirmError", message);
                }
            } else {
                if (!await database.hasAttempts(email, password)) {
                    var wait_time = await database.getWaitTime(email, password)
                    if (wait_time == 0) {
                        await database.resetAttempts(email, password);
                        await database.increaseTimes(email, password);
                        var times = await database.getTimes(email, password);

                        switch (times) {
                            case 0:
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

                console.log("Numero di tentativi superato");

                var time = await database.getWaitTime(email, password);
                var wait_time = await crypto.encrypt(time.toString(), publicKey);

                socket.emit("confirmError", wait_time);
            }
        } else if (await database.existInDatabase(database.Users, nickname, email, "or")) {
            console.log("Utente già confermato");

            const message = await crypto.encrypt("User already confirmed", publicKey);

            socket.emit("confirmError", message);
        } else {
            console.log("Utente non registrato");

            const message = await crypto.encrypt("User not registered", publicKey);

            socket.emit("confirmError", message);
        }
    } else {
        //dati non validi
        console.log("Dati non validi");

        const crypted_check1 = await crypto.encrypt(check1, publicKey);
        const crypted_check2 = await crypto.encrypt(check2, publicKey);
        const crypted_check3 = await crypto.encrypt(check3, publicKey);
        const crypted_check4 = await crypto.encrypt(check4, publicKey);
        const crypted_check5 = await crypto.encrypt(check5, publicKey);
        const crypted_check6 = await crypto.encrypt(check6, publicKey);
        const errors = validator.getErrors(nickname, password, verification_code, check1, check2, check3, check4, check5, check6).split("\n");
        const crypted_data1 = await crypto.encrypt(errors[0], publicKey);
        const crypted_data2 = await crypto.encrypt(errors[1], publicKey);
        const crypted_data3 = await crypto.encrypt(errors[2], publicKey);
        const crypted_data4 = await crypto.encrypt(errors[3], publicKey);
        const crypted_data5 = await crypto.encrypt(errors[4], publicKey);
        const crypted_data6 = await crypto.encrypt(errors[5], publicKey);

        socket.emit("confirmDataError", crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_check5, crypted_check6, crypted_data1, crypted_data2, crypted_data3, crypted_data4, crypted_data5, crypted_data6);
    }
}

// fino a qua apposto


async function sendCode(armored_email, armored_nickname, armored_password, publicKeyArmored, socket, method) {
    var { data: pubKey } = "";

    try {
        pubKey = await crypto.decrypt(publicKeyArmored, crypto.privateKey);
    } catch (err) {
        pubKey = "";
    }

    if (method == "input") {
        var { data: validate_email } = "";
        var { data: validate_nickname } = "";
        var { data: validate_password } = "";

        try {
            validate_email = await crypto.decrypt(armored_email, crypto.privateKey);
        } catch (err) {
            validate_email = "";
        }
        try {
            validate_password = await crypto.decrypt(armored_password, crypto.privateKey);
        } catch (err) {
            validate_password = "";
        }
        try {
            validate_nickname = await crypto.decrypt(armored_nickname, crypto.privateKey);
        } catch (err) {
            validate_nickname = "";
        }

        const e_mail = validator.validate(validate_email.data);
        const password = validator.validate(validate_password.data);
        const nickname = validator.validate(validate_nickname.data);

        var check1 = validator.checkUsername(nickname);
        var check2 = validator.checkEmail(e_mail);
        var check3 = validator.checkPassword(password);
        var check4 = await crypto.isValid(pubKey.data);

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
                            var times = await database.getTimes(email, password);

                            switch (times) {
                                case 0:
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

                        socket.emit("requestCodeSuccess");
                    } else {
                        console.log("Numero di tentativi superato, necessario attendere per richiedere un altro codice");

                        var time = await database.getWaitTimeCode(email, password);
                        var wait_time = await crypto.encrypt(time.toString(), pubKey.data);

                        socket.emit("requestCodeError", "User deleted");
                    }
                } else {
                    console.log("Numero di tentativi superato, necessario attendere per richiedere un altro codice");

                    var time = await database.getWaitTimeCode(email, password);
                    var wait_time = await crypto.encrypt(time.toString(), pubKey.data);

                    socket.emit("requestCodeError", wait_time);
                }
            } else if (await database.existInDatabase(database.Users, nickname, email, "or")) {
                console.log("Utente già confermato");

                const message = await crypto.encrypt("User already confirmed", pubKey.data);

                socket.emit("requestCodeError", message);
            } else {
                console.log("Utente non registrato");

                const message = await crypto.encrypt("User not registered", pubKey.data);

                socket.emit("requestCodeError", message);
            }
        } else {
            //dati non validi
            console.log("Dati non validi");

            const crypted_check1 = await crypto.encrypt(check1, pubKey.data);
            const crypted_check2 = await crypto.encrypt(check2, pubKey.data);
            const crypted_check3 = await crypto.encrypt(check3, pubKey.data);
            const crypted_check4 = await crypto.encrypt(check4, pubKey.data);
            const errors = validator.getErrors(nickname, password, "", check1, check2, check3, true, check4, true).split("\n");
            const crypted_data1 = await crypto.encrypt(errors[0], pubKey.data);
            const crypted_data2 = await crypto.encrypt(errors[1], pubKey.data);
            const crypted_data3 = await crypto.encrypt(errors[2], pubKey.data);
            const crypted_data4 = await crypto.encrypt(errors[4], pubKey.data);

            socket.emit("requestCodeDataError", crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_data1, crypted_data2, crypted_data3, crypted_data4);
        }
    } else {
        var validate_email = "";
        var validate_nickname = "";
        var validate_password = "";

        try {
            validate_email = await crypto.doubleDecrypt(armored_email);
        } catch (err) {
            validate_email = "";
        }
        try {
            validate_password = await crypto.doubleDecrypt(armored_password);
        } catch (err) {
            validate_password = "";
        }
        try {
            validate_nickname = await crypto.doubleDecrypt(armored_nickname);
        } catch (err) {
            validate_nickname = "";
        }

        const e_mail = validator.validate(validate_email);
        const password = validator.validate(validate_password);
        const nickname = validator.validate(validate_nickname);

        var check1 = validator.checkUsername(nickname);
        var check2 = validator.checkEmail(e_mail);
        var check3 = validator.checkPassword(password);
        var check4 = await crypto.isValid(pubKey.data);

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
                            var times = await database.getTimes(email, password);

                            switch (times) {
                                case 0:
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

                        socket.emit("requestCodeSuccess");
                    } else {
                        console.log("Numero di tentativi superato, necessario attendere per richiedere un altro codice");

                        var time = await database.getWaitTimeCode(email, password);
                        var wait_time = await crypto.encrypt(time.toString(), pubKey.data);

                        socket.emit("requestCodeError", "User deleted");
                    }
                } else {
                    console.log("Numero di tentativi superato, necessario attendere per richiedere un altro codice");

                    var time = await database.getWaitTimeCode(email, password);
                    var wait_time = await crypto.encrypt(time.toString(), pubKey.data);

                    socket.emit("requestCodeError", wait_time);
                }
            } else if (await database.existInDatabase(database.Users, nickname, email, "or")) {
                console.log("Utente già confermato");

                const message = await crypto.encrypt("User already confirmed", pubKey.data);

                socket.emit("requestCodeError", message);
            } else {
                console.log("Utente non registrato");

                const message = await crypto.encrypt("User not registered", pubKey.data);

                socket.emit("requestCodeError", message);
            }
        } else {
            //dati non validi
            console.log("Dati non validi");

            const crypted_check1 = await crypto.encrypt(check1, pubKey.data);
            const crypted_check2 = await crypto.encrypt(check2, pubKey.data);
            const crypted_check3 = await crypto.encrypt(check3, pubKey.data);
            const crypted_check4 = await crypto.encrypt(check4, pubKey.data);
            const errors = validator.getErrors(nickname, password, "", check1, check2, check3, true, check4, true).split("\n");
            const crypted_data1 = await crypto.encrypt(errors[0], pubKey.data);
            const crypted_data2 = await crypto.encrypt(errors[1], pubKey.data);
            const crypted_data3 = await crypto.encrypt(errors[2], pubKey.data);
            const crypted_data4 = await crypto.encrypt(errors[4], pubKey.data);

            socket.emit("requestCodeDataError", crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_data1, crypted_data2, crypted_data3, crypted_data4);
        }
    }
}

async function confirmUserViaCode(armored_email, armored_nickname, armored_password, armored_verification_code, armored_rememberMe, publicKeyArmored, crypted_aesKey, socket, method) {
    var { data: verification_code } = "";
    var { data: validate_rememberMe } = "";
    var { data: pubKey } = "";
    var { data: aesKey } = "";

    try {
        verification_code = await crypto.decrypt(armored_verification_code, crypto.privateKey);
    } catch (err) {
        verification_code = "";
    }
    try {
        validate_rememberMe = await crypto.decrypt(armored_rememberMe, crypto.privateKey);
    } catch (err) {
        validate_rememberMe = "";
    }
    try {
        pubKey = await crypto.decrypt(publicKeyArmored, crypto.privateKey);
    } catch (err) {
        pubKey = "";
    }
    try {
        aesKey = await crypto.decrypt(crypted_aesKey, crypto.privateKey);
    } catch (err) {
        aesKey = "";
    }

    if (method == "input") {
        var { data: validate_email } = "";
        var { data: validate_password } = "";
        var { data: validate_nickname } = "";

        try {
            validate_email = await crypto.decrypt(armored_email, crypto.privateKey);
        } catch (err) {
            validate_email = "";
        }
        try {
            validate_password = await crypto.decrypt(armored_password, crypto.privateKey);
        } catch (err) {
            validate_password = "";
        }
        try {
            validate_nickname = await crypto.decrypt(armored_nickname, crypto.privateKey);
        } catch (err) {
            validate_nickname = "";
        }

        const email = validator.validate(validate_email.data);
        const password = validator.validate(validate_password.data);
        const nickname = validator.validate(validate_nickname.data);
        const rememberMe = validator.validate(validate_rememberMe.data);

        var check1 = validator.checkUsername(nickname);
        var check2 = validator.checkEmail(email);
        var check3 = validator.checkPassword(password);
        var check4 = validator.checkRemember(rememberMe);
        var check5 = await crypto.isValid(pubKey.data);
        var check6 = validator.checkVerificationCode(verification_code.data);

        if ((check1 || check2) && check3 && check4 && check5 && check6) {
            if (await database.existInDatabase(database.tempUsers, nickname, email, "or")) {
                if (await database.hasAttempts(email, password) && await database.getWaitTime(email, password) == 0) {
                    if (await database.checkVerificationCode(email, nickname, password, verification_code.data)) {
                        console.log("Utente confermato");

                        await database.insertUser(nickname, email, password, aesKey.data);
                        await database.removeTempUsers(email, password);
                        await database.insertChat(nickname, `{"nickname" : "` + nickname + `", "chats": []}`);

                        var c_rememberMe = await crypto.encrypt(rememberMe, pubKey.data);
                        var c_row = await crypto.encrypt(`{"nickname" : "` + nickname + `", "chats": []}`, pubKey.data);
                        var c_aesKey = await crypto.encrypt(aesKey.data, pubKey.data);

                        socket.emit("confirmSuccess", c_rememberMe, c_aesKey, c_row);
                    } else {
                        console.log("Codice di verifica errato");

                        await database.increaseConfirmAttempts(email, password);

                        var message = await crypto.encrypt("Wrong verification code", pubKey.data);

                        socket.emit("confirmError", message);
                    }
                } else {
                    console.log("Impossibile testare un altro codice");

                    if (!await database.hasAttempts(email, password)) {
                        console.log("Numero di tentativi superato, necessario attendere per richiedere un altro codice -> verify via code");

                        var wait_time = await database.getWaitTime(email, password)
                        if (wait_time == 0) {
                            await database.resetAttempts(email, password);
                            await database.increaseTimes(email, password);
                            var times = await database.getTimes(email, password);

                            switch (times) {
                                case 0:
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
                                    socket.emit("confirmError", "User deleted");
                                    break;
                            }
                        }
                    }

                    var time = await database.getWaitTime(email, password);
                    var wait_time = await crypto.encrypt(time.toString(), pubKey.data);

                    socket.emit("confirmError", wait_time);
                }
            } else if (await database.existInDatabase(database.Users, nickname, email, "or")) {
                console.log("Utente già confermato");

                const message = await crypto.encrypt("User already confirmed", pubKey.data);

                socket.emit("confirmError", message);
            } else {
                console.log("Utente non registrato");

                const message = await crypto.encrypt("User not registered", pubKey.data);

                socket.emit("confirmError", message);
            }
        } else {
            //dati non validi
            console.log("Dati non validi");

            const crypted_check1 = await crypto.encrypt(check1, pubKey.data);
            const crypted_check2 = await crypto.encrypt(check2, pubKey.data);
            const crypted_check3 = await crypto.encrypt(check3, pubKey.data);
            const crypted_check4 = await crypto.encrypt(check4, pubKey.data);
            const crypted_check5 = await crypto.encrypt(check5, pubKey.data);
            const crypted_check6 = await crypto.encrypt(check6, pubKey.data);
            const errors = validator.getErrors(nickname, password, verification_code.data, check1, check2, check3, check4, check5, check6).split("\n");
            const crypted_data1 = await crypto.encrypt(errors[0], pubKey.data);
            const crypted_data2 = await crypto.encrypt(errors[1], pubKey.data);
            const crypted_data3 = await crypto.encrypt(errors[2], pubKey.data);
            const crypted_data4 = await crypto.encrypt(errors[3], pubKey.data);
            const crypted_data5 = await crypto.encrypt(errors[4], pubKey.data);
            const crypted_data6 = await crypto.encrypt(errors[5], pubKey.data);

            socket.emit("confirmDataError", crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_check5, crypted_check6, crypted_data1, crypted_data2, crypted_data3, crypted_data4, crypted_data5, crypted_data6);
        }
    } else {
        var validate_email = "";
        var validate_password = "";
        var validate_nickname = "";

        try {
            validate_email = await crypto.doubleDecrypt(armored_email);
        } catch (err) {
            validate_email = "";
        }
        try {
            validate_password = await crypto.doubleDecrypt(armored_password);
        } catch (err) {
            validate_password = "";
        }
        try {
            validate_nickname = await crypto.doubleDecrypt(armored_nickname);
        } catch (err) {
            validate_nickname = "";
        }

        const email = validator.validate(validate_email);
        const password = validator.validate(validate_password);
        const nickname = validator.validate(validate_nickname);
        const rememberMe = validator.validate(validate_rememberMe.data);

        var check1 = validator.checkUsername(nickname);
        var check2 = validator.checkEmail(email);
        var check3 = validator.checkPassword(password);
        var check4 = validator.checkRemember(rememberMe);
        var check5 = await crypto.isValid(pubKey.data);
        var check6 = validator.checkVerificationCode(verification_code.data);

        if ((check1 || check2) && check3 && check4 && check5 && check6) {
            if (await database.existInDatabase(database.tempUsers, nickname, email, "or")) {
                if (await database.hasAttempts(email, password) && await database.getWaitTime(email, password) == 0) {
                    if (await database.checkVerificationCode(email, nickname, password, verification_code.data)) {
                        console.log("Utente confermato");

                        await database.insertUser(nickname, email, password, aesKey.data);
                        await database.removeTempUsers(email, password);
                        await database.insertChat(nickname, `{"nickname" : "` + nickname + `", "chats": []}`);

                        var c_rememberMe = await crypto.encrypt(rememberMe, pubKey.data);
                        var c_row = await crypto.encrypt(`{"nickname" : "` + nickname + `", "chats": []}`, pubKey.data);
                        var c_aesKey = await crypto.encrypt(aesKey.data, pubKey.data);

                        socket.emit("confirmSuccess", c_rememberMe, c_aesKey, c_row);
                    } else {
                        console.log("Codice di verifica errato");

                        await database.increaseConfirmAttempts(email, password);

                        var message = await crypto.encrypt("Wrong verification code", pubKey.data);

                        socket.emit("confirmError", message);
                    }
                } else {
                    console.log("Impossibile testare un altro codice");

                    if (!await database.hasAttempts(email, password)) {
                        console.log("Numero di tentativi superato, necessario attendere per richiedere un altro codice -> verify via code");

                        var wait_time = await database.getWaitTime(email, password)
                        if (wait_time == 0) {
                            await database.resetAttempts(email, password);
                            await database.increaseTimes(email, password);
                            var times = await database.getTimes(email, password);

                            switch (times) {
                                case 0:
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
                                    socket.emit("confirmError", "User deleted");
                                    break;
                            }
                        }
                    }

                    var time = await database.getWaitTime(email, password);
                    var wait_time = await crypto.encrypt(time.toString(), pubKey.data);

                    socket.emit("confirmError", wait_time);
                }
            } else if (await database.existInDatabase(database.Users, nickname, email, "or")) {
                console.log("Utente già confermato");

                const message = await crypto.encrypt("User already confirmed", pubKey.data);

                socket.emit("confirmError", message);
            } else {
                console.log("Utente non registrato");

                const message = await crypto.encrypt("User not registered", pubKey.data);

                socket.emit("confirmError", message);
            }
        } else {
            //dati non validi
            console.log("Dati non validi");

            const crypted_check1 = await crypto.encrypt(check1.toString(), pubKey.data);
            const crypted_check2 = await crypto.encrypt(check2.toString(), pubKey.data);
            const crypted_check3 = await crypto.encrypt(check3.toString(), pubKey.data);
            const crypted_check4 = await crypto.encrypt(check4.toString(), pubKey.data);
            const crypted_check5 = await crypto.encrypt(check5.toString(), pubKey.data);
            const crypted_check6 = await crypto.encrypt(check6.toString(), pubKey.data);
            const errors = validator.getErrors(nickname, password, verification_code.data, check1.toString(), check2.toString(), check3.toString(), check4.toString(), check5.toString(), check6.toString()).split("\n");
            const crypted_data1 = await crypto.encrypt(errors[0], pubKey.data);
            const crypted_data2 = await crypto.encrypt(errors[1], pubKey.data);
            const crypted_data3 = await crypto.encrypt(errors[2], pubKey.data);
            const crypted_data4 = await crypto.encrypt(errors[3], pubKey.data);
            const crypted_data5 = await crypto.encrypt(errors[4], pubKey.data);
            const crypted_data6 = await crypto.encrypt(errors[5], pubKey.data);

            socket.emit("confirmDataError", crypted_check1, crypted_check2, crypted_check3, crypted_check4, crypted_check5, crypted_check6, crypted_data1, crypted_data2, crypted_data3, crypted_data4, crypted_data5, crypted_data6);
        }
    }
}

module.exports = {
    confirmUserViaLink,
    sendCode,
    confirmUserViaCode
}