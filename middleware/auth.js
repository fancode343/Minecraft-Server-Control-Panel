function authRequired(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.redirect("/auth");
}

module.exports = authRequired;