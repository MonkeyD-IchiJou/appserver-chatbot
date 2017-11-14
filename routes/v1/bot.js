const router = require('express').Router();

router.get('/', (req, res) => {
    res.render('index', {
        bottoken: req.query.id
    });
});

module.exports = router;