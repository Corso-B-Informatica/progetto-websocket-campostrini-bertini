var myPrivateKey;
var myPublicKey;

generateKeyPair();

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
async function decrypt(data, privateKey) {
    return await openpgp.decrypt({
        message: await openpgp.readMessage({
            armoredMessage: data,
        }),
        decryptionKeys: await openpgp.decryptKey({
            privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
            passphrase,
        }),
    }).data;
}

/*Genera una chiave AES casuale*/
function generateRandomKey(length) {
    return CryptoJS.lib.WordArray.random(length / 8).toString(CryptoJS.enc.Hex);
}

/*Cripta un messaggio con la chiave AES*/
function encryptAES(data, AESKey) {
    return CryptoJS.AES.encrypt(data, AESKey).toString();
}

/*Decripta un messaggio con la chiave AES*/
function decryptAES(data, AESKey) {
    return CryptoJS.AES.decrypt(data, AESKey).toString(CryptoJS.enc.Utf8);
}

/*Genera una coppia di chiavi RSA*/
async function generateKeyPair(name, email, password) {
    const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'rsa',
        rsaBits: 4096,
        userIDs: [{ name: name, email: email }],
        passphrase: password
    });
    myPublicKey = publicKey;
    myPrivateKey = privateKey;
}

/*Restituisce la chiave pubblica*/
function getMyPublicKey() {
    return myPublicKey;
}

/*Restituisce la chiave privata*/
function getMyPrivateKey() {
    return myPrivateKey;
}
