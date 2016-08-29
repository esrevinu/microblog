var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var redis = require('redis');
var redisClient = redis.createClient();
var partials = require('express-partials');
var MongoStore = require('connect-mongo')(expressSession);
var settings = require('./setting');
var flash = require('connect-flash');
var routes = require('./routes/index');
var fs = require('fs');
fs.stat('logs', function(err, stat) {
  if(err == null) {
    return;
  } else {
    fs.mkdirSync('logs', 0755);
  }
});

var morgan = require('morgan')
var accessLogStream = fs.createWriteStream('logs/access.log',{flag:'a'});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//Use ejs as view engine
app.set('view engine', 'ejs');
app.use(partials());
//Add log config(morgan)
app.use(morgan('combined',{stream:accessLogStream}));
// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(flash());
app.use(expressSession({
  secret:settings.cookieSecret,
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({
    url:'mongodb://'+settings.host+'/'+settings.db
  })
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next){
  var ua = req.headers['user-agent'];
  redisClient.zadd('online', Date.now(), ua, next);
});

//Replace app.dynamicHelpers
app.use(function(req,res,next){
  //Add online count in last 60 seconds
  var min = 60 * 1000;
  var ago = Date.now() - min;
  redisClient.zrevrangebyscore('online', '+inf', ago, function(err, users){
    if (err) return next(err);
    // req.online = users;
    res.locals.count = users.length;
  });

  //TODO Optimize
  var error = req.flash('error');
  var success = req.flash('success');
  res.locals.titles = ['首页','登录','注册','登出'];
  res.locals.user = req.session.user;
  res.locals.error = error.length?error:null;
  res.locals.success = success.length?success:null;

  next();
});
//Add routes
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
