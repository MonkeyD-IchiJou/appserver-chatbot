const router = require('express').Router();
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');
var jwt = require('jsonwebtoken'); // sign with default (HMAC SHA256)
var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
const saltRounds = 10;
const confirmationUrl = "http://localhost:8000/v1/auth/confirm";
const dbquery = require('../../dbquery');

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
                            reject(error);
                        }
                        else {
                            console.log('Email sent: ' + info.response);
                            resolve(info.response);
                        }
                    });
                });

            }

            // first check whether this email exist in the db or not
            dbquery.checkEmailInDB(db, user.email).then((result) => {

                // email is unique
                // hash the user password
                return bcrypt.hash(user.password, saltRounds);

            }).then((hash)=>{

                // successfully hashed password
                // store hash password in DB
                return dbquery.registerUser(db, user.email, user.username, hash);

            }).then((result)=>{

                // successfully register user
                // now find that user id
                return dbquery.findUserIdInDB(db, user.email);

            }).then((user_id)=>{

                // found the user_id, and then automatically register the default user plan
                return dbquery.registerUserPlan(db, user_id, 1);

            }).then(()=>{

                // after successfully register the user plan
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

            // return promise to sign a jwt for the user if trusted
            const signJWT = (trusted, user_id) => {

                return new Promise((resolve, reject) => {

                    if (trusted) {

                        // Officially trusted this client!

                        // rmb generate a new jwt to user
                        // will be expire in 12 hours
                        let token = jwt.sign({ data: { 'i': user_id, 'si': true } }, process.env.jwtSecret, { expiresIn: '12h' });

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

            };

            // start the authentication process
            dbquery.findUserPasswordAndConfirmInDB(db, user.email).then((hashpassword) => {

                return bcrypt.compare(user.password, hashpassword.toString());

            }).then(function (compareResult) {

                // after that find the user id for signJWT
                dbquery.findUserInfoInDB(db, user.email).then((userinfo) => {

                    // sign the jwt
                    signJWT(compareResult, userinfo.id).then((token) => {

                        // update the login time stamp first before sending the token back to client
                        dbquery.UpdateLoginTimestamp(db, user.email).then(() => {

                            // send the result back to client
                            // token will be generate here
                            res.setHeader('Content-type', 'application/json');
                            res.send(JSON.stringify({ authResult: true, jwt: token, username: userinfo.username }));

                        }).catch((result) => {
                            // if catch any error msg, return back to client
                            return res.status(422).json({ authResult: false, errors: result });
                        });

                    }).catch((result) => {
                        // if catch any error msg, return back to client
                        return res.status(422).json({ authResult: false, errors: result });
                    });

                }).catch((result) => {
                    // if catch any error msg, return back to client
                    return res.status(422).json({ authResult: false, errors: result });
                });

               

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
                    
                    dbquery.updateConfirmation(db, decoded.data.e).then((result)=>{

                        // successfully update the user confirmation
                        res.send(result);

                    }).catch((result)=>{

                        // update confirmation not successfull
                        res.send(result);

                    });

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