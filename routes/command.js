// routes/SSR.js
const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();
const authRequired = require("../middleware/auth");
const { broadcastLogs } = require("../services/WebSocket");
const state = require("../state");

router.post("/command", authRequired, (req, res) => {
  const command = req.body.command;
  if (state.minecraftProcess) {
    state.minecraftProcess.stdin.write(`${command}\n`);
    broadcastLogs(`[Command]: ${command}`);
  } else {
    broadcastLogs("[Error]: Server is not running");
    res.status(500).send("Server is not running.");
  }
});

module.exports = router;