//openpgp non viene importato
var socket = io();
(async () => {
  const { privateKey, publicKey } = await openpgp.generateKey({
    type: "rsa", // Type of the key
    rsaBits: 4096, // RSA key size (defaults to 4096 bits)
    userIDs: [
      {
        name: document.getElementById("username").value,
        email: document.getElementById("email").value,
      },
    ], // you can pass multiple user IDs
    passphrase: document.getElementById("password").value, // protects the private key
  });
  console.log(privateKey);
  console.log(publicKey);
})();

function register() {
  let username = document.getElementById("username").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;
  console.log("ssa");
  socket.emit("register", username, email, password, publicKey);
}
