let mysql = require("mysql");
const db_config = require('./db-config');

exports.findPosition = function(req, res, wifi_data) {
    let db = mysql.createConnection(db_config);
    db.connect();
    db.query('SELECT * FROM wifi_data WHERE id=?', [wifi_data], (err, results) => {
        if(err) {
            return res.send({ msg: "error" });
        }
        db.end();

        // 로직을 여기에 넣으면 됨!




        let result = results[0].number;
        return res.send({
            msg: result
        });
    });

}