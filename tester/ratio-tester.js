let core = require('../src/core');
let mysql = require('mysql');
const db_config = require('../src/db-config');

let test_data_arr = new Array();
let test_num = 300;
let a = 0.75;

let db = mysql.createConnection(db_config);
db.connect();
db.query('SELECT * FROM wifi_data', (err, db_data_arr) => { // db에서 저장된 모든 데이터셋 호출
    if(err) {
        console.log("db error!!");
    }
    db.end();

    // db에 저장된 데이터는 db_data_arr 이라는 변수에 담겨서 온다
    for(let i = 0; i < test_num ; i++){
        let db_data = db_data_arr.splice(Math.floor(Math.random()*db_data_arr.length), 1);
        test_data_arr.push(db_data[0]);
    }

    let incorrect = new Object();
    let count = 0;
    for(let test_data of test_data_arr) {
        let res_data = core.bruteForceWithRatio(db_data_arr, JSON.parse(test_data.wifi_data), a);
        if(res_data.position == test_data.position) {
            count++;
        } else {
            if(incorrect[test_data.position.substring(0, 1) + test_data.position.substring(3)]) {
                incorrect[test_data.position.substring(0, 1) + test_data.position.substring(3)]++;
            } else {
                incorrect[test_data.position.substring(0, 1) + test_data.position.substring(3)] = 1;
            }
            console.log("id : ", test_data.id, "correct position : ", test_data.position);
            console.log("res_data : ", res_data);
        }
    }
    let test_result = {
        accuracy: count/test_num,
    }

    console.log(incorrect);
    console.log("Accuracy: ", test_result.accuracy);
});