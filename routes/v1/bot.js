const router = require('express').Router();
const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')
var { Database } = require('../../database')
var PythonShell = require('python-shell');

var options = {
    pythonPath: './chatbotML/bin/python',
    args: ['value1', 'value2', 'value3']
}

var runPython = (scriptName, options) => {
    return new Promise((resolve, reject) => {

        PythonShell.run(scriptName, options, function (err, data) {

            if (err) {
                reject(err)
            }

            resolve(data)

        })

    })
}

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

            // run my python code and get the response
            runPython('./chatbotML/chatbot_framework.py', options).then((r) => {
                resolve(r)
            }).catch((e) => {
                throw e
            })

        }
        catch (e) {
            // reject the error
            reject(e.toString())
        }

        // rmb to close the db
        let dbclose = await database.close()

    })
}

// create a new intent in my db
var createNewIntentForChatbot = (user_submit) => {
    return new Promise(async (resolve, reject) => {

        // connect to mariadb/mysql
        let database = new Database()

        try {
            // all necessary sql queries
            const sql_queries = [
                'SELECT * FROM intents WHERE bot_id=? AND name=?',
                'INSERT INTO intents (bot_id, name) VALUES (?, ?)'
            ]

            // all possible errors
            const db_errors = [
                'intent name alr exist for this chatbot'
            ]

            let row_selectintent = await database.query(sql_queries[0], [user_submit.botdetails.id, user_submit.intentName])

            if (row_selectintent.length > 0) {
                // if the intent name alr exist, then throw error
                throw db_errors[0]
            }

            let row_insertintent = await database.query(sql_queries[1], [user_submit.botdetails.id, user_submit.intentName])

            // successfully insert a new intent
            resolve()

        }
        catch (e) {
            // reject the error
            reject(e.toString())
        }

        // rmb to close the db
        let dbclose = await database.close()

    })
}

// update the patterns into the intent
var updateNewPatternsIntoIntent = (user_submit) => {
    return new Promise(async (resolve, reject) => {

        // connect to mariadb/mysql
        let database = new Database()

        try {
            // all necessary sql queries
            const sql_queries = [
                'SELECT id FROM intents WHERE bot_id=? AND name=?',
                'UPDATE intents SET patterns=? WHERE id=?'
            ]

            // all possible errors
            const db_errors = [
                'cannot find the intents based on the name'
            ]

            // select the correct intent first
            let row_selectintentid = await database.query(sql_queries[0], [user_submit.botdetails.id, user_submit.intentName])

            if (row_selectintentid.length < 1) {
                // if no such intent, throw error
                throw db_errors[0]
            }

            // store as json string
            let patterns_jsonstr = JSON.stringify(user_submit.patterns)

            // begin to update the latest patterns
            let row_insertpatterns = await database.query(sql_queries[1], [patterns_jsonstr, row_selectintentid[0].id])

            resolve()

        }
        catch (e) {
            // reject the error
            reject(e.toString())
        }

        // rmb to close the db
        let dbclose = await database.close()

    })
}

// update new responses to the intent
var updateNewResponseIntoIntent = (user_submit) => {
    return new Promise(async (resolve, reject) => {

        // connect to mariadb/mysql
        let database = new Database()

        try {
            // all necessary sql queries
            const sql_queries = [
                'SELECT id FROM intents WHERE bot_id=? AND name=?',
                'UPDATE intents SET responses=? WHERE id=?'
            ]

            // all possible errors
            const db_errors = [
                'cannot find the intents based on the name'
            ]

            // select the correct intent first
            let row_selectintentid = await database.query(sql_queries[0], [user_submit.botdetails.id, user_submit.intentName])

            if (row_selectintentid.length < 1) {
                // if no such intent, throw error
                throw db_errors[0]
            }

            // store as json string
            let responses_jsonstr = JSON.stringify(user_submit.responses)

            // begin to update the latest patterns
            let row_insertpatterns = await database.query(sql_queries[1], [responses_jsonstr, row_selectintentid[0].id])

            resolve()

        }
        catch (e) {
            // reject the error
            reject(e.toString())
        }

        // rmb to close the db
        let dbclose = await database.close()

    })
}

// get all the intents from this chatbot
var getAllIntentsFromThisChatbot = (user_submit) => {
    return new Promise(async (resolve, reject) => {

        // connect to mariadb/mysql
        let database = new Database()

        try {
            // all necessary sql queries
            const sql_queries = [
                'SELECT * FROM intents WHERE bot_id=?'
            ]

            // all possible errors
            const db_errors = [
            ]

            // select the correct intent first
            let row_selectintents = await database.query(sql_queries[0], [user_submit.botdetails.id])

            // gather all the intents
            let intents = []
            for (let i = 0; i < row_selectintents.length; ++i) {
                intents.push({
                    tag: row_selectintents[i].name,
                    patterns: JSON.parse(row_selectintents[i].patterns),
                    responses: JSON.parse(row_selectintents[i].responses)
                })
            }

            resolve({ intents: intents })

        }
        catch (e) {
            // reject the error
            reject(e.toString())
        }

        // rmb to close the db
        let dbclose = await database.close()

    })
}

// get certain intent from this chatbot
var getIntentFromThisChatbot = (user_submit) => {
    return new Promise(async (resolve, reject) => {

        // connect to mariadb/mysql
        let database = new Database()

        try {
            // all necessary sql queries
            const sql_queries = [
                'SELECT name, patterns, responses FROM intents WHERE bot_id=? AND name=?',
            ]

            // all possible errors
            const db_errors = [
            ]

            // select the correct intent first
            let row_selectintent = await database.query(sql_queries[0], [user_submit.botdetails.id, user_submit.intentName])

            if (row_selectintent[0]) {
                row_selectintent[0].patterns = JSON.parse(row_selectintent[0].patterns)
                row_selectintent[0].responses = JSON.parse(row_selectintent[0].responses)
            }

            resolve(row_selectintent[0])

        }
        catch (e) {
            // reject the error
            reject(e.toString())
        }

        // rmb to close the db
        let dbclose = await database.close()

    })
}

// delete certain intent from this chatbot
var deleteIntentFromThisChatbot = (user_submit) => {
    return new Promise(async (resolve, reject) => {

        // connect to mariadb/mysql
        let database = new Database()

        try {
            // all necessary sql queries
            const sql_queries = [
                'DELETE FROM intents WHERE bot_id=? AND name=?'
            ]

            // all possible errors
            const db_errors = [
            ]

            // delete this intent
            let row_deleteintent = await database.query(sql_queries[0], [user_submit.botdetails.id, user_submit.intentName])
            resolve()

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

router.post(
    '/intent',
    [
        check('intentName', 'must have a intent name').exists().isLength({ min: 1 })
    ],
    (req, res) => {

        // checking the results
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            // if request datas is incomplete or error, return error msg
            return res.status(422).json({ success: false, errors: errors.mapped() })
        }
        else {
            createNewIntentForChatbot({ botdetails: req.botdetails, intentName: matchedData(req).intentName }).then(() => {

                res.json({ success: true })

            }).catch((error) => {

                return res.status(422).json({ success: false, errors: error })

            })
        }

    }
)

router.get(
    '/intent',
    [
        check('intentName', 'must have a intent name').exists().isLength({ min: 1 })
    ],
    (req, res) => {
        // checking the results
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            // if request datas is incomplete or error, return error msg
            return res.status(422).json({ success: false, errors: errors.mapped() })
        }
        else {

            getIntentFromThisChatbot({ botdetails: req.botdetails, intentName: matchedData(req).intentName }).then((intent) => {

                res.json({ success: true, intent: { tag: intent.name, patterns: intent.patterns, responses: intent.responses } })

            }).catch((error) => {

                return res.status(422).json({ success: false, errors: error })

            })

        }
    }
)

router.delete(
    '/intent',
    [
        check('intentName', 'must have a intent name').exists().isLength({ min: 1 })
    ],
    (req, res) => {
        // checking the results
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            // if request datas is incomplete or error, return error msg
            return res.status(422).json({ success: false, errors: errors.mapped() })
        }
        else {

            deleteIntentFromThisChatbot({ botdetails: req.botdetails, intentName: matchedData(req).intentName }).then(() => {

                res.json({ success: true })

            }).catch((error) => {

                return res.status(422).json({ success: false, errors: error })

            })

        }
    }
)

router.post(
    '/patterns',
    [
        check('patterns', 'must have patterns').exists(),
        check('intentName', 'must have a intent name').exists().isLength({ min: 1 })
    ],
    (req, res) => {
        // checking the results
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            // if request datas is incomplete or error, return error msg
            return res.status(422).json({ success: false, errors: errors.mapped() })
        }
        else {

            updateNewPatternsIntoIntent({ botdetails: req.botdetails, patterns: matchedData(req).patterns, intentName: matchedData(req).intentName }).then(() => {

                res.json({ success: true })

            }).catch((error) => {

                return res.status(422).json({ success: false, errors: error })

            })

        }
    }
)

router.post(
    '/responses',
    [
        check('responses', 'must have responses').exists(),
        check('intentName', 'must have a intent name').exists().isLength({ min: 1 })
    ],
    (req, res) => {
        // checking the results
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            // if request datas is incomplete or error, return error msg
            return res.status(422).json({ success: false, errors: errors.mapped() })
        }
        else {

            updateNewResponseIntoIntent({ botdetails: req.botdetails, responses: matchedData(req).responses, intentName: matchedData(req).intentName }).then(() => {

                res.json({ success: true })

            }).catch((error) => {

                return res.status(422).json({ success: false, errors: error })

            })

        }
    }
)

router.get('/intents', (req, res)=>{

    getAllIntentsFromThisChatbot({ botdetails: req.botdetails }).then((intents) => {

        res.json(intents)

    }).catch((error) => {

        return res.status(422).json({ success: false, errors: error })

    })

})

router.get('/render', (req, res) => {

    let botdetails = req.botdetails
    let sessionId = req.sessionId

    res.render('index', {
        bottoken: botdetails.name
    })

})

module.exports = router;