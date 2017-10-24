const router = require('express').Router();
const cdotlog = require('./../ndebug');
const path = require('path');

router.get('/', (req, res) => {
    // send the html files to the client to view the homepage
    res.sendFile(path.join(__dirname + '/client/publicpage-botbuilder/build/index.html'));
});

module.exports = router;