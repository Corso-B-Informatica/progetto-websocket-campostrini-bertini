class keyManager {
    constructor() {
        this.keyPair = { publicKey: '', privateKey: '', passphrase: '' };
        this.aesKey = '';
    }

    async generateNewKeyPair(nickname, email, password) {
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
        this.keyPair = { publicKey : publicKey, privateKey : privateKey, passphrase  : passphrase };// salva le chiavi nella variabile di istanza
        return this.keyPair;
    }

    setAesKey(key) {
        this.aesKey = key;
        return this.aesKey;
    }
    
    getAesKey() {
        return this.aesKey;
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