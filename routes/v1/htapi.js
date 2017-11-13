const router = require('express').Router();
var jwt = require('jsonwebtoken'); // sign with default (HMAC SHA256)
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');
const dbquery = require('../../dbquery');

// testing stuff
var createNewHotelData = (db, user_id, hoteldata) => {

    return new Promise((resolve, reject) => {
        db.query(
            'INSERT INTO hotelstuff (user_id, StartTime, EndTime, CreationDate, EventName, Level, RoomName, EventDetails, ContactPerson, ContactNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, hoteldata.StartTime, hoteldata.EndTime, hoteldata.CreationDate, hoteldata.EventName, hoteldata.Level, hoteldata.RoomName, hoteldata.EventDetails, hoteldata.ContactPerson, hoteldata.ContactNumber],
            (dberror, results, fields) => {
                if (dberror) {
                    // send db error if got any
                    reject(dberror);
                }
                else {

                    // successfully insert the new project into the db
                    resolve(true);

                }
            }
        );
    });

};

// testing stuff
var findAllHotelDataInfo = (db, user_id) => {

    return new Promise((resolve, reject) => {
        db.query(
            'SELECT id, StartTime, EndTime, CreationDate, EventName, Level, RoomName, EventDetails, ContactPerson, ContactNumber FROM hotelstuff WHERE user_id=?',
            [user_id],
            (dberror, results, fields) => {
                if (dberror) {
                    // send db error if got any
                    reject(dberror);
                }
                else {
                    // return user id and current total projects number
                    resolve(results);
                }
            }
        );
    });

};

var deleteSingleHotelData = (db, htdataid) => {
    return new Promise((resolve, reject) => {
        db.query(
            'DELETE FROM hotelstuff where id=?',
            [htdataid],
            (dberror, results, fields)=>{
                if (dberror) {
                    // send db error if got any
                    reject(dberror);
                }
                else {
                    // return user id and current total projects number
                    resolve(results);
                }
            }
        );
    });
}

var editHotelData = (db, hotel_id, hoteldata) => {

    return new Promise((resolve, reject) => {
        db.query(
            'UPDATE hotelstuff SET StartTime = ?, EndTime = ?, CreationDate = ?, EventName = ?, Level = ?, RoomName = ?, EventDetails = ?, ContactPerson = ?, ContactNumber = ? WHERE id=?',
            [hoteldata.StartTime, hoteldata.EndTime, hoteldata.CreationDate, hoteldata.EventName, hoteldata.Level, hoteldata.RoomName, hoteldata.EventDetails, hoteldata.ContactPerson, hoteldata.ContactNumber, hotel_id],
            (dberror, results, fields) => {
                if (dberror) {
                    // send db error if got any
                    reject(dberror);
                }
                else {

                    // successfully insert the new project into the db
                    resolve(true);

                }
            }
        );
    });

};

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

        createNewHotelData(db, userid, hoteldatas).then((result)=>{
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

router.post('/editdata', (req, res) => {

        let userid = req.decoded.data.i;
        let htdataid = req.body.htdataid;

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

        editHotelData(db, htdataid, hoteldatas).then((result) => {
            console.log(result);
            res.setHeader('Content-type', 'application/json');
            res.send(JSON.stringify({ success: true }));
        }).catch((result) => {
            console.log(result);
            res.setHeader('Content-type', 'application/json');
            res.send(JSON.stringify({ success: false }));
        });

    }
);

router.post('/deldata', (req, res) => {

    let userid = req.decoded.data.i;
    let htdataid = req.body.htdataid;

    const db = require('../../db.js');

    deleteSingleHotelData(db, htdataid).then((result) => {
        console.log(result);
        res.setHeader('Content-type', 'application/json');
        res.send(JSON.stringify({ result: result }));
    }).catch((result) => {
        console.log(result);
        res.setHeader('Content-type', 'application/json');
        res.send(JSON.stringify({ error: false }));
    });
});

router.get(
    '/getalldatas',
    (req, res) => {

        let userid = req.decoded.data.i;

        const db = require('../../db.js');

        findAllHotelDataInfo(db, userid).then((result)=>{
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