// routes/bots.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const router = express.Router();
const authRequired = require("../middleware/auth");
const state = require("../state");

router.get("/api/bots/new/", authRequired, (req, res) => {
  res.json(state.bots);
});

router.post("/api/bot/new", authRequired, (req, res) => {
  const { name, version = "1.21.50" } = req.body;
  if (!name) return res.status(400).json({ message: "Bot name is required" });

  const exists = state.bots.some((bot) => bot.name === name);
  if (exists) return res.status(400).json({ message: "Bot name already exists" });

  // ... same file-writing logic as before, using state.bots.push(...)
});

router.post("/api/bots/run/:name", authRequired, (req, res) => {
  // uses state.runningProcesses, state.bots — same logic as before
});

module.exports = router;