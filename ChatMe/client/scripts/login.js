const kM = new keyManager();

if (checkLocalstorageForConfirm()) {
    window.location.href = "../confirm.html";
}

function Login(socket) {
    socket.emit("getPublicKey");
    socket.on("publicKey", async (publicKeyArmored) => {
        kM.generateNewKeyPair("chatMe", "email@email.com", "password123!");
        var checkEmail = checkUE_Email();
        var checkUsername = checkUE_Username();
        var checkPass = checkPassword();
        if(checkEmail && checkPass){
                c_email = await crypto.encrypt(validate(document.getElementById('username').value.toString()), publicKeyArmored);
                c_password = await crypto.encrypt(validate(document.getElementById('password').value.toString()), publicKeyArmored);
                c_RememberMe = await crypto.encrypt(document.getElementById("rememberMe").checked, publicKeyArmored);
                c_publicKey = await crypto.encrypt(kM.getPublicKey(), publicKeyArmored);
                socket.emit("Login", c_email, c_password, c_RememberMe, c_publicKey);
        }
        else if(checkUsername && checkPass){
            c_nickname = await crypto.encrypt(validate(document.getElementById('username').value.toString()), publicKeyArmored);
            c_password = await crypto.encrypt(validate(document.getElementById('password').value.toString()), publicKeyArmored);
            c_RememberMe = await crypto.encrypt(document.getElementById("rememberMe").checked, publicKeyArmored);
            c_publicKey = await crypto.encrypt(kM.getPublicKey(), publicKeyArmored);
            socket.emit("Login", c_nickname, c_password, c_RememberMe, c_publicKey);
        }
    });
}