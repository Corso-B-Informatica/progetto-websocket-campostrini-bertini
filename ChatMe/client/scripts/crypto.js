/*Cripta un messaggio con la chiave pubblica*/
async function encrypt(data, publicKey) {
    return await openpgp.encrypt({
        message: await openpgp.createMessage({
            text: data,
        }),
        encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
    });
}

/*Decripta un messaggio con la chiave privata*/
async function decrypt(data, privateKey, passphrase) {
    return await openpgp.decrypt({
        message: await openpgp.readMessage({
            armoredMessage: data,
        }),
        decryptionKeys: await openpgp.decryptKey({
            privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
            passphrase,
        }),
    });
}

/*Genera una chiave AES casuale*/
function generateRandomKey(length) {
    return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Hex);
}

/*Cripta un messaggio con la chiave AES*/
function encryptAES(data, AESKey) {
    return CryptoJS.AES.encrypt(data, AESKey).toString();
}

/*Decripta un messaggio con la chiave AES*/
function decryptAES(data, AESKey) {
    return CryptoJS.AES.decrypt(data, AESKey).toString(CryptoJS.enc.Utf8);
}

/*Controlla se la chiave è valida*/
async function isValid(key) {
    return await openpgp.readKey({ armoredKey: key })
        .then((key) => {
            return true;
        })
        .catch((err) => {
            return false;
        });
}