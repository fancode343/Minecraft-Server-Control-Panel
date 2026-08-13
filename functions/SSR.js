// routes/SSR.js
const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();
const authRequired = require("../middleware/auth");
const { broadcastLogs } = require("../services/WebSocket");
const state = require("../state");

router.post("/start", authRequired, (req, res) => {
  if (state.minecraftProcess) {
    broadcastLogs("[Server]: Server is already running.");
    return res.send("Server is already running.");
  }

  let responded = false;

  try {
    state.minecraftProcess = spawn("./bedrock_server", [], {
      cwd: "./server",
      env: { ...process.env, LD_LIBRARY_PATH: "./server" },
    });

    state.minecraftProcess.stdout.on("data", (data) => {
      const message = data.toString().trim();
      broadcastLogs(`[Server]: ${message}`);
      if (message.includes("Server started.") && !responded) {
        responded = true;
        broadcastLogs("[Server]: Server successfully started.");
        res.send("Server Started");
      }
    });

    state.minecraftProcess.stderr.on("data", (data) => {
      broadcastLogs(`[Error]: ${data.toString().trim()}`);
    });

    state.minecraftProcess.on("close", (code) => {
      broadcastLogs(`[Server]: Minecraft server stopped with code ${code}`);
      state.minecraftProcess = null;
    });

    broadcastLogs("[Server]: Starting server...");
  } catch (error) {
    console.error("Error starting server:", error);
    if (!responded) res.status(500).send("Error starting the server.");
  }
});

router.post("/restart", authRequired, (req, res) => {
  if (state.minecraftProcess) {
    state.minecraftProcess.stdin.write("stop\n");
    broadcastLogs("[Command]: stop");

    state.minecraftProcess.on("close", () => {
      state.minecraftProcess = spawn("./bedrock_server", [], {
        cwd: "./server",
        env: { ...process.env, LD_LIBRARY_PATH: "./server" },
      });

      state.minecraftProcess.stdout.on("data", (data) => {
        const message = data.toString().trim();
        broadcastLogs(`[Server]: ${message}`);
        if (message.includes("Server started.")) {
          broadcastLogs("[Server]: Server successfully restarted.");
          res.send("Server Restarted");
        }
      });

      state.minecraftProcess.stderr.on("data", (data) => {
        broadcastLogs(`[Error]: ${data.toString().trim()}`);
      });

      broadcastLogs("[Server]: Server Restarting");
    });
  } else {
    broadcastLogs("[Error]: Server is not running");
    res.send("Server is not running.");
  }
});

router.post("/stop", authRequired, (req, res) => {
  if (state.minecraftProcess) {
    state.minecraftProcess.stdin.write("stop\n");
    broadcastLogs("[Command]: stop");

    state.minecraftProcess.on("close", (code) => {
      broadcastLogs(`[Server]: Minecraft server stopped with code ${code}`);
      state.minecraftProcess = null;
      res.send("Server stopped successfully.");
    });
  } else {
    broadcastLogs("[Error]: Server is not running");
    res.send("Server is not running.");
  }
});

module.exports = router;