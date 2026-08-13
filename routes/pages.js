const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const sendMessageDis = require("../utils/discord");
const authRequired = require("../middleware/auth");

router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/auth"));
});
router.get("/", authRequired, (req, res) => res.redirect("/dashboard"));
router.use('/assets', express.static(path.join(__dirname, '../assets' )));
router.get("/bots-panel", authRequired, (req, res) => {
  res.render("bots-panel", { username: req.session.username });
});
router.get("/Allowlist", authRequired, (req, res) => {
  res.render("allowlist", { username: req.session.username });
})
router.get("/server-info", authRequired, (req, res) => {
  res.render("server-info", { username: req.session.username });
});
router.get("/activitylogs", authRequired, (req, res) => {
  res.render("activity-log", { username: req.session.username });
});
router.get("/command-center", authRequired, (req, res) => {
  res.render("command-center", { username: req.session.username });
});
module.exports = router;