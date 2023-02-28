class keyManager {
    constructor() {
        this.keyPair = null;
    }

    async generateKeyPair(nickname, email, password) {
        const generatedKeyPair = await openpgp.generateKey({
            type: 'ecc', // Type of the key, defaults to ECC
            curve: 'curve25519', // ECC curve name, defaults to curve25519
            userIDs: [{ name: nickname, email: email }], // you can pass multiple user IDs
            passphrase: password, // protects the private key
            format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
        });
        const publicKey = generatedKeyPair.publicKey;
        const privateKey = generatedKeyPair.privateKey;
        const passphrase = password;
        this.keyPair = { publicKey, privateKey, passphrase };// salva le chiavi nella variabile di istanza
        return this.keyPair;
    }

    getPublicKey() {
        return this.keyPair.publicKey;
    }

    getPrivateKey() {
        return this.keyPair.privateKey;
    }

    getPassphrase() {
        return this.keyPair.passphrase;
    }
}