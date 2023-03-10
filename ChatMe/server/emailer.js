const nodemailer = require("nodemailer");
const crypto = require("./crypto.js");

/*Invia il codice di conferma all'utente tramite email*/
function sendConfirmCodeViaEmail(email, nickname, password, code, expiration_time, link) {
  // Crea un trasportatore SMTP
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "service.chatme@gmail.com",
      pass: "qfdimntkltaapvcv",
    },
  });

  const decrypted_email = crypto.decryptAES(email);

  const crypted_code = crypto.encryptAES(code);
  //l url va cambiato a seconda della persona che lo usa
  const url =
    link + 
    "/confirm.html#email=" +
    email +
    "&nickname=" +
    nickname +
    "&password=" +
    password +
    "&code=" +
    crypted_code;

  const mail =
    `<!DOCTYPE html>
<html>
<head>
	<title>ChatMe Registration Confirmation</title>
	<meta charset="utf-8">
	<style>
    p {
      color: grey;
    }
		body {
			font-family: 'Open Sans', sans-serif;
			font-size: 16px;
			line-height: 1.5;
			color: #333;
		}
		button {
      border-radius: 10px;
      background-color: #000000;
      font-size: 16px;
      font-weight: 500;
      font-style: normal;
      font-stretch: normal;
      line-height: 1.78;
      letter-spacing: 2px;
      color: #ffffff;
			padding: 10px 20px;
			border: none;
			cursor: pointer;
		}
		button:hover {
			background-color: #333333;
		}
	</style>
</head>
<body>
<div style="margin-left: 60px;">
	<h2 style="font-weight: bold; color:black;">Hello</h2>
	<p>Thank you for registering for ChatMe, we are delighted to have you as a new user.</p>
	<p>Your registration is almost complete! To verify your account, please use the following confirmation code by ` +
    expiration_time +
    `</p>
	<p>Confirmation code: ` +
    code +
    `</p>
  <br>
	<p>Alternatively, if you prefer, you can click on the button below</p>
	<a href="` +
    url +
    `"><button>Confirm your registration</button></a>
  <br>
	<p>If you do not confirm your registration by ` +
    expiration_time +
    `, your account will be automatically deleted. If you have any questions or concerns, please do not hesitate to contact us.</p>
	<p>Thank you for choosing ChatMe!</p>
	<p>Best regards,</p>
	<p>The ChatMe Team</p>
  </div>
</body>
</html>
`;

  // Crea l'oggetto email
  const mailOptions = {
    from: "Service.ChatMe@gmail.com",
    to: decrypted_email,
    subject: "Registration Confirmation for Chat Me",
    html: mail,
  };

  // Invia l'email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return false;
    } else {
      console.log("Email inviata: " + info.response);
    }
  });
  return true;
}

module.exports = { sendConfirmCodeViaEmail };
