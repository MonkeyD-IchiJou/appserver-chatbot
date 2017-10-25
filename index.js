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

// /auth route for authentication purposes
app.use('/auth', require('./routes/auth'));

// /api routes (may need to be authenticate first before used)
app.use('/api', require('./routes/api'));

// /bot html template render routes
app.use('/bot', require('./routes/bot'));

// get embed js file
app.use('/embed', require('./routes/embed'));

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
