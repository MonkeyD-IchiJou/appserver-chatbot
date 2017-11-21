require('./loadenv')() // load all the env
var mysql = require('mysql')

exports.Database = class {
    constructor(config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    }) {
        this.connection = mysql.createConnection(config)
    }

    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if (err) {
                    return reject(err)
                }
                resolve(rows)
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if (err) {
                    return reject(err)
                }
                resolve()
            });
        });
    }
}