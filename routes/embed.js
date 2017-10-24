const router = require('express').Router();

router.get('/', (req, res) => {
    res.send('return a js embed code');
});

module.exports = router;