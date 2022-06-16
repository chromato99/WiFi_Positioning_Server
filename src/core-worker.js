const { parentPort } = require('worker_threads');
let core = require('../src/core');

/** @jobSize number */
parentPort.on('message', data => { 
    let res_data = core.bruteForceWithRatio(data.db_data_arr, data.input_wifi_data, data.a);
    //INFO: 메인스레드에게 데이터 전e
    parentPort.postMessage(res_data.calc_top_list); //INFO: parentPort 이벤트를 종료시켜줘야 함
    parentPort.close();
});