if(process.env.NODE_ENV !== 'production') {
    // explicitly loading variables from .env files if is in development
    require('dotenv').load();
}

// check which modes the app is running
console.log('NODE_ENV: ' + process.env.NODE_ENV + ' mode');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const home = require('./routes/home');
const cdotlog = require('./ndebug');

app.use('/', home);

app.listen(PORT, ()=>{
    cdotlog(`listening on port ${PORT}`);
});
