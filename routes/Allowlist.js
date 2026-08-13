// routes/dashboard
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const sendMessageDis = require("../utils/discord");
const authRequired = require("../middleware/auth");
const { allowlistPath } = require("../utils/folders");


router.get("/getAllowlist", (req, res) => {
  fs.readFile(allowlistPath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading allowlist.json:", err);
      return res.status(500).send("Internal Server Error");
    }
    try {
      const allowlist = JSON.parse(data);
      res.json(allowlist); // Send allowlist as JSON
    } catch (parseError) {
      console.error("Error parsing allowlist.json:", parseError);
      res.status(500).send("Internal Server Error");
    }
  });
});


module.exports = router;