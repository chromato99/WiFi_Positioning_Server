/*
작업 스레드에게 넘겨줄 작업을 작성한 코드
스레드가 생성되면 아래의 코드를 실행하게 된다.
*/

const { parentPort } = require('worker_threads');
let core = require('../src/core');

parentPort.on('message', data => { 
    // main thread로부터 넘겨받은 파라미터는 data 객체로 받아오게 된다.
    let res_data = core.bruteForceWithRatio(data.db_data_arr, data.input_wifi_data, data.a);
    //INFO: 메인스레드에게 데이터 전e
    parentPort.postMessage(res_data.calc_top_list); //INFO: parentPort 이벤트를 종료시켜줘야 함
    parentPort.close();
});