const CryptoJS = require("crypto-js");
const openpgp = require("openpgp");

/*Public Key*/
const publicKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEY+OA6hYJKwYBBAHaRw8BAQdAE2OJacHeP3Is1YPbia1aaWRKO3o9qQ1m
Td8JpQiJ0F3NG1BpYXJkaSA8cGlhcmRpQGV4YW1wbGUuY29tPsKMBBAWCgA+
BQJj44DqBAsJBwgJEAIDKbBMPQe/AxUICgQWAAIBAhkBAhsDAh4BFiEEVYAB
PTDZBtd6GDW1AgMpsEw9B78AAL2zAP9mMnKN+zeLmY6btip8EBttEoW07LFd
vKQtPod6Bg1rRwEA/m5J29C5tA4d877+k8c5oU+MFaL7/rG4LGymPZEGFAbO
OARj44DqEgorBgEEAZdVAQUBAQdArxxEvRZtPAYTB+J3sJFsQ9Ds2LpYWLfV
FuGguzJgq2MDAQgHwngEGBYIACoFAmPjgOoJEAIDKbBMPQe/AhsMFiEEVYAB
PTDZBtd6GDW1AgMpsEw9B78AAAGsAQDcLYVpeMmgWue/mAHVzWZa9SYuIVXf
iYNalGO79il0RwEA7UR489bRj/7ksSnM0lQOkhuxJVJihThnmTi7kNEjnw0=
=99ZC
-----END PGP PUBLIC KEY BLOCK-----`;

/*Private Key*/
const privateKey = `-----BEGIN PGP PRIVATE KEY BLOCK-----

xYYEY+OA6hYJKwYBBAHaRw8BAQdAE2OJacHeP3Is1YPbia1aaWRKO3o9qQ1m
Td8JpQiJ0F3+CQMILXavJP7Dgv/g+0TSGXPuCL5sGl1eArmEr5Ydg5MNMU9n
aYBswVesaGQIUUo6MwiWQ8ib88+2pth0ZQ9EedKxwky/qdd82MxQqlpKcWEb
Lc0bUGlhcmRpIDxwaWFyZGlAZXhhbXBsZS5jb20+wowEEBYKAD4FAmPjgOoE
CwkHCAkQAgMpsEw9B78DFQgKBBYAAgECGQECGwMCHgEWIQRVgAE9MNkG13oY
NbUCAymwTD0HvwAAvbMA/2Yyco37N4uZjpu2KnwQG20ShbTssV28pC0+h3oG
DWtHAQD+bknb0Lm0Dh3zvv6TxzmhT4wVovv+sbgsbKY9kQYUBseLBGPjgOoS
CisGAQQBl1UBBQEBB0CvHES9Fm08BhMH4newkWxD0OzYulhYt9UW4aC7MmCr
YwMBCAf+CQMIDk90TM9eDcbgh91DAFhL/oS94DiGXAaAZgiEYSCxKQ6nkWHr
g0m5EUGBARcv7ecF+5q77aFnEe2ggrphzPWNd7fQmxNzDPMknYK5ZW6FmcJ4
BBgWCAAqBQJj44DqCRACAymwTD0HvwIbDBYhBFWAAT0w2QbXehg1tQIDKbBM
PQe/AAABrAEA3C2FaXjJoFrnv5gB1c1mWvUmLiFV34mDWpRju/YpdEcBAO1E
ePPW0Y/+5LEpzNJUDpIbsSVSYoU4Z5k4u5DRI58N
=mJgw
-----END PGP PRIVATE KEY BLOCK-----`;

/*Passphrase*/
var passphrase =
  'fsrL[yhRbtlES_rOyaYkaz!;XTiC;),w4V.P]zYEp<F@iLTWRk.)Ij`GZ}$u+>92]H]OA}B.)lCfi}tdrZ25cT-Mb~z*NxVH;Yens!OoEj=Nl&TCfzSp0#akDv>{ik%_HC7wX-[bXH<VRMa2Qb$0v~{(2B<lCA<)~X}AcTmp<aCXC7!d>a|pMC.U{;(MmE@X"a7bn/.R=9P)_E[yB0gqgQy(~#RzPLNuxURh@yK(98Mbvo59Tl9ZhNZBAOFnjN9%#dQBv2=p-)IFXHE2p.mP;a+7Ro`_me$!}-w$O3I0Go;z%B0bD7+k=kaWS"^W"xhuvQ{1#=F(jX-1ID(,NU|(=;=a>f,]8%osRE<{p9@.$H-CJh4dv>zT2!lb8/6|hpbFtl]ZQ(dr[X6h@BLc`z|2wHy(@xJ+3g++Sm)Is~?K^-*0!AtSYprX?l6!6~tcxOI:-zyAYib:"C]]32Dd5!v2U7G1t&iksW7g4=xH)6./]$)J[WEY2!u$MjW#gn';

/*AES Key*/
var AESKey =
  "5ef16edae3176232956802e6e138b2df3c20697b71bfba0793e7113a7644c80e63398b6def71f214b96a4c39722d899916830c3d1455f5ad19ceb92473a4210fa67dd4976670c5b42688aa7f04c3adcffb55372a5cdd051d6fc793a8c5f98a2d49e3d4b0a889c155f78da776aaeed10b10d0eff209840147e1bfb7c22f3ed3ef8673e91455f6dcde04db561826cd6e896aa2505224454a001b258e9ee702bcbffa220cc90c0dad4b6883cbdfbce664c957de1346883a2e02d7d6410d87ef73ea6a88e7fab818a4af237deeb7167cdb09766135c61ae357277cbf522ccee5052c1fc5a2025e9d3115f87e3c5ef782eca8659f8627ec08ad2fb9e36e13f84db447";

/*Cripta un messaggio con la chiave pubblica*/
async function encrypt(data, key) {
  return await openpgp.encrypt({
    message: await openpgp.createMessage({
      text: data,
    }),
    encryptionKeys: await openpgp.readKey({ armoredKey: key }),
  });
}

/*Decripta un messaggio con la chiave privata*/
async function decrypt(data, key) {
  return await openpgp.decrypt({
    message: await openpgp.readMessage({
      armoredMessage: data,
    }),
    decryptionKeys: await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: key }),
      passphrase,
    }),
  });
}

/*Cripta un messaggio con la chiave AES*/
function encryptAES(data) {
  return CryptoJS.AES.encrypt(data, AESKey).toString();
}

/*Genera una chiave AES casuale*/
function generateRandomKey(length) {
  return CryptoJS.lib.WordArray.random(length / 2).toString();
}

/*Decripta un messaggio con la chiave AES*/
function decryptAES(data) {
  return CryptoJS.AES.decrypt(data, AESKey).toString(CryptoJS.enc.Utf8);
}

/*Effettua una doppia decriptazione*/
async function doubleDecrypt(data) {
  const { data: message } = await decrypt(data, privateKey);
  return decryptAES(message);
}

module.exports = {
  encrypt,
  decrypt,
  encryptAES,
  decryptAES,
  doubleDecrypt,
  generateRandomKey,
  publicKey,
  privateKey,
  passphrase,
};
