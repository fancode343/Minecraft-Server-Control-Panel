// routes/auth.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const sendMessageDis = require("../utils/discord");

const credentialsPath = path.join(__dirname, "..", "credentials.json");

router.get("/auth", (req, res) => {
  res.render("login");
});

router.post("/auth", (req, res) => {
  const { username, password } = req.body;

  fs.readFile(credentialsPath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading credentials file:", err);
      sendMessageDis("Server is error");
      return res.status(500).render("login", { error: "Server error. Please try again later." });
    }

    let users;
    try {
      users = JSON.parse(data);
    } catch (parseErr) {
      console.error("Error parsing credentials file:", parseErr);
      sendMessageDis("Server is error");
      return res.status(500).render("login", { error: "Server error. Please try again later." });
    }

    if (users[username] === password) {
      req.session.loggedIn = true;
      req.session.username = username;
      sendMessageDis(`✅ **${username}** has logged in to the panel`);
      return res.redirect("/dashboard");
    }

    sendMessageDis(`❌ Someone is trying to login\n\n**Username:** ${username}\n**Password:** ${password}\n`);
    res.render("login", { error: "Invalid username or password" });
  });
});

module.exports = router;