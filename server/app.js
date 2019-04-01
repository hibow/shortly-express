const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
//use middleware
const CookieParser = require('./middleware/cookieParser');





app.get('/signup',
  (req, res) => {
    res.render('signup');
  });

app.get('/login',
  (req, res) => {
    res.render('login');
  });

app.get('/', CookieParser, Auth.createSession,
  (req, res, next) => {
    let bool = models.Sessions.isLoggedIn(req.session);
    if (bool) {
      console.log('main: to main', req.session);
      res.render('index');
    } else {
      console.log('Main: to login');
      res.redirect('/login');
    }
  });


app.get('/create', CookieParser, Auth.createSession,
  (req, res) => {
    let bool = models.Sessions.isLoggedIn(req.session);
    if (bool) {
      res.render('index');
    } else {
      res.redirect('/login');
    }
  });

app.get('/logout', CookieParser, Auth.deleteSession,
  (req, res) => {
    console.log('I log out!');
    res.redirect('/login');
  });

app.get('/links', CookieParser, Auth.createSession,
  (req, res, next) => {
    console.log('run get links');
    let bool = models.Sessions.isLoggedIn(req.session);
    if (bool) {
      console.log('get all links');
      models.Links.getAll()
        .then(links => {
          res.status(200).send(links);
        })
        .error(error => {
          //res.redirect('index');
          console.log('500 error');
          res.status(500).send(error);
        });
    } else {
      console.log('link to login');
      res.redirect('/login');
    }
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

//User
app.post('/signup',
  (req, res, next) => {
    let username = req.body.username;
    let pw = req.body.password;
    return models.Users.get({ username })
      .then(user => {
        if (user) {
          res.redirect('/signup');
        } else {
          console.log('go to sign up');
          models.Users.create({ username, password: pw });
          next();
        }
      })
      .catch(err => {
        console.log(err);
      });
  }, [CookieParser, Auth.createSession, function (req, res, next) {
    console.log('go to main page');
    res.redirect('/');
  }]);

app.post('/login',
  (req, res, next) => {
    return models.Users.get({ username: req.body.username })
      .then(obj => {
        // console.log(obj, 'user object')
        if (obj.username) {
          return models.Users.compare(req.body.password, obj.password, obj.salt);
        }
      })
      .then(match => {
        if (match) {
          next();
        } else {
          res.redirect('/login');
        }
      })
      .catch(err => {
        res.redirect('/login');
        //next();
      });
  }, CookieParser, Auth.createSession, function (req, res, next) {
    res.redirect('/');
  });
/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {
  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
