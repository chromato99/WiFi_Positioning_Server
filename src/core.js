let mysql = require("mysql");
const db_config = require('./db-config');


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


        let res_data = bruteForce(db_data_arr, input_wifi_data);
        console.log("res_data : ", res_data);
        
        return res.send(res_data);
    });

}


function bruteForce(db_data_arr, input_wifi_data) {
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
            avg: 0
        }
        let sum = 0;

        let db_wifi_data = JSON.parse(db_data.wifi_data); // 데이터에서 wifi 신호값이 담긴 배열만 뽑아 저장
        for(let one_wifi_data of db_wifi_data) { // 데이터 셋에서 wifi 신호값을 하나씩 불러온다.
            let same_mac_data = input_wifi_data.filter(e => e.mac == one_wifi_data.mac); // 데이터 셋에서 불러온 와이파이 ap와 같은 것이 있는지 확인
            if(same_mac_data.length != 0) { // 데이터 셋과 같은 와이파이 신호 값이 있을때 그 신호와 얼마나 유사한지 차를 구해 계산
                // console.log("same mac");
                // console.log(same_mac_data);
                calc.count++;
                sum += Math.abs(one_wifi_data.rss - same_mac_data[0].rss); // 차에 절대값을 구해 합에 저장
            }
        }
        calc.avg = sum / calc.count; // 각 차의 합을 ap갯수로 나눠 평균값을 구한다.
        calc_list.push(calc);
        
        if(calc.count >= best_calc.count) { // 더 나은 값을 찾았을때 그것을 best값으로 저장
            if(calc.avg < best_calc.avg) {
                best_calc = calc;
            }
        }
    }


    calc_list.sort((obj1, obj2) => obj2.count - obj1.count);
    console.log("Top 10 calc_list");
    for(let i = 0; i < 10; i++) {
        if(calc_list[i]) {
            console.dir(calc_list[i]);
        }
    }

    if(best_calc.avg == Infinity) { // 데이터 값을 찾지 못했을 경우 -1을 반환
        best_calc.avg = -1;
    }

    return best_calc;
}