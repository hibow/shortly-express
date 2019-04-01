const parseCookies = (req, res, next) => {
  if (typeof req.headers.cookie === 'string') {
    let allCookies = req.headers.cookie.split(';');
    let parsedCookies = {};
    allCookies.forEach(cookie => {
      let obj = cookie.split('=');
      parsedCookies[obj[0].trim().split('\'').join('')] = obj[1];
    });
    req.cookies = Object.assign({}, parsedCookies);
    return next();
  } else {
    req.cookies = {};
    return next();
  }
};

module.exports = parseCookies;