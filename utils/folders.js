const path = require("path");
const fs = require("fs");

const serverPropertiesPath = path.join(__dirname, "../server", "server.properties");
const playersFilePath = path.join(__dirname, "../players.json");
const downloadsPath = path.join(__dirname, "../downloads");
const botsFilePath = path.join(__dirname, "../bots.json");

const serverWorldsPath = path.join(__dirname, "../server", "worlds");
if (!fs.existsSync(serverWorldsPath)) {
  fs.mkdirSync(serverWorldsPath, { recursive: true });
}

const activityLogPath = path.join(__dirname, "../activity_log.json");
const allowlistPath = path.join(__dirname, "../server/allowlist.json");
const credentialsPath = path.join(__dirname, "../credentials.json");
const messagesFilePath = path.join(__dirname, "..", "../messages.json");

if (!fs.existsSync(activityLogPath)) {
  fs.writeFileSync(activityLogPath, JSON.stringify([]), "utf8");
}

if (!fs.existsSync(botsFilePath)) {
  fs.writeFileSync(botsFilePath, JSON.stringify([], null, 2), "utf8");
}

module.exports = {
  serverPropertiesPath,
  playersFilePath,
  downloadsPath,
  botsFilePath,
  serverWorldsPath,
  activityLogPath,
  allowlistPath,
  credentialsPath,
  messagesFilePath,
};