const router = require('express').Router();

router.get('/', (req, res)=>{
    res.send('api get request');
});

module.exports = router;