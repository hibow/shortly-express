const models = require('../models');
const Promise = require('bluebird');
const hashUtil = require('../lib/hashUtils');

module.exports.createSession = (req, res, next) => {
  console.log('run createSession');
  if (!Object.keys(req.cookies).length) {
    models.Sessions.create()
      .then(session => {
        models.Sessions.get({ id: session.insertId })
          .then(parsedSession => {
            req.session = parsedSession;
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

