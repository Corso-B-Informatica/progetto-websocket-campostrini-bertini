const express = require("express");
const config = require("./config.js");
const socketio = require("socket.io");
const openpgp = require("openpgp");


const app = express();
app.use(express.static("chat"));
(async () => {
  const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
      type: 'ecc', 
      curve: 'curve25519',
      userIDs: [{ name: 'Piardi', email: 'piardi@example.com' }], // you can pass multiple user IDs
      passphrase: 'fsrL[yhRbtlES_rOyaYkaz!;XTiC;),w4V.P]zYEp<F@iLTWRk.)Ij`GZ}$u+>92]H]OA}B\.)lCfi}tdrZ25cT-Mb~z*NxVH;Yens!OoEj=Nl&TCfzSp0#akDv>{ik%_HC7wX-[bXH<VRMa2Qb$0v~{(2B<lCA<)~X}AcTmp\<aCXC7!d>a|pMC.U{;(MmE@X"a7bn/.R=9P)_E[yB0gqgQy(~#RzPLNuxURh@yK(98Mbvo59Tl9ZhNZBAOFnjN9%#dQBv2=p-)IFXHE2p.mP;a+7Ro`_me$!}-w$O3I0Go;z%B0bD7+k=kaWS"^W"xhuvQ{1#=F(jX-1ID(,NU|(=;=a>f,]8%osRE<{p9@.$\H-CJh4dv>\zT2!lb8/6|hpbFtl]ZQ(dr[X6h@BLc`z|2wHy(@xJ+3g++Sm)Is~?K\^-*0!AtSYprX?l6!6\~tcxOI:-zyAYib:"C]]32Dd5!v2U7G1t&iksW7g4=xH)6./]$)J[WEY2!u$MjW#gn', // protects the private key
      format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
  });

  console.log(privateKey);
  console.log(publicKey);      
  console.log(revocationCertificate);
})();
const server = app.listen(config.port, () => {
  console.log("Server in ascolto sulla porta " + config.port);
});

const io = socketio(server);
// var nicknames = [];
// io.on("connection", (socket) => {
//   socket.on("register", (nome) => {
//     console.log("client connesso");
//     socket.nome = nome;
//     console.log("Client connesso:", socket.nome);
//     socket.emit(
//       "confirm",
//       "Registrazione avvenuta con successo. Benvenuto " + socket.nome
//     );
//     socket.broadcast.emit("newuser", socket.nome + " si è unito alla chat.");
//     io.emit("newuser", socket.nome);
      
//   });
// });