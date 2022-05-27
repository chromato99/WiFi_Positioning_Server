let mysql = require("mysql");
const db_config = require('./db-config');

exports.findPosition = (req, res) => {
    let input_wifi_data = req.body.wifi_data;
    let db = mysql.createConnection(db_config);
    db.connect();
    db.query('SELECT * FROM wifi_data', (err, db_data_arr) => {
        if(err) {
            return res.send({ msg: "error" });
        }
        db.end();


        let best_avg = 10000000;
        let best_position = "";
        let best_count = 0;
        // 로직을 여기에 넣으면 됨!
        for(let db_data of db_data_arr) {
            let sum = 0;
            let count = 0;
            let db_wifi_data = JSON.parse(db_data.wifi_data);
            for(let one_wifi_data of db_wifi_data) {
                let same_mac_data = input_wifi_data.filter(e => e.mac == one_wifi_data.mac);
                if(same_mac_data.length != 0) {
                    console.log("same mac");
                    console.log(same_mac_data);
                    count++;
                    sum += Math.abs(one_wifi_data.rss - same_mac_data[0].rss);
                }
            }
            let avg = sum / count;
            
            if(count >= best_count) {
                if(avg < best_avg) {
                    best_avg = avg;
                    best_position = db_data.position;
                    best_count = count;
                }
            }
        }

        return res.send({
            msg : "success",
            position : best_position,
            avg : best_avg
        });
    });

}