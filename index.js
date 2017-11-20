require('./loadenv')() // load all the env
var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var cors = require('cors')
const path = require('path')
const bodyParser = require('body-parser')
const PORT = 8000

// Load View Engine
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// public static folder
app.use(express.static('public'))
// cross-origin-header.. enable all cors requests
app.use(cors())
// parse application/json
app.use(bodyParser.json({ limit: '50mb' }))
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))

// route to the specific version of api routes
app.use('/v1', require('./routes/v1'))

// socket io setup
require('./io-socket')(io)

// server start listening
server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
});
