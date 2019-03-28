const models = require('../models');
const Promise = require('bluebird');
const hashUtil = require('../lib/hashUtils');

module.exports.createSession = (req, res, next) => {
  let randomNum = hashUtil.createRandom32String();
  if (!Object.keys(req.cookies).length) {
    req.session = {}; 
    req.session.hash = randomNum;
    res.cookie('shortlyid', randomNum);
    next();
  } else {
    let cookieValue = Object.values(req.cookies);
    req.session = {};
    req.session.hash = cookieValue[0];
    next();
  }
  // return !Object.keys(req.cookies).length
  // .then(bool => {
  //   if (bool) {
  //     return models.Sessions.create()
  //     .then(hash => {
  //       req.session = {};
  //       req.session.hash = hash;
  //       res.cookie('shortlyid', hash)
  //     })
  //   }
  // })
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

