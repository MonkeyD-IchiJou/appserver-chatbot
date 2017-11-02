const router = require('express').Router();
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');
var jwt = require('jsonwebtoken'); // sign with default (HMAC SHA256)
var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
const saltRounds = 10;
const confirmationUrl = "http://localhost:8000/v1/auth/confirm";

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.email,
        pass: process.env.email_password
    }
});

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
            return res.status(422).json({success: "false", errors: errors.mapped()});
        }
        else {

            // get the matched data
            const user = matchedData(req);

            // connect to mariadb/mysql
            const db = require('../../db.js');

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
                        reject({ email: { msg: "email alr exists in the db" } });
                    }).on('result', (row) => {
                        row.solution ? reject({ email: { msg: "email alr exists in the db" } }) : resolve('UniqueEmail');
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
                                resolve('true');

                            }
                        }
                    );

                });

            };

            // send email to this user email for confirmation
            const sendConfirmationEmail = () => {

                return new Promise((resolve, reject)=>{

                    // sign a confirmation token first
                    let token = jwt.sign({ data: { 'e': user.email, 'ct': true } }, process.env.jwtSecret, { expiresIn: '3h' });

                    // then send the email to the user with the token parameters
                    var mailOptions = {
                        from: process.env.email,
                        to: user.email,
                        subject: 'Sending Email using Node.js',
                        html: `<h1>Welcome</h1><p>Confirm this registration pls 2</p><a href=${confirmationUrl + '?ctoken=' + token} target="_blank">Confirm</a>`
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.log(error);
                            reject(error);
                        }
                        else {
                            console.log('Email sent: ' + info.response);
                            resolve(info.response);
                        }
                    });
                });

            }

            checkEmailInDB().then((result) => {

                // hash the user password
                return bcrypt.hash(user.password, saltRounds);

            }).then((hash)=>{

                // store hash password in DB
                return registerUser(hash);

            }).then(()=>{

                // send the confirmation email to the user pls
                return sendConfirmationEmail();

            }).then((result)=>{
                
                // successfully registered
                res.setHeader('Content-type', 'application/json');
                res.send(JSON.stringify({ success: 'true' }));

            }).catch((result) => {

                // if catch any error msg, return back to client
                return res.status(422).json({ success: 'false', errors: result });

            });

        }
    }
);

router.post(
    '/',
    [
        check('email').isEmail().withMessage('must be an email'),
        check('password', 'passwords cannot be empty').isLength({ min: 1 })
    ],
    (req, res) => {

        // checking the results
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // if post datas is incomplete or error, return error msg
            return res.status(422).json({ authResult: false, errors: errors.mapped() });
        }
        else {

            // get the matched data
            const user = matchedData(req);

            // connect to mariadb/mysql
            const db = require('../../db.js');

            // return promise to find the user in the db
            const findUserInDB = () => {

                return new Promise((resolve, reject) => {
                    // find the user in the db by using the email
                    db.query(
                        'SELECT password, confirm FROM users WHERE email=?',
                        [user.email],
                        (dberror, results, fields) => {
                            if (dberror) {
                                console.log('db error when searching password from email');
                                // send db error if got any
                                return reject(dberror);
                            }
                            else {

                                if (results.length > 0) {
                                    // results is not empty

                                    if (!results[0].confirm) {
                                        // if the user havent confirm this email, reject
                                        reject({ emailconfirm: false });
                                    }
                                    else {
                                        // if the user alr confirm this email, then carry on
                                        resolve(results[0].password);
                                    }

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

            // return promise to sign a jwt for the user if trusted
            const signJWT = (trusted) => {

                return new Promise((resolve, reject) => {

                    if (trusted) {

                        // Officially trusted this client!

                        // rmb generate a new jwt to user
                        // will be expire in 12 hours
                        let token = jwt.sign({ data: { 'e': user.email, 'si': true } }, process.env.jwtSecret, { expiresIn: '12h' });

                        if(token) {
                            resolve(token);
                        }
                        else {
                            reject({ tokenError: { msg: "token not generated for some reason, server error"} });
                        }

                    }
                    else {

                        // not trusted, send errors message
                        reject({ password: { msg: "password incorrect" } });

                    }

                });

            }

            // start the authentication process
            findUserInDB().then((hashpassword)=>{

                return bcrypt.compare(user.password, hashpassword.toString());

            }).then(function (compareResult) {

                return signJWT(compareResult);

            }).then((token)=>{

                // send the result back to client
                // token will be generate here
                res.setHeader('Content-type', 'application/json');
                res.send(JSON.stringify({ authResult: true, jwt: token }));

            }).catch((result)=>{

                // if catch any error msg, return back to client
                return res.status(422).json({ authResult: false, errors: result });

            });

        }

    }
);

router.get('/confirm', (req, res)=>{
    // get the confirmation token
    let ctoken = req.query.ctoken;

    if(ctoken) {

        // first check for token validation
        jwt.verify(ctoken, process.env.jwtSecret, (err, decoded) => {

            if (err) {
                // json token maybe expired
                return res.json({ success: false, errors: { jwt: 'json web token validate error, registration not successful' } });
            }
            else {

                if (decoded.data.ct) {

                    // then update db about confimation
                    // connect to mariadb/mysql
                    const db = require('../../db.js');
                    db.query(
                        'UPDATE users SET confirm=1 WHERE email=(?)',
                        [decoded.data.e],
                        (dberror, results, fields) => {
                            if (dberror) {
                                // send db error if got any
                                console.log(dberror);
                                res.send('Invalid Token, u hacka?');
                            }
                            else {

                                // successfully update the user confirmation
                                res.send('Thank you for joining! ' + decoded.data.e);

                            }
                        }
                    );

                }
                else {
                    res.send('Invalid Token, u hacka?');
                }

            }

        });

    }
    else {
        res.send('Invalid Token, u hacka?');
    }

});



module.exports = router;