const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (!Object.keys(req.cookies).length) { // checks to see if a cookie exist
    models.Sessions.create()
      .then(session => {
        models.Sessions.get({ id: session.insertId })
          .then(parsedSession => {
            req.session = parsedSession;
            if (req.body.username) {
              models.Users.get({ username: req.body.username })
                .then(userRecord => {
                  req.session.user = userRecord;
                  req.session.userId = userRecord.id;
                  models.Sessions.update({ id: parsedSession.id }, { userId: req.session.userId });
                })
                .then((session) => {
                  res.cookie('shortlyid', parsedSession.hash);
                  next();
                })
                .catch((error) => {
                  throw error;
                });
            } else {
              res.cookie('shortlyid', parsedSession.hash);
              next();
            }
          });
      });
  } else {
    req.session = { user: {}, hash: req.cookies.shortlyid };
    models.Sessions.get({ hash: req.cookies.shortlyid })
      .then(session => {
        if (session && session.user) {
          req.session.user = session.user;
          req.session.userId = session.userId;
          res.cookie('shortlyid', req.session.hash);
          next();
        } else if (req.body.username && session) {
          return models.Users.get({username: req.body.username})
            .then( (user) => {
              req.session.user = user;
              req.session.userId = user.id;
              return models.Sessions.update({id: session.id}, {userId: req.session.userId});
            })
            .then( (session) => {
              res.cookie('shortlyid', req.session.hash);
              next();
            })
            .catch( (err) => {
              console.log(err);
              next();
            });
        } else if (session) {
          req.session = session;
          res.cookie('shortlyid', req.session.hash);
          next();
        } else {
          models.Sessions.create()
            .then(session => {
              models.Sessions.get({ id: session.insertId })
                .then(parsedSession => {
                  req.session = parsedSession;
                  if (req.body.username) {
                    models.Users.get({ username: req.body.username })
                      .then(userRecord => {
                        req.session.user = userRecord;
                        req.session.userId = userRecord.id;
                        models.Sessions.update({ id: parsedSession.id }, { userId: req.session.userId });
                      })
                      .then((session) => {
                        res.cookie('shortlyid', parsedSession.hash);
                        next();
                      })
                      .catch((error) => {
                        throw error;
                      });
                  } else {
                    res.cookie('shortlyid', parsedSession.hash);
                    next();
                  }
                });
            });
        }
      })
      .catch(err => {
        console.log(err);
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.deleteSession = (req, res, next) => {
  // if (Object.keys(req.cookies).length) {
  req.session = { user: {}, hash: req.cookies };
  models.Sessions.delete({ hash: req.cookies.shortlyid })
    .then(() => {
      req.session = {};
      req.cookies = {};
      req.cookie = {};
      this.createSession(req, res, next);
    });
  // }
};