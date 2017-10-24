const router = require('express').Router();

router.get('/', (req, res) => {
    res.send('bot template render pls, using pug view engine');
});

module.exports = router;