const { parentPort } = require('worker_threads');
let core = require('../src/core');

/** @jobSize number */
parentPort.on('message', data => { 
    let test_result_arr = new Array();
    for(let a = data.start_a; a < data.end_a; a += data.interval) {

        let count = 0;
        for(let test_data of data.test_data_arr) {
            let res_data = core.bruteForceWithRatioKNN(data.db_data_arr, JSON.parse(test_data.wifi_data), 0.5, a);
            if(res_data.position == test_data.position) {
                count++;
            }
        }
        let test_result = {
            accuracy: count/data.test_data_arr.length,
            a: a
        }
        test_result_arr.push(test_result);
    }
    //INFO: 메인스레드에게 데이터 전달
    parentPort.postMessage(test_result_arr); //INFO: parentPort 이벤트를 종료시켜줘야 함
    parentPort.close();
});
