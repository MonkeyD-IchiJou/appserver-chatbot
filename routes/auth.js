const router = require('express').Router();
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');
var bcrypt = require('bcrypt');
const saltRounds = 10;

router.post(
    '/register',
    [
        check('email').isEmail().withMessage('must be an email'),
        check('password', 'passwords must be at least 5 chars long and contain one number').isLength({min: 5}).matches(/\d/).custom((value, {req, loc, path})=>{
            if (value !== req.body.re_password) {
                // throw error if passwords do not match
                throw new Error("Passwords don't match");
            } else {
                return value;
            }
        }),
        check('username', 'must have a username').exists().isLength({ min: 1 })
    ], 
    (req, res) => {

        // checking the results
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            // if post datas is incomplete or error, return error msg
            return res.status(422).json({errors: errors.mapped()});
        }
        else {

            // get the matched data
            const user = matchedData(req);

            // connect to mariadb/mysql
            const db = require('../db.js');

            // function pointer return a promise to check email in DB
            const checkEmailInDB = () => {
                return new Promise((resolve, reject) => {

                    // check with mariadb/mysql whether this email is in used or not
                    let query = db.query(
                        'SELECT EXISTS(SELECT * FROM users WHERE email=?) AS solution',
                        [user.email]
                    );

                    query.on('error', (err) => {
                        console.error(err);
                        reject({ errors: { msg: "email alr exists in the db" } });
                    }).on('result', (row) => {
                        row.solution ? reject({email: {msg: "email alr exists in the db"}}) : resolve('NotFound');
                    });

                });
            };

            // return a promise to register user in the db
            const registerUser = (hash) => {

                return new Promise((resolve, reject) => {

                    // if email is unique then
                    // insert this new user into my database
                    db.query(
                        'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
                        [user.email, user.username, hash],
                        (dberror, results, fields) => {
                            if (dberror) {
                                // send db error if got any
                                return reject(dberror);
                            }
                            else {

                                // successfully insert the new user into the db
                                resolve({ success: 'true' });

                            }
                        }
                    );

                });

            };

            checkEmailInDB().then((result) => {

                // hash the user password
                return bcrypt.hash(user.password, saltRounds);

            }).then((hash)=>{

                // store hash password in DB
                return registerUser(hash);

            }).then((result)=>{
                
                // successfully registered
                res.setHeader('Content-type', 'application/json');
                res.send(JSON.stringify(result));

            }).catch((result) => {

                // if catch any error msg, return back to client
                return res.status(422).json({ errors: result });

            });

        }
    }
);

router.post('/logout', (req, res) => {
    res.send('logout');
});

router.post(
    '/login',
    [
        check('email').isEmail().withMessage('must be an email'),
        check('password', 'passwords cannot be empty').isLength({ min: 1 })
    ],
    (req, res) => {

        // checking the results
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // if post datas is incomplete or error, return error msg
            return res.status(422).json({ errors: errors.mapped() });
        }
        else {

            // get the matched data
            const user = matchedData(req);

            // connect to mariadb/mysql
            const db = require('../db.js');

            // return promise to find the user in the db
            const findUserInDB = () => {

                return new Promise((resolve, reject) => {
                    // find the user in the db by using the email
                    db.query(
                        'SELECT password FROM users WHERE email=?',
                        [user.email],
                        (dberror, results, fields) => {
                            if (dberror) {
                                // send db error if got any
                                return reject(dberror);
                            }
                            else {

                                if (results.length > 0) {
                                    // results is not empty
                                    resolve(results[0].password);
                                }
                                else {
                                    // cannot find this user email in the db
                                    reject({ email: { msg: "email is not exist in the db" } })
                                }

                            }
                        }
                    );
                });

            };

            findUserInDB().then((hashpassword)=>{

                return bcrypt.compare(user.password, hashpassword.toString());

            }).then(function (compareResult) {

                // send the result back to client
                res.setHeader('Content-type', 'application/json');
                res.send(JSON.stringify({loginResult: compareResult}));

            }).catch((result)=>{

                // if catch any error msg, return back to client
                return res.status(422).json({ errors: result });

            });

        }

    }
);

module.exports = router;