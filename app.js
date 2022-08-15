var express = require('express');
var cookieParser = require('cookie-parser');
var routes = require('./routes/routes')

var app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.all('/*',routes);


module.exports = app;
