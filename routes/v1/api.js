const router = require('express').Router();
var jwt = require('jsonwebtoken'); // sign with default (HMAC SHA256)
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');
const dbquery = require('../../dbquery');


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

            console.log('verifying token');

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
);

// Just a simple checking whether this token is available or not
router.post('/validatetoken', (req, res) => {

    const db = require('../../db.js');

    dbquery.findUserInfoByID(db, req.decoded.data.i).then((result)=>{
        // send the result back to client
        res.setHeader('Content-type', 'application/json');
        res.send(JSON.stringify({ success: true, data: req.decoded, username: result.username }));
    }).catch((result)=>{
        console.log(result);
    });

});

// User can create a project
router.post(
    '/newproject',
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
            let projectname = matchedData(req).projectname;
            let userid = req.decoded.data.i;
            let projectDescription = matchedData(req).description;

            // connect to mariadb/mysql
            const db = require('../../db.js');

            const checkSimilarProjectName = (results) => {

                return new Promise((resolve, reject) => {

                    for (let i = 0; i < results.length; ++i) {
                        if (projectname === results[i].name) {
                            reject('project name alr exist in your projects db, pls choose another name');
                        }
                    }

                    resolve(true);
                });

            };

            dbquery.findPlanIdInDB(db, userid).then((plan_id)=>{

                return dbquery.findPlansInDB(db, plan_id)

            }).then((plans)=>{

                dbquery.findAllUserProjects(db, userid).then((results) => {

                    if(results.length >= plans.projects_limit){
                        // send the result back to client
                        res.setHeader('Content-type', 'application/json');
                        res.send(JSON.stringify({ success: false, msg: 'exceed the project limit' }));
                    }

                    else if (results.length > 0) {

                        // check whether got any similar project name or not
                        checkSimilarProjectName(results).then(() => {

                            // then create the new project
                            return dbquery.createNewProject(db, userid, projectname, projectDescription);

                        }).then(() => {

                            // send the result back to client
                            res.setHeader('Content-type', 'application/json');
                            res.send(JSON.stringify({ success: true }));

                        }).catch((result) => {

                            // if catch any error msg, return back to client
                            return res.status(422).json({ success: false, errors: result });

                        });

                    }

                    else if (results.length == 0) {

                        dbquery.createNewProject(db, userid, projectname, projectDescription).then(() => {

                            // send the result back to client
                            res.setHeader('Content-type', 'application/json');
                            res.send(JSON.stringify({ success: true }));

                        }).catch((result) => {

                            // if catch any error msg, return back to client
                            return res.status(422).json({ success: false, errors: result });

                        });

                    }

                }).catch((result) => {

                    // if catch any error msg, return back to client
                    return res.status(422).json({ success: false, errors: result });

                });

            }).catch((result)=>{

                return res.status(422).json({ success: false, errors: result });

            });
        }
});

// get all the projects related to this user
router.post('/getprojects', (req, res) => {

    let userid = req.decoded.data.i;

    // connect to mariadb/mysql
    const db = require('../../db.js');

    dbquery.findAllUserProjectsInfo(db, userid).then((results) => {
        // send the result back to client
        res.setHeader('Content-type', 'application/json');
        res.send(JSON.stringify({success: true, results: results }));
    }).catch((result) => {
        console.log('adf');
        return res.status(422).json({ success: false, errors: result });
    });

});

router.post(
    '/newchatbot',
    [
        check('chatbotName', 'must have a chatbot name').exists().isLength({ min: 1 }),
        check('apitoken', 'apitoken is require').exists().isLength({ min: 1 })
    ],
    (req, res) => {

        // checking the results
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // if request datas is incomplete or error, return error msg
            return res.status(422).json({ success: false, errors: errors.mapped() });
        }
        else {

            let chatbotName = matchedData(req).chatbotName;
            let apitoken = matchedData(req).apitoken;

            const db = require('../../db.js');

            dbquery.getChatbots(db, apitoken).then((results) => {

                if(results.length > 0){
                    return new Promise((resolve, reject) => {
                        reject('one project one chatbot only');
                    });
                }
                else {
                    return dbquery.createChatBot(db, apitoken, chatbotName)
                }

            }).then(() => {

                // send the result back to client
                res.setHeader('Content-type', 'application/json');
                res.send(JSON.stringify({ success: true }));

            }).catch((result) => {
                return res.status(422).json({ success: false, errors: result });
            })

        }

    }
);



module.exports = router;