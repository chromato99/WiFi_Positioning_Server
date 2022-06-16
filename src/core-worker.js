const { parentPort } = require('worker_threads');
let core = require('../src/core');

/** @jobSize number */
parentPort.on('message', data => { 
    let res_data = core.bruteForceWithRatio(data.db_data_arr, JSON.parse(data.input_wifi_data), 0.5);
    //INFO: 메인스레드에게 데이터 전달
    parentPort.postMessage(res_data); //INFO: parentPort 이벤트를 종료시켜줘야 함
    parentPort.close();
});