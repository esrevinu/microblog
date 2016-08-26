var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var User = require('../models/User');
var Post = require('../models/Post');

/* GET home page. */
router.get('/', function(req, res) {
    Post.get(null, function(err, posts) {
        if (err) {
            posts = [];
        }
        res.render('index', {
            title: res.locals.titles[0],
            posts: posts
        });
    });
});
// GET register page
router.get('/reg',checkNotLogin);
router.get('/reg', function(req, res) {
  res.render('reg', { title: '注册' });
});
//POST register page
router.post('/reg',checkNotLogin);
router.post('/reg', function(req, res) {
  //Check the repeated password is the same as the first one
  if(req.body['password-repeat']!=req.body['password']){
    req.flash('error','两次输入的密码不一致');
    return res.redirect('/reg');
  }
  var md5 = crypto.createHash('md5');
  var password = md5.update(req.body.password).digest('base64');
  var newUser = new User({
      name:req.body.username,
      password:password
  });
  //Check if the username has existed
  User.get(newUser.name,function(err,user){
      if(user)
          err = 'Username already exists.';
      if(err){
          req.flash('error',err);
          return res.redirect('/reg');
      }
      //If doesn't exist then add new user
      newUser.save(function(err){
          if(err){
              req.flash('error',err);
              return res.redirect('/reg');
          }
          req.session.user = newUser;
          req.flash('success','注册成功');
          res.redirect('/');
      });
  })
});

//GET login page
router.get('/login',checkNotLogin);
router.get('/login', function(req, res) {
    res.render('login', { title: '登录' });
});
//POST login page
router.post('/login',checkNotLogin);
router.post('/login', function(req, res) {
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('base64');
    User.get(req.body.username, function(err, user) {
        if (!user) {
            req.flash('error', '用户不存在');
            return res.redirect('/login');
        }
        if (user.password != password) {
            req.flash('error', '用户口令错误');
            return res.redirect('/login');
        }
        req.session.user = user;
        req.flash('success', '登入成功');
        res.redirect('/');
    });
});
//GET logout page
router.get('/logout',checkLogin);
router.get('/logout', function(req, res) {
    req.session.user = null;
    req.flash('success', '登出成功');
    res.redirect('/');
});
//POST post page
router.post('/post', checkLogin);
router.post('/post', function(req, res) {
    var currentUser = req.session.user;
    var post = new Post(currentUser.name, req.body.post);
    post.save(function(err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        req.flash('success', '发表成功');
        res.redirect('/u/' + currentUser.name);
    });
});
//GET user page
router.get('/u/:user', function(req, res) {
    User.get(req.params.user, function(err, user) {
        if (!user) {
            req.flash('error', '用户不存在');
            return res.redirect('/');
        }
        var q = {};
        q.user = user.name;
        Post.get(q, function(err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('user', {
                title: user.name,
                posts: posts
            });
        });
    });
});
//GET search page
router.get('/search', function(req, res) {
    var query = req.query.query;
    var q={};
    q.post = new RegExp("^.*"+query+".*$");
    Post.get(q, function(err, posts) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        // var postsFormatted = posts.map(function(obj){
        //     var regExp = new RegExp(query, 'gi');
        //     var rObj = JSON.parse(JSON.stringify( obj ) );
        //     rObj.post = obj.post.replace(regExp,'<code>'+query+'</code>');
        //     return rObj;
        // });
        // console.log(postsFormatted);
        res.render('index', {
            title: res.locals.titles[0],
            posts: posts
        });
    });
});



function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登入');
        return res.redirect('/login');
    }
    next();
}
function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登入');
        return res.redirect('/');
    }
    next();
}

module.exports = router;
