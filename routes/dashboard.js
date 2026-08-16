// routes/dashboard
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();
const sendMessageDis = require("../utils/discord");
const authRequired = require("../middleware/auth");


router.get("/dashboard", authRequired, (req, res) => {
  const settingsParam = req.query.settings;
  const helpParam = req.query.help;

  if (settingsParam === "1") {
    res.render("settings", { username: req.session.username });
  } else if (helpParam === "2") {
    res.render("help", { username: req.session.username });
  } else {
    res.render("panel", { username: req.session.username });
  }
});

router.post("/generate-hash", authRequired, (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.json({ success: false, error: "Password is required" });
  }

  const hash = crypto.createHash("sha256").update(password).digest("hex");
  res.json({ success: true, hash });
});

router.post("/shutdown", authRequired, (req, res) => {
  try {
    res.json({ success: true, message: "Node.js server is shutting down" });

    setTimeout(() => {
      console.log("Panel Requesting for Shutdown of the Node.js server...");
      process.kill(process.pid, "SIGINT");
    }, 300);
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});


module.exports = router;