var express = require('express');
var router = express.Router();
const cdotlog = require('./../ndebug');

router.get('/', (req, res) => {
    // And insert something like this instead:
    res.json([{
        id: 1,
        username: "samsepi0l"
    }, {
        id: 2,
        username: "D0loresH4ze"
    }]);
});

module.exports = router;