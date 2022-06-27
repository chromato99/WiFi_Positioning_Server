let mysql = require("mysql");
const db_config = require('./db-config');
const {Worker} = require('worker_threads');
const path = require('path');
const thread_num = 3;
const a = 0.5;
const k = 4


// 위치 추정을 계산해주는 함수
exports.findPosition = (req, res) => {
    // 전달받은 값을 변수에 넣는다.
    let input_wifi_data = req.body.wifi_data;
    let db = mysql.createConnection(db_config);
    db.connect();
    db.query('SELECT * FROM wifi_data', (err, db_data_arr) => { // db에서 저장된 모든 데이터셋 호출
        if(err) {
            return res.send({ msg: "error" });
        }
        db.end();


        // db에 저장된 데이터는 db_data_arr 이라는 변수에 담겨서 온다
        let splice_length = Math.ceil(db_data_arr.length / 3);

        let test_result_arr = new Array();
        let finish_thread_num = 0;

        // 새로운 스레드를 호출하는 부분
        // 사전에 정해진 스레드 개수만큼 데이터를 분할에 나눠서 연산을 진행하게 된다.
        for(let i = 0;  i < thread_num; i += 1) {

            let myWorker = new Worker(path.join(__dirname, './core-worker.js'));
            myWorker.postMessage({
                db_data_arr: db_data_arr.splice(0, splice_length),
                input_wifi_data: input_wifi_data,
                a: a
            });
            
            //INFO: 스레드로부터 데이터를 받음
            myWorker.on('message', result => {
                // 각각의 스레드로부터 넘어온 배열 데이터를 합친다.
                test_result_arr.push(...result);


                // 모든 스레드로부터 값을 받았다면 다음으로 넘어간다.
                if(++finish_thread_num >= thread_num) {

                    // 최대값을 기준으로 일정 범위 안에 있는 값만 추출
                    test_result_arr.sort((obj1, obj2) => obj2.count - obj1.count);
                    let largest_count = 0;
                    if(test_result_arr[0]) largest_count = test_result_arr[0].count;

                    
                    let filtered_arr = new Array();
                    for(let i = 0; test_result_arr[i] && test_result_arr[i].count > (largest_count * a); i++) {
                        filtered_arr.push(test_result_arr[i]);
                    }



                    // 내림차순으로 정렬후 상위 4개를 뽑아 비교후 출력
                    filtered_arr.sort((obj1, obj2) => obj1.ratio - obj2.ratio);
                    let best_calc = this.ratioKNN(filtered_arr, k);

                    console.log(best_calc);
                    return res.send({
                        position: best_calc.position,
                        k_count: best_calc.knn_count
                    });
                }
            });
        }
    });

}


exports.bruteForce = (db_data_arr, input_wifi_data, margin) => {
    // 아래는 추정한 위치를 담을 변수들 선언
    let best_calc = {
        id: 0,
        position : "not found",
        count: 0,
        avg : Infinity
    }

    let calc_list = new Array();

    // 이 아래가 계산 로직
    for(let db_data of db_data_arr) { // 저장된 데이터셋에서 데이터를 하나씩 불러온다.
        let calc = {
            id: db_data.id,
            position: db_data.position,
            count: 0,
            avg: 0,
        }
        let sum = 0;

        let db_wifi_data = JSON.parse(db_data.wifi_data); // 데이터에서 wifi 신호값이 담긴 배열만 뽑아 저장
        for(let one_wifi_data of db_wifi_data) { // 데이터 셋에서 wifi 신호값을 하나씩 불러온다.
            let same_bssid_data = input_wifi_data.filter(e => e.bssid == one_wifi_data.bssid); // 데이터 셋에서 불러온 와이파이 ap와 같은 것이 있는지 확인
            if(same_bssid_data.length != 0) { // 데이터 셋과 같은 와이파이 신호 값이 있을때 그 신호와 얼마나 유사한지 차를 구해 계산
                // console.log("same bssid");
                // console.log(same_bssid_data);
                calc.count++;
                sum += Math.abs(one_wifi_data.rssi - same_bssid_data[0].rssi); // 차에 절대값을 구해 합에 저장
            }
        }
        calc.avg = sum / calc.count; // 각 차의 합을 ap갯수로 나눠 평균값을 구한다.
        calc_list.push(calc);
    }


    calc_list.sort((obj1, obj2) => obj2.count - obj1.count);
    let largest_count = calc_list[0].count;
    for(let i = 0; calc_list[i] && calc_list[i].count > (largest_count * margin); i++) {
        if(calc_list[i] && calc_list[i].avg < best_calc.avg) {
            best_calc = calc_list[i];
        }
    }
    best_calc.calc_top_list = calc_list.slice(0, 15);

    if(best_calc.avg == Infinity) { // 데이터 값을 찾지 못했을 경우 -1을 반환
        best_calc.avg = -1;
    }

    return best_calc;
}

exports.bruteForceWithRatio = (db_data_arr, input_wifi_data, a) => {
    // 아래는 추정한 위치를 담을 변수들 선언
    let best_calc = {
        id: 0,
        position : "not found",
        count: 0,
        avg : Infinity,
        ratio : Infinity
    }

    let calc_list = new Array();

    // 이 아래가 계산 로직
    for(let db_data of db_data_arr) { // 저장된 데이터셋에서 데이터를 하나씩 불러온다.
        let calc = {
            id: db_data.id,
            position: db_data.position,
            count: 0,
            avg: 0,
            ratio: 0
        }
        let sum = 0;

        let db_wifi_data = JSON.parse(db_data.wifi_data); // 데이터에서 wifi 신호값이 담긴 배열만 뽑아 저장
        for(let one_wifi_data of db_wifi_data) { // 데이터 셋에서 wifi 신호값을 하나씩 불러온다.
            let same_bssid_data = input_wifi_data.filter(e => e.bssid == one_wifi_data.bssid); // 데이터 셋에서 불러온 와이파이 ap와 같은 것이 있는지 확인
            if(same_bssid_data.length != 0) { // 데이터 셋과 같은 와이파이 신호 값이 있을때 그 신호와 얼마나 유사한지 차를 구해 계산
                // console.log("same bssid");
                // console.log(same_bssid_data);
                calc.count++;
                sum += Math.abs(one_wifi_data.rssi - same_bssid_data[0].rssi); // 차에 절대값을 구해 합에 저장
            }
        }
        // if(calc.count <= a) {
        //     calc.ratio = Infinity;
        // } else {
        //     calc.avg = sum / calc.count; // 각 차의 합을 ap갯수로 나눠 평균값을 구한다.
        //     calc.ratio = calc.avg / calc.count;
        // }
        calc.avg = sum / calc.count; // 각 차의 합을 ap갯수로 나눠 평균값을 구한다.
        calc.ratio = calc.avg / calc.count;
        calc_list.push(calc);
        
        // if(calc.avg != 0 && calc.count > a && calc.ratio < best_calc.ratio) { // 더 나은 값을 찾았을때 그것을 best값으로 저장
        //     best_calc = calc;
        // }
    }


    
    calc_list.sort((obj1, obj2) => obj2.count - obj1.count);
    let largest_count = calc_list[0].count;
    let filtered_calc_list = new Array();
    for(let i = 0; calc_list[i] && calc_list[i].count > (largest_count * a); i++) {
        filtered_calc_list.push(calc_list[i]);
        if(calc_list[i] && calc_list[i].ratio < best_calc.ratio) {
            best_calc = calc_list[i];
        }
    }
    
    filtered_calc_list.sort((obj1, obj2) => obj1.ratio - obj2.ratio);
    best_calc.calc_top_list = filtered_calc_list.slice(0, 10);


    // calc_list.sort((obj1, obj2) => obj1.ratio - obj2.ratio);
    // best_calc.calc_top_list = calc_list.slice(0, 15);

    if(best_calc.avg == Infinity) { // 데이터 값을 찾지 못했을 경우 -1을 반환
        best_calc.avg = -1;
    }

    return best_calc;
}

exports.ratioKNN = (result_list, k) => {
    let calc_top_list = new Array();
    for(let i = 0; i < k && i < result_list.length; i++) {
        if(calc_top_list[result_list[i].position]) {
            calc_top_list[result_list[i].position]++;
        } else {
            calc_top_list[result_list[i].position] = 1;
        }
    }
    

    let best_calc = {
        position: "not found",
        knn_count: 0,
        calc_top_list: []
    }
    for(const [key, value] of Object.entries(calc_top_list)) {
        if(value > best_calc.knn_count) {
            best_calc.knn_count = value;
            best_calc.position = key;
        } else if(value == best_calc.knn_count && key == result_list[0].position) {
            best_calc.knn_count = value;
            best_calc.position = key;
        }
    }

    best_calc.calc_top_list = result_list.slice(0, k);

    return best_calc;
}


exports.bruteForceWithRatioKNN = (db_data_arr, input_wifi_data, a, k) => {
    let res = exports.bruteForceWithRatio(db_data_arr, input_wifi_data, a);

    let best_calc = exports.ratioKNN(res.calc_top_list, k);

    return best_calc;
}