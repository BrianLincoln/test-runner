var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8181;
var mongoose = require('mongoose');

var bodyParser   = require('body-parser');
var morgan       = require('morgan');

var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

app.use(morgan('dev')); // log every request to the console
app.use(bodyParser()); // get information from html forms

app.use(express.static('./public'));

// routes ======================================================================
require('./app/routes.js')(app); // load our routes and pass in our app

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
