// routes/auth.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const sendMessageDis = require("../utils/discord");

const { credentialsPath } = require("../utils/folders");

// Only allow internal, relative paths — blocks "//evil.com", "https://evil.com", etc.
function safeRedirect(url) {
  if (typeof url === "string" && /^\/(?!\/)/.test(url)) {
    return url;
  }
  return "/dashboard";
}

router.get("/auth", (req, res) => {
  const redirect = safeRedirect(req.query.redirect);
  res.render("login", { redirect });
});

router.post("/auth", (req, res) => {
  const { username, password } = req.body;
  const redirect = safeRedirect(req.body.redirect || req.query.redirect);

  fs.readFile(credentialsPath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading credentials file:", err);
      sendMessageDis("Server is error");
      return res.status(500).render("login", { error: "Server error. Please try again later.", redirect });
    }

    let users;
    try {
      users = JSON.parse(data);
    } catch (parseErr) {
      console.error("Error parsing credentials file:", parseErr);
      sendMessageDis("Server is error");
      return res.status(500).render("login", { error: "Server error. Please try again later.", redirect });
    }

    if (users[username] === password) {
      req.session.loggedIn = true;
      req.session.username = username;
      sendMessageDis(`✅ **${username}** has logged in to the panel`);
      return res.redirect(redirect);
    }

    sendMessageDis(`❌ Someone is trying to login\n\n**Username:** ${username}\n**Password:** ${password}\n`);
    res.render("login", { error: "Invalid username or password", redirect });
  });
});

module.exports = router;