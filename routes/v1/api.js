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

            }


            dbquery.findAllUserProjects(db, userid).then((results) => {

                if (results.length > 0) {

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
                else {

                    dbquery.createNewProject(db, userid, projectname, projectDescription).then(() => {

                        // send the result back to client
                        res.setHeader('Content-type', 'application/json');
                        res.send(JSON.stringify({ success: true }));

                    }).catch((result) => {

                        // if catch any error msg, return back to client
                        return res.status(422).json({ success: false, errors: result });

                    });;

                }

            }).catch((result)=>{

                // if catch any error msg, return back to client
                return res.status(422).json({ success: false, errors: result });

            });

        }

    }
);

module.exports = router;