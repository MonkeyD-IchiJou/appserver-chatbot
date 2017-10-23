var express = require('express');
var router = express.Router();
const cdotlog = require('./../ndebug');

router.get('/', (req, res) => {
    // And insert something like this instead:
    res.send('private page');
});

module.exports = router;