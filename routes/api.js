const router = require('express').Router();
var jwt = require('jsonwebtoken'); // sign with default (HMAC SHA256)

router.use((req, res, next) => {

    // get the jwt token from body
    let token = req.body.token;

    console.log('verifying token');

    if (token) {

        jwt.verify(token, process.env.jwtSecret, (err, decoded) => {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.', logout: true })
            } 
            else {
                req.decoded = decoded
                next()
            }
        })

    } 
    else {

        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        })
    }
})

router.post('/validatetoken', (req, res)=>{

    console.log(req.decoded);
    // send the result back to client
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify({ success: true, data: req.decoded }));

});

module.exports = router;