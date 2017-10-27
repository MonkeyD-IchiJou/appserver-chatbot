if(process.env.NODE_ENV !== 'production') {
    // explicitly loading variables from .env files if is in development
    require('dotenv').load();
}

// check which modes the app is running
console.log('NODE_ENV: ' + process.env.NODE_ENV + ' mode');

let express = require('express');
let cors = require('cors');
const bodyParser = require('body-parser');
let app = express();
let PORT = 8000;

// cross-origin-header
app.use(cors({
    origin: 'http://localhost:3000'
}));

// body parser
app.use(bodyParser.json());

// route to the specific version of api routes
app.use('/v1', require('./routes/v1'));

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
