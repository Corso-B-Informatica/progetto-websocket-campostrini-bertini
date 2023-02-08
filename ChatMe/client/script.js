

var socket = io();

socket.on("welcome", (msg) => {
  let paragrafo = document.getElementById("paragrafo");
  paragrafo.innerText = msg;
});

function register() {
  let nick = document.getElementById("nome").value;
  socket.emit("register", nick);
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
