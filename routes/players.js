const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();
const authRequired = require("../middleware/auth");
const { broadcastLogs, getLogs } = require("../services/WebSocket");
const state = require("../state");
const { loadPlayers, savePlayers, updatePlayerStatus } = require("../services/loadPlayers");

let lastProcessedLogIndex = 0;

router.get("/getPlayers", authRequired, (req, res) => {
  if (state.minecraftProcess) {
    const allLogs = getLogs();
    // Only process new logs since last check
    const newLogs = allLogs.slice(lastProcessedLogIndex);
    lastProcessedLogIndex = allLogs.length;
    
    newLogs.forEach((log) => {
      const connectMatch = log.match(/Player connected: (.+?), xuid:/);
      if (connectMatch) updatePlayerStatus(connectMatch[1], "connected");

      const disconnectMatch = log.match(/Player disconnected: (.+?), xuid:/);
      if (disconnectMatch) updatePlayerStatus(disconnectMatch[1], "disconnected");

      if (log.match(/Server stop requested\./)) {
        Object.keys(state.players).forEach((playerName) => {
          state.players[playerName] = "disconnected";
        });
      }
    });

    res.json(
      Object.entries(state.players).map(([name, status]) => ({ name, status }))
    );
  } else {
    res.status(500).json({ error: "Server is not running" });
  }
});

module.exports = router;