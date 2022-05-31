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




let core = require('./src/core');




app.use(compression());
app.use(express.static('public')); // Set static file location

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


// app.use(session({ // Session settings
//     secret: '!@#$%^&*',
//     store: new MySQLStore(db_config),
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//         maxAge: 6000 * 60 * 60 // 쿠키 유효기간 6시간
//     }
// }));
// app.use(passport.initialize()); // passport.js initialization
// app.use(passport.session());


// // Passport.js setting
// passport.use(new LocalStrategy(
//     function (username, password, done) {
//         let db = mysql.createConnection(db_config);
//         db.connect();
//         // Get user data from DB to check password
//         db.query('SELECT * FROM user WHERE username=?', [username], (err, results) => {
//             if (err) return done(err);
//             if (!results[0]) // Wrong username
//                 return done('please check your username.');
//             else {
//                 db.query('UPDATE user SET last_connection=NOW() WHERE username=?', [username]); // Set last connection datetime
//                 db.end();
//                 let user = results[0];
//                 const [encrypted, salt] = user.password.split("$"); // splitting password and salt
//                 crypto.pbkdf2(password, salt, 65536, 64, 'sha512', (err, derivedKey) => { // Encrypting input password
//                     if (err) return done(err);
//                     if (derivedKey.toString("hex") === encrypted) // Check its same
//                         return done(null, user);
//                     else
//                         return done('please check your password.');
//                 });//pbkdf2
//             }
//         });//query

//     }
// ));
// passport.serializeUser(function (user, done) { // passport.js serializing
//     done(null, user.username);
// });

// passport.deserializeUser(function (username, done) { // passport.js deserializing with checking Data Existence
//     let db = mysql.createConnection(db_config);
//     db.connect();
//     db.query('SELECT * FROM user WHERE username=?', [username], function (err, results) {
//         if (err)
//             return done(err, false);
//         if (!results[0])
//             return done(err, false);
//         db.end();
//         return done(null, results[0]);
//     });
// });

/*
테스트용 요청
단순히 들어온 json데이터를 다시 반환해준다.
json 데이터가 잘 전달됬는지 확인 가능
*/
app.post('/test', (req, res) => {
    console.log("/test")
    console.log(req.body);
    res.send(req.body);
});


/*
데이터셋을 추가하는 요청
json형태로 새로운 데이터를 전달받아 db에 insert해준다.
데이터는 아래와 같은 형식으로 전달해 주면 된다.
{
    "position" : "307호",
    "wifi_data" : [
        {
            "mac" : 111,
            "rss" : -60
        },
        {
            "mac" : 112,
            "rss" : -30
        },
        {
            "mac" : 113,
            "rss" : -55
        },
        {
            "mac" : 114,
            "rss" : -85
        },
        {
            "mac" : 116,
            "rss" : -88
        }
    ]
}
*/
app.post('/add', (req, res) => { // Default entry
    console.log(req.body);
    let db = mysql.createConnection(db_config);
    db.connect();
    db.query('insert into wifi_data(position, wifi_data) values(?, ?)', [req.body.position, JSON.stringify(req.body.wifi_data)], (err, result) => {
        if(err) {
            console.log(err);
            return res.send({ msg: "error" });
        }
        db.end();

        let res_data = { 
            msg: "success",
            insertId: result.insertId
        };

        console.log("res_data : ", res_data);
        return res.send(res_data);
    });
});


/*
위치를 찾아주는 요청
현재 위치의 와이파이 신호 데이터를 전달하면 예상되는 위치를 반환해준다.
위치 추정은 ./src/core.js에 정의된 함수에서 계산한다.
데이터 형태는 add와 비슷하지만 위치를 모르는 상태이니 position값은 빼주면 된다.
{
    "wifi_data" : [
        {
            "mac" : 111,
            "rss" : -65
        },
        {
            "mac" : 112,
            "rss" : -35
        },
        {
            "mac" : 113,
            "rss" : -60
        },
        {
            "mac" : 114,
            "rss" : -88
        },
        {
            "mac" : 117,
            "rss" : -88
        }
    ]
}
*/
app.post('/findPosition', (req, res) => {
    console.log("/findPosition");
    console.log(req.body);
    core.findPosition(req, res);
});


server.listen(port, () => { // Open server
    console.log(`Listening on http://localhost:${port}/`);
});