const config = require('../mysqlConfig');
var mysql = require('mysql');

async function query(sql,cb) {
    const connection = await mysql.createConnection(config.db);
    await connection.query(sql, function (error, results) {
        if (error) {
            cb(false,error);
        } else {
            cb(true,results);
        }
    });
}

module.exports = {
    query
}



