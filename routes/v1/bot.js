const router = require('express').Router();
const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')
var { Database } = require('../../database')

var checkChatbotUUID = (uuid) => {
    return new Promise(async (resolve, reject) => {

        // connect to mariadb/mysql
        let database = new Database()

        try {
            // all necessary sql queries
            const sql_queries = [
                'SELECT * FROM chatbots WHERE uuid=?'
            ]

            // all possible errors
            const db_errors = [
                'no such chatbot in db'
            ]

            // get the project info first
            let row_cbinfo = await database.query(sql_queries[0], [uuid])

            if(!row_cbinfo[0]) {
                // dun have this chatbot
                throw db_errors[0] 
            }

            // if have this chatbot, then return resolve
            resolve(row_cbinfo[0])

        }
        catch (e) {
            // reject the error
            reject(e.toString())
        }

        // rmb to close the db
        let dbclose = await database.close()

    })
}

router.get(
    '/',
    [
        check('token', 'must have a token').exists()
    ],
    (req, res) => {

        // checking the results
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            // if request datas is incomplete or error, return error msg
            return res.status(422).json({ success: false, errors: errors.mapped() })
        }
        else {
            let token = matchedData(req).token

            checkChatbotUUID(token).then((cbdetail) => {
                
                //console.log(cbdetail)

                res.render('index', {
                    bottoken: cbdetail.name
                });

            }).catch((error) => {
                return res.status(422).json({ success: false, errors: error })
            })

        }

    }
)

module.exports = router;