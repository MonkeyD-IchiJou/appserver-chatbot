const router = require('express').Router();

router.post('/register', (req, res) => {
    res.send('register');
});

router.post('/logout', (req, res) => {
    res.send('logout');
});

router.post('/login', (req, res) => {
    res.send('login');
});

module.exports = router;