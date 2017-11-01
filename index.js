if(process.env.NODE_ENV !== 'production') {
    // explicitly loading variables from .env files if is in development
    require('dotenv').load();
}

// check which modes the app is running
console.log('NODE_ENV: ' + process.env.NODE_ENV + ' mode');

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var cors = require('cors');
const bodyParser = require('body-parser');
const PORT = 8000;

// cross-origin-header
app.use(cors({ origin: ['http://localhost:3000', 'http://example.com'] }));
// parse application/json
app.use(bodyParser.json({ limit: '50mb' }));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));

// route to the specific version of api routes
app.use('/v1', require('./routes/v1'));

// socket io setup
require('./io-socket')(io);

server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
