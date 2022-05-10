let express = require('express');

let app = express();
let port = 80;

let server = require('http').createServer(app);
let session = require('express-session');
let MySQLStore = require('express-mysql-session')(session);
let compression = require('compression');
let crypto = require('crypto');
let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let mysql = require('mysql');

const db_config = require('./src/db-config');

app.use(compression());
app.use(express.static('public')); // Set static file location

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(session({ // Session settings
    secret: '!@#$%^&*',
    store: new MySQLStore(db_config),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 6000 * 60 * 60 // 쿠키 유효기간 6시간
    }
}));
app.use(passport.initialize()); // passport.js initialization
app.use(passport.session());


// Passport.js setting
passport.use(new LocalStrategy(
    function(username, password, done) {
    let db = mysql.createConnection(db_config);
    db.connect();
    // Get user data from DB to check password
    db.query('SELECT * FROM user WHERE username=?', [username], (err, results) => {
        if(err) return done(err);
        if(!results[0]) // Wrong username
            return done('please check your username.');
        else {
            db.query('UPDATE user SET last_connection=NOW() WHERE username=?', [username]); // Set last connection datetime
            db.end();
            let user = results[0];
            const [encrypted, salt] = user.password.split("$"); // splitting password and salt
            crypto.pbkdf2(password, salt, 65536, 64, 'sha512', (err, derivedKey) => { // Encrypting input password
                if(err) return done(err);
                if(derivedKey.toString("hex") === encrypted) // Check its same
                    return done(null, user);
                else
                    return done('please check your password.');
            });//pbkdf2
        }
    });//query

    }
));
passport.serializeUser(function(user, done) { // passport.js serializing
    done(null, user.username);
});

passport.deserializeUser(function(username, done) { // passport.js deserializing with checking Data Existence
    let db = mysql.createConnection(db_config);
    db.connect();
    db.query('SELECT * FROM user WHERE username=?', [username], function(err, results){
    if(err)
        return done(err, false);
    if(!results[0])
        return done(err, false);
    db.end();
    return done(null, results[0]);
    });
});


// Express.js get,post request code

app.post('/add', (req, res) => { // Default entry
    console.log(req.body);
    let db = mysql.createConnection(db_config);
    db.connect();
    db.query('insert into test(id, number) values(?, ?)', [req.body.id, req.body.number], function(err, results){
        // console.log(results[0]);
        db.end();
        return res.send({msg: "success"});
    });
});


server.listen(port, function() { // Open server
  console.log(`Listening on http://localhost:${port}/`);
});