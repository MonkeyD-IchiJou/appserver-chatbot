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

    // send the result back to client
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify({ success: true, data: req.decoded }));

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
            let useremail = req.decoded.data.e;
            let projectDescription = matchedData(req).description;

            // connect to mariadb/mysql
            const db = require('../../db.js');

            const returnsuccessmsg = () => {
                // send the result back to client
                res.setHeader('Content-type', 'application/json');
                res.send(JSON.stringify({ success: true }));
            };

            const checkSimilarProjectName = (results) => {

                return new Promise((resolve, reject) => {

                    for (let i = 0; i < results.length; ++i) {
                        if (projectname === results[i].name) {
                            reject('project name alr exist in your projects db, pls choose another name');
                        }
                    }

                    resolve(true);
                });

            }

            dbquery.findUserIdInDB(db, useremail).then((user_id)=>{

                dbquery.findAllUserProjects(db, user_id).then((results)=>{

                    if (results.length > 0) {

                        // check whether got any similar project name or not
                        checkSimilarProjectName(results).then(()=>{

                            // then create the new project
                            return dbquery.createNewProject(db, user_id, projectname, projectDescription);

                        }).then(()=>{

                            returnsuccessmsg();

                        }).catch((result)=>{

                            // if catch any error msg, return back to client
                            return res.status(422).json({ success: false, errors: result });

                        });
                        
                    }
                    else {

                        return dbquery.createNewProject(db, user_id, projectname, projectDescription);

                    }

                }).then(()=>{

                    returnsuccessmsg();

                }).catch((result)=>{

                    // if catch any error msg, return back to client
                    return res.status(422).json({ success: false, errors: result });

                });

            }).catch((result)=>{

                

            });
            
/*
            // see this user is eligible to continue to create more projects or not
            const checkUserEligibility = (results) => {

                return new Promise((resolve, reject)=>{

                    let user_id = results.user_id;
                    let totalProjects = results.totalProjects;

                    if(totalProjects > 0) {

                        // check whether got exceed projects creation limit or not
                        db.query(
                            'SELECT plan_id FROM users_plans WHERE user_id=?',
                            [user_id],
                            (dberror, results, fields) => {
                                if (dberror) {
                                    // send db error if got any
                                    return reject(dberror);
                                }

                                console.log(results);
                                resolve(user_id);
                            });

                    }
                    else {
                        // first time creating a new project
                        resolve(user_id);
                    }

                });
            };

            // secondly insert the new project into the db
            const createNewProject = (user_id) => {

                return new Promise((resolve, reject) => {
                    db.query(
                        'INSERT INTO projects (createdby, name, description) VALUES (?, ?, ?)',
                        [user_id, projectname, projectDescription],
                        (dberror, results, fields) => {
                            if (dberror) {
                                // send db error if got any
                                return reject(dberror);
                            }
                            else {

                                // successfully insert the new project into the db
                                resolve(user_id);

                            }
                        }
                    );
                });

            };

            // auto create the role for this user


            dbquery.findUserIdInDB(db, useremail).then((userid)=>{

                return findAllUserProjects(userid);

            }).then((results) => {

                return checkUserEligibility(results);

            }).then((userid) => {

                return createNewProject(userid);

            }).then(()=>{

                // send the result back to client
                res.setHeader('Content-type', 'application/json');
                res.send(JSON.stringify({ success: true })); 

            }).catch((result)=>{

                // if catch any error msg, return back to client
                return res.status(422).json({ success: false, errors: result });

            });*/

            
        }

    }
);

module.exports = router;