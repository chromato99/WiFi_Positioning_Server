let mysql = require('mysql');
const db_config = require('../src/db-config');
const {Worker} = require('worker_threads');
let path = require('path');

let test_data_arr = new Array();
let test_num = 300;
let thread_num = 6;
let start_a = 1;
let end_a = 7;
let interval = 1;
let tester_name = './knn-test-worker.js';

let end_count = 0;

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

    let test_result_arr = new Array();
    for(let i = 0;  i < thread_num; i += 1) {

        let myWorker = new Worker(path.join(__dirname, tester_name));
        myWorker.postMessage({
            db_data_arr: db_data_arr,
            test_data_arr: test_data_arr,
            start_a: start_a + ((end_a - start_a) / thread_num) * i,
            end_a: start_a + ((end_a - start_a) / thread_num) * (i + 1),
            interval: interval
        });
        
        //INFO: 스레드로부터 데이터를 받음
        myWorker.on('message', result => {
            test_result_arr.push(...result);
            if(++end_count >= thread_num) {
                test_result_arr.sort((obj1, obj2) => obj2.accuracy - obj1.accuracy);
                console.log(test_result_arr);
                console.log("Best Accuracy : ", test_result_arr[0].accuracy);
                console.log("Best a : ", test_result_arr[0].a);
            }
        });
    }
    
});