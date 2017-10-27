const router = require('express').Router();
var jwt = require('jsonwebtoken'); // sign with default (HMAC SHA256)
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');

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

module.exports = router;