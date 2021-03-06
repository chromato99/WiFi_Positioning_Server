let express = require('express');

let app = express();
let port = 8004;

let server = require('http').createServer(app);
let compression = require('compression');
let crypto = require('crypto');
let mysql = require('mysql');
let fs = require('fs');

const db_config = require('./src/db-config');
const password = JSON.parse(fs.readFileSync('./src/password.json', 'utf-8'));

let core = require('./src/core');




app.use(compression());
app.use(express.static('public')); // Set static file location
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



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
            "bssid" : 111,
            "rssi" : -60
        },
        {
            "bssid" : 112,
            "rssi" : -30
        },
        {
            "bssid" : 113,
            "rssi" : -55
        },
        {
            "bssid" : 114,
            "rssi" : -85
        },
        {
            "bssid" : 116,
            "rssi" : -88
        }
    ]
}
*/
app.post('/add', (req, res) => { // Default entry
    console.log(req.body);
    const [encrypted, salt] = password.key.split("$"); // splitting password and salt
    crypto.pbkdf2(req.body.password, salt, 65536, 64, 'sha512', (err, derivedKey) => { // Encrypting input password
        if (err) res.send({error: "encrypt error"});
        if (derivedKey.toString("hex") === encrypted) { // Check its same
            let db = mysql.createConnection(db_config);
            db.connect();
            db.query('insert into wifi_data(position, wifi_data) values(?, ?)', 
            [req.body.position, JSON.stringify(req.body.wifi_data)], (err, result) => {
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
        }
        else {
            res.send({error: "incorrect password"});
        }
    });//pbkdf2
});


/*
위치를 찾아주는 요청
현재 위치의 와이파이 신호 데이터를 전달하면 예상되는 위치를 반환해준다.
위치 추정은 ./src/core.js에 정의된 함수에서 계산한다.
데이터 형태는 add와 비슷하지만 위치를 모르는 상태이니 position값은 빼주면 된다.
{
    "position" : "",
    "wifi_data" : [
        {
            "bssid" : 111,
            "rssi" : -60
        },
        {
            "bssid" : 112,
            "rssi" : -30
        },
        {
            "bssid" : 113,
            "rssi" : -55
        },
        {
            "bssid" : 114,
            "rssi" : -85
        },
        {
            "bssid" : 116,
            "rssi" : -88
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
