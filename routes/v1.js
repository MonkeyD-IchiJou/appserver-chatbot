const router = require('express').Router();

// /auth route for authentication purposes
router.use('/auth', require('./v1/auth'));

// /api routes (may need to be authenticate first before used)
router.use('/api', require('./v1/api'));

// /htapi routes (may need to be authenticate first before used)
router.use('/htapi', require('./v1/htapi'));

// /bot html template render routes
router.use('/bot', require('./v1/bot'));

// get embed js file
router.use('/embed', require('./v1/embed'));

module.exports = router;