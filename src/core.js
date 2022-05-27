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

        // 아래는 추정한 위치를 담을 변수들 선언
        let best_avg = Infinity;
        let best_position = "";
        let best_count = 0;



        // 이 아래가 계산 로직
        for(let db_data of db_data_arr) { // 저장된 데이터셋에서 데이터를 하나씩 불러온다.
            let sum = 0;
            let count = 0;
            let db_wifi_data = JSON.parse(db_data.wifi_data); // 데이터에서 wifi 신호값이 담긴 배열만 뽑아 저장
            for(let one_wifi_data of db_wifi_data) { // 데이터 셋에서 wifi 신호값을 하나씩 불러온다.
                let same_mac_data = input_wifi_data.filter(e => e.mac == one_wifi_data.mac); // 데이터 셋에서 불러온 와이파이 ap와 같은 것이 있는지 확인
                if(same_mac_data.length != 0) { // 데이터 셋과 같은 와이파이 신호 값이 있을때 그 신호와 얼마나 유사한지 차를 구해 계산
                    console.log("same mac");
                    console.log(same_mac_data);
                    count++;
                    sum += Math.abs(one_wifi_data.rss - same_mac_data[0].rss); // 차에 절대값을 구해 합에 저장
                }
            }
            let avg = sum / count; // 각 차의 합을 ap갯수로 나눠 평균값을 구한다.
            
            if(count >= best_count) { // 더 나은 값을 찾았을때 그것을 best값으로 저장
                if(avg < best_avg) {
                    best_avg = avg;
                    best_position = db_data.position;
                    best_count = count;
                }
            }
        }


        if(best_avg == Infinity) { // 데이터 값을 찾지 못했을 경우 -1을 반환
            best_avg = -1;
        }
        return res.send({ // 예측 값을 json에 담아 반환
            msg : "success",
            position : best_position,
            avg : best_avg
        });
    });

}