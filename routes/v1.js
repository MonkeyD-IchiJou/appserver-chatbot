const router = require('express').Router()

// /auth route for authentication purposes
router.use('/auth', require('./v1/auth'))

// /apiadmin routes (need to be authenticate the admin first before used)
router.use('/apiadmin', require('./v1/api'))

// /botclient for client interact with my chatbot
router.use('/botclient', require('./v1/bot'))

// get embed js file for chatbot
router.use('/embedbotclient', require('./v1/embed'))

module.exports = router