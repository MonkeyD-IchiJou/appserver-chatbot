const router = require('express').Router()
var jwt = require('jsonwebtoken') // sign with default (HMAC SHA256)
const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')
var { Database } = require('../../database')

// check user confirmation or not
var getUserInfoByID = (user_id) => {
    return new Promise(async (resolve, reject) => {

        // connect to mariadb/mysql
        let database = new Database()

        try {
            // all necessary sql queries
            const sql_queries = [
                'SELECT * FROM users WHERE id=?'
            ]

            // set the confirmation
            let result_row = await database.query(sql_queries[0], [user_id])

            resolve(result_row[0])

        }
        catch (e) {
            // reject the error
            reject(e.toString())
        }

        // rmb to close the db
        let dbclose = await database.close()
    })
}

// check user confirmation or not
var createNewProject = (user_submit) => {
    return new Promise(async (resolve, reject) => {

        // connect to mariadb/mysql
        let database = new Database()

        try {
            // all necessary sql queries
            const sql_queries = [
                'SELECT EXISTS(SELECT * FROM projects WHERE name=?) AS solution',
                'SELECT plan_id FROM users_plans WHERE user_id=?',
                'SELECT * FROM plans WHERE id=?',
                'SELECT name FROM projects WHERE createdby=?',
                'INSERT INTO projects (createdby, name, description) VALUES (?, ?, ?)'
            ]

            // all possible errors
            const db_errors = [
                'project name alr exist',
                'cannot find user plan id',
                'cannot find the plan detail',
                'exceed project limit'
            ]

            // check for unique name
            let row_solution = await database.query(sql_queries[0], [user_submit.proj_name])

            if (row_solution[0].solution) {
                // if the project name alr exist in the db
                throw db_errors[0]
            }

            // do things in parallel
            let all_results = await Promise.all([
                new Promise(async (resolve, reject) => {
                    // find out the user current plans

                    let user_planid = ''

                    {
                        // find the plan id
                        let row_plan_id = await database.query(sql_queries[1], [user_submit.user_id])
                        user_planid = row_plan_id[0]
                    }

                    if (!user_planid) {
                        reject(db_errors[1])
                    }

                    let plan_info = ''

                    {
                        let row_plan_info = await database.query(sql_queries[2], [user_planid.plan_id])
                        plan_info = row_plan_info[0]
                    }

                    if (!plan_info) {
                        reject(db_errors[2])
                    }

                    // return the user signed up plan info
                    resolve(plan_info)
                }),
                new Promise(async (resolve, reject) => {
                    // find all projects created by this user
                    let row_projname = await database.query(sql_queries[3], [user_submit.user_id])
                    resolve(row_projname)
                })
            ])

            let plan_info = all_results[0]
            let all_user_projs = all_results[1]

            if (all_user_projs.length >= plan_info.projects_limit) {
                // user has created too many projects, exceed project limit
                throw db_errors[3]
            }

            // create the new project
            let row_insert_proj = await database.query(sql_queries[4], [user_submit.user_id, user_submit.proj_name, user_submit.proj_desc])
            resolve(row_insert_proj.insertId)

        }
        catch (e) {
            // reject the error
            reject(e.toString())
        }

        // rmb to close the db
        let dbclose = await database.close()
    })
}

// user project want to create a new chatbot
var projectCreateNewChatbot = (user_submit) => {
    return new Promise(async (resolve, reject) => {

        // connect to mariadb/mysql
        let database = new Database()

        try {
            // all necessary sql queries
            const sql_queries = [
                'SELECT id, createdby FROM projects WHERE name=?',
                'SELECT * FROM chatbots WHERE project_id=?',
                'INSERT INTO chatbots (project_id, jwt, uuid, name) VALUES (?, ?, ?, ?)'
            ]

            // all possible errors
            const db_errors = [
                'no such project, project name incorrect',
                'this project is not created by this user, therefore cannot create a chatbot from it',
                'this project alr has a chatbot'
            ]

            // get the project info first
            let row_projinfo = await database.query(sql_queries[0], [user_submit.proj_name])

            if (!row_projinfo[0]) {
                // cannot find this project in db
                throw db_errors[0]
            }

            let projid = row_projinfo[0].id
            let createdby = row_projinfo[0].createdby

            if (createdby != user_submit.user_id) {
                // if this project is not created by this user, then throw error
                throw db_errors[1]
            }

            // check whether this project got existing chatbot or not
            let row_chatbots = await database.query(sql_queries[1], [projid])

            if (row_chatbots[0]) {
                // if alr has existing chatbot, then throw error
                throw db_errors[2]
            }

            // client is supposed to keep this secret.. if not other people can abuse it
            let botjwt = jwt.sign({ data: { 'n': user_submit.chatbot_name } }, process.env.jwtSecret + projid)
            let botuuid = botjwt.slice(botjwt.lastIndexOf(".") + 1)

            // then insert this new chatbot into my db
            let row_insert_chatbot = await database.query(sql_queries[2], [projid, botjwt, botuuid, user_submit.chatbot_name])
            resolve(row_insert_chatbot.insertId)

        }
        catch (e) {
            // reject the error
            reject(e.toString())
        }

        // rmb to close the db
        let dbclose = await database.close()
    })
}

// get all projects from this user
var getAllProjectsFromThisUser = (user_id) => {
    return new Promise(async (resolve, reject) => {

        // connect to mariadb/mysql
        let database = new Database()

        try {
            // all necessary sql queries
            const sql_queries = [
                'SELECT * FROM projects WHERE createdby=?'
            ]

            // all possible errors
            const db_errors = [
            ]

            // delete this intent
            let row_selectprojects = await database.query(sql_queries[0], [user_id])
            resolve(row_selectprojects)

        }
        catch (e) {
            // reject the error
            reject(e.toString())
        }

        // rmb to close the db
        let dbclose = await database.close()

    })
}

// delete this user
var deleteThisUser = (user_id) => {
    return new Promise(async (resolve, reject) => {

        // connect to mariadb/mysql
        let database = new Database()

        try {
            // all necessary sql queries
            const sql_queries = [
                'DELETE FROM users WHERE id=?'
            ]

            // all possible errors
            const db_errors = [
            ]

            // delete this intent
            let row_deleteuser = await database.query(sql_queries[0], [user_id])

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

// every api router will go through JWT verification first
router.use(
    [
        check('token', 'must have a token').exists()
    ],
    (req, res, next) => {

        // checking the results
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // if request datas is incomplete or error, return error msg
            return res.status(422).json({ success: false, errors: errors.mapped() });
        }
        else {

            // get the matched data
            // get the jwt token from body
            let token = matchedData(req).token;

            jwt.verify(token, process.env.jwtSecret, (err, decoded) => {
                if (err) {
                    return res.json({ success: false, errors: {jwt: 'json web token validate error'} });
                }
                else {

                    // Officially trusted this client!
                    req.decoded = decoded;
                    next();
                }
            });
        }

    }
)

// create a new project
router.post(
    '/project',
    [
        check('projectname', 'must have a project name').exists().isLength({ min: 1 }),
        check('description', 'must have a project description').exists().isLength({ min: 1 })
    ],
    (req, res) => {

        // checking the results
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // if request datas is incomplete or error, return error msg
            return res.status(422).json({ success: false, errors: errors.mapped() });
        }
        else {

            let userid = req.decoded.data.i
            let projectname = matchedData(req).projectname
            let proj_desc = matchedData(req).description

            createNewProject({ user_id: userid, proj_name: projectname, proj_desc: proj_desc }).then((proj_id) => {

                // send the result back to client
                res.setHeader('Content-type', 'application/json')
                res.send(JSON.stringify({ success: true }))

            }).catch((error) => {
                return res.status(422).json({ success: false, errors: error })
            })

        }
    }
)

// delete a project
router.delete(
    '/project',
    [
        check('projectname', 'must have a project name').exists().isLength({ min: 1 })
    ],
    (req, res) => {
        // come back and do this
        res.json({success: 'afsad'})
    }
)

// admin create a new chatbot
router.post(
    '/chatbot',
    [
        check('projectname', 'project name is required').exists().isLength({ min: 1 }),
        check('chatbotname', 'must have a chatbot name').exists().isLength({ min: 1 })
    ],
    (req, res) => {

        // checking the results
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // if request datas is incomplete or error, return error msg
            return res.status(422).json({ success: false, errors: errors.mapped() });
        }
        else {

            projectCreateNewChatbot({ proj_name: matchedData(req).projectname, user_id: req.decoded.data.i, chatbot_name: matchedData(req).chatbotname }).then((result) => {

                // send the result back to client
                res.setHeader('Content-type', 'application/json')
                res.send(JSON.stringify({ success: true }))

            }).catch((error) => {

                return res.status(422).json({ success: false, errors: error })

            })

        }

    }
)

// get all the projects
router.get('/projects', (req, res) => {
    getAllProjectsFromThisUser(req.decoded.data.i).then((allprojects) => {
        res.json({success: true, results: allprojects})
    }).catch((error) => {
        return res.status(422).json({ success: false, errors: error })
    })
})

// delete all the projects
router.delete('/projects', (req, res) => {
    res.json('all projects delete liao.. or is it?')
})

// delete the current user account
router.delete('/deleteuser', (req, res) => {

    deleteThisUser(req.decoded.data.i).then(()=>{
        res.json({success: true})
    }).catch((error)=>{
        return res.status(422).json({ success: false, errors: error })
    })

})

// Just a simple checking whether this token is available or not
router.post('/validatetoken', (req, res) => {

    // return some user info back
    getUserInfoByID(req.decoded.data.i).then((result) => {

        if (result) {
            res.setHeader('Content-type', 'application/json');
            res.send(JSON.stringify({ success: true, data: req.decoded, username: result.username }))
        }
        else {
            return res.status(422).json({ success: false, errors: 'no such user in db' })
        }

    }).catch((error) => {
        return res.status(422).json({ success: false, errors: error })
    })

})

module.exports = router;