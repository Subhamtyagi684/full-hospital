var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const redis = require('redis');
const client = redis.createClient();
const axios = require('axios');

var hasRedisClient;
client.on('error',()=>{hasRedisClient=false;return;});
client.connect()
.then(()=>{hasRedisClient=true;return;})
.catch(()=>{hasRedisClient=false;return;});
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/data',function(req,res,next){

        let val = client.get('test');
        val
        .then((data)=>{
                if(data){
                        return res.send({
                            cache: true,
                            data: data
                        });
                }else{
                        var callback =async function(isAlreadyWritten){
                        if(isAlreadyWritten){
                                let val  = client.get('test');
                                val.then((data)=>{
                                        if(data){
                                                res.send({
                                                    cache: true,
                                                    data: data
                                                })
                                        }else{
                                                res.send('no data found')
                                        }
                                }).catch(function(err){
                                                                                res.send('error in already',err);
                                })
                        }else{
                        client.set('being_update',1);
                        let recipe = await axios.get('https://openlibrary.org/api/books?bibkeys=ISBN:9780980200447&jscmd=data&format=json');
                        let setValue = client.set('test',JSON.stringify(recipe.data),{
                                EX: 10,
                                NX: true
                        });
                        setValue.then(
                                ()=> {
                                        client.set('being_update',0);
                                        return res.send({
                                            cache: false,
                                            data: recipe.data
                                        })
                                })
                        .catch(
                                ()=> {
                                        client.set('being_update',0);
                                        return res.send({
                                            cache: false,
                                            data: recipe.data
                                        })
                                });
                        }
                        }
                        pollForSetData(callback);

                }
        })
        .catch(()=>{return res.send('inside catch while getting')});

})
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


var pollStartTime;
function pollForSetData(cb,writtenByOtherThread){
        if(!writtenByOtherThread){
        pollStartTime = new Date().getTime();
    }
    if(pollStartTime){
        var now = new Date().getTime();
        if(now - pollStartTime > 30*1000){ //no polling more than threashold
            cb(true);
            return;
        }
    }
        client.get('being_update').then(function(result){
                if(result && result=='1'){
                        setTimeout(()=>{pollForSetData(cb,true)},100);
                }else{
                        cb();
                }
        })
}

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

