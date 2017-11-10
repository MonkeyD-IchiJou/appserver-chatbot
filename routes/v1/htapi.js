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
                    return res.json({ success: false, errors: { jwt: 'json web token validate error' } });
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

router.post(
    '/addnew',
    (req, res) => {

        let userid = req.decoded.data.i;

        let hoteldatas = {
            StartTime: req.body.StartTime,
            EndTime: req.body.EndTime,
            CreationDate: req.body.CreationDate,
            EventName: req.body.EventName,
            Level: req.body.Level,
            RoomName: req.body.RoomName,
            EventDetails: req.body.EventDetails,
            ContactPerson: req.body.ContactPerson,
            ContactNumber: req.body.ContactNumber
        };

        const db = require('../../db.js');

        dbquery.createNewHotelData(db, userid, hoteldatas).then((result)=>{
            console.log(result);
            res.setHeader('Content-type', 'application/json');
            res.send(JSON.stringify({ success: true }));
        }).catch((result)=>{
            console.log(result);
            res.setHeader('Content-type', 'application/json');
            res.send(JSON.stringify({ success: false }));
        });

        
    }
);

router.get(
    '/getalldatas',
    (req, res) => {

        let userid = req.decoded.data.i;

        const db = require('../../db.js');

        dbquery.findAllHotelDataInfo(db, userid).then((result)=>{
            console.log(result);
            res.setHeader('Content-type', 'application/json');
            res.send(JSON.stringify({ result: result }));
        }).catch((result)=>{
            console.log(result);
            res.setHeader('Content-type', 'application/json');
            res.send(JSON.stringify({ error: false }));
        });
    }
);

module.exports = router;