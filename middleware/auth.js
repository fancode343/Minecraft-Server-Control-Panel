function authRequired(req, res, next) {
  if (req.session && req.session.loggedIn) return next();

  // originalUrl includes the path + query string as the user typed/requested it
  const redirectTo = encodeURIComponent(req.originalUrl);

  return res.redirect(`/auth?redirect=${redirectTo}`);
}

module.exports = authRequired;