const express = require('express');
const app = express();
const cdotlog = require('./../ndebug');
const path = require('path');

// Serve static files from the React app
app.use('/', express.static(path.join(__dirname, '../client/publicpage-botbuilder/build')));

app.get('/', (req, res) => {

    cdotlog('addf');

    // send the html files to the client to view the homepage
    res.sendFile(path.join(__dirname + '../client/publicpage-botbuilder/build/index.html'));
});

module.exports = app;