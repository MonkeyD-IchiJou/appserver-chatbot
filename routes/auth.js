const router = require('express').Router();

router.post('/register', (req, res) => {

    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    const re_password = req.body.re_password;

    //const db = require('../db.js');

    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify({hey: 'adfadf', yo: 'adfafd'}));
});

router.post('/logout', (req, res) => {
    res.send('logout');
});

router.post('/login', (req, res) => {
    res.send('login');
});

module.exports = router;