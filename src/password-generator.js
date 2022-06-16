let crypto = require('crypto');
let fs = require('fs');

let textPassword = "asdfgh";
const randomSalt = crypto.randomBytes(32).toString("hex");
crypto.pbkdf2(textPassword, randomSalt, 65536, 64, "sha512", (err, encryptedPassword) => { 
    const passwordWithSalt = encryptedPassword.toString("hex")+"$"+randomSalt;
    let password = {
        key: passwordWithSalt
    }

    fs.writeFileSync('./password.json', JSON.stringify(password));
});