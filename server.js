var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8181;

var bodyParser   = require('body-parser');
var morgan       = require('morgan');



app.use(morgan('dev')); // log every request to the console
app.use(bodyParser()); // get information from html forms


// routes ======================================================================
require('./app/routes.js')(app); // load our routes and pass in our app

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
