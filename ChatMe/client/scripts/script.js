var socket = io();


(async () => {
  const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
      type: 'ecc', 
      curve: 'curve25519',
      userIDs: [{ name: document.getElementById("nickname").value, email: document.getElementById("email").value }], 
      passphrase: document.getElementById("password").value, 
      format: 'armored' 
  });

  console.log(privateKey);
  console.log(publicKey);      
  console.log(revocationCertificate);
})();


function register() {
  let nickname = document.getElementById("nickname").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;
  
  socket.emit("register", nickname, email, password);
}
socket.on("register", (nome) => {
  let paragrafo = document.getElementById("paragrafo");
  paragrafo.innerText += " " + nome;
});

socket.on("confirm", (msg) => {
  let registration = document.getElementById("register");
  registration.innerText = msg;
});

socket.on("newuser", (msg) => {
  let users = document.getElementById("users");
  users.innerText = msg;
});

socket.on("nicknames", (nicknames) => {
  let lista = document.getElementById("nicknames");
  lista.innerHTML = "";
  for (let i = 0; i < nicknames.length; i++) {
    let nickname = nicknames[i];
    let item = document.createElement("li");
    item.innerHTML = nickname;
    lista.appendChild(item);
  }
});
