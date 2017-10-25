const router = require('express').Router();
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');

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

            let checkEmailInDB = () => {
                return new Promise((resolve, reject) => {

                    // check with mariadb/mysql whether this email is in used or not
                    let query = db.query(
                        'SELECT EXISTS(SELECT * FROM users WHERE email=?) AS solution',
                        [user.email]
                    );

                    query.on('error', (err) => {
                        console.log(err);
                        throw err;
                    }).on('result', (row) => {
                        row.solution ? reject({email: {msg: "email alr exists in the db"}}) : resolve('NotFound');
                    });

                });
            }

            let registerUser = () => {

                return new Promise((resolve, reject) => {

                    // if email is unique then
                    // insert this new user into my database
                    db.query(
                        'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
                        [user.email, user.username, user.password],
                        (dberror, results, fields) => {
                            if (dberror) {
                                // send db error if got any
                                return reject(dberror);
                            }
                            else {

                                // successfully insert the new user into the db 
                                console.log(results);
                                console.log(fields);

                                // return JWT token back to client to store in the localstorage
                                resolve({ success: 'true', jwt: 'adfafd' });

                            }
                        }
                    );

                });

            }

            checkEmailInDB().then((result) => {

                return registerUser();

            }).then((result)=>{
                
                // successfully registered and send the jwt login token back to client
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

router.post('/login', (req, res) => {
    res.send('login');
});

module.exports = router;