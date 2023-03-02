const crypto = require('./crypto.js');
const database = require('./database.js');

function Login(c_email, c_password){
    var email = crypto.decrypt(c_email, crypto.privateKey);
    var password = crypto.decrypt(c_password, crypto.privateKey);
    if(database.LoginDatabase(email,password)){
        // const mancante = 
        // const key = 
        return true;
    }
    else{
        return false;
    }
}


module.exports = {
    Login,
  };