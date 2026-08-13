const fs = require("fs");
const playersFilePath = require("../utils/folders")
const globalVariable = require("../utils/globalVariable")

function loadPlayers() {
  if (fs.existsSync(playersFilePath)) {
    try {
      const data = fs.readFileSync(playersFilePath, "utf-8");
      players = data.trim() ? JSON.parse(data) : {};
      console.log("      - Loaded players from file:", players);
    } catch (error) {
      console.error("      - Error parsing players.json:", error);
      players = {};
    }
  } else {
    console.log("      - No existing players file found. Starting fresh.");
    players = {};
  }
}

function savePlayers() {
  fs.writeFileSync(playersFilePath, JSON.stringify(players, null, 2), "utf-8");
  console.log("Saved players to file.");
}

function updatePlayerStatus(playerName, status) {
  players[playerName] = status;
}

loadPlayers();
module.exports = players;