const router = require('express').Router();
const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')
var { Database } = require('../../database')

// get the correct chatbot details based on uuid
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

            if (!row_cbinfo[0]) {
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

// send this txt query to my bot engine first then store it in my db
var userToBotQuery = (user_submit) => {
    return new Promise(async (resolve, reject) => {

        // connect to mariadb/mysql
        let database = new Database()

        try {
            // all necessary sql queries
            const sql_queries = [
                'INSERT INTO bot_chatlogs (bot_id, sessionId, txt) VALUES (?, ?, ?)'
            ]

            // all possible errors
            const db_errors = [
            ]

            let row_insertlog = await database.query(sql_queries[0], [user_submit.botdetails.id, user_submit.sessionId, user_submit.q])
            resolve(row_insertlog)

        }
        catch (e) {
            // reject the error
            reject(e.toString())
        }

        // rmb to close the db
        let dbclose = await database.close()

    })
}

// every bot router need to submit its token and sessionId
router.use(
    [
        check('token', 'must have a token').exists(),
        check('sessionId', 'must have a sessionId').exists().isLength({ min: 1 })
    ],
    (req, res, next) => {

        // checking the results
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            // if request datas is incomplete or error, return error msg
            return res.status(422).json({ success: false, errors: errors.mapped() })
        }
        else {

            checkChatbotUUID(matchedData(req).token).then((cbdetail) => {

                // return the chatbot details down
                req.botdetails = cbdetail
                req.sessionId = matchedData(req).sessionId
                next();

            }).catch((error) => {
                return res.status(422).json({ success: false, errors: error })
            })

        }

    }
)

router.post(
    '/query',
    [
        check('q', 'must have a query').exists().isLength({ min: 1 })
    ],
    (req, res) => {

        // checking the results
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            // if request datas is incomplete or error, return error msg
            return res.status(422).json({ success: false, errors: errors.mapped() })
        }
        else {

            userToBotQuery({ botdetails: req.botdetails, sessionId: req.sessionId, q: matchedData(req).q }).then((r) => {

                // for now do nothing
                res.json({ r })

            }).catch((error) => {

                // return error if any
                return res.status(422).json({ success: false, errors: error })

            })
        }

    }
)

router.get('/render', (req, res) => {

    let botdetails = req.botdetails
    let sessionId = req.sessionId

    res.render('index', {
        bottoken: botdetails.name
    })

})



module.exports = router;