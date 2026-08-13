const path = require("path");
const fs = require("fs");

const serverPropertiesPath = path.join(__dirname, "../server", "server.properties");
const playersFilePath = path.join(__dirname, "../players.json");
const downloadsPath = path.join(__dirname, "../downloads");
const serverWorldsPath = path.join(__dirname, "../server", "worlds");
const activityLogPath = path.join(__dirname, "../activity_log.json");
const allowlistPath = path.join(__dirname, "../server/allowlist.json");

if (!fs.existsSync(activityLogPath)) {
  fs.writeFileSync(activityLogPath, JSON.stringify([]), "utf8");
}

module.exports = {
  serverPropertiesPath,
  playersFilePath,
  downloadsPath,
  serverWorldsPath,
  activityLogPath,
  allowlistPath
};