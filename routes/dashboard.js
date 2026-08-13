// routes/dashboard
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const sendMessageDis = require("../utils/discord");
const authRequired = require("../middleware/auth");


router.get("/dashboard", authRequired, (req, res) => {
  const settingsParam = req.query.settings;

  if (settingsParam === "1") {
    res.render("settings", { username: req.session.username });
  } else {
    res.render("panel", { username: req.session.username });
  }
});


module.exports = router;