var settings = require('../setting');
var Db = require('mongodb').Db;
var Connection = require('mongodb').CoreConnection;
var Server = require('mongodb').Server;
module.exports=new Db(settings.db,new Server(settings.host,settings.port,{}));