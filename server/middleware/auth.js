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
                });
            }
            res.cookie('shortlyid', parsedSession.hash);
            next();
          });
      });
  } else {
    req.session = { user: {}, hash: req.cookies };
    models.Sessions.get({ hash: req.cookies.shortlyid })
      .then(session => {
        if (session) {
          req.session.user = session.user;
          req.session.userId = session.userId;
          next();
        } else {
          models.Sessions.create()
            .then(session => {
              models.Sessions.get({ id: session.insertId })
                .then(parsedSession => {
                  req.session = parsedSession;
                  res.cookie('shortlyid', parsedSession.hash);
                  next();
                });
            });
        }
      })
      .catch(err => {
        console.log(err);
        next();
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