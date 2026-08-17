const fs = require("fs");
const path = require("path");
const { playersFilePath } = require("../utils/folders");
const state = require("../state");

function loadPlayers() {
  if (fs.existsSync(playersFilePath)) {
    try {
      const data = fs.readFileSync(playersFilePath, "utf-8");
      state.players = data.trim() ? JSON.parse(data) : {};
      //console.log("      - Loaded players from file:", state.players);
    } catch (error) {
      console.error("      - Error parsing players.json:", error);
      state.players = {};
    }
  } else {
    //console.log("      - No existing players file found. Starting fresh.");
    state.players = {};
  }
}

function savePlayers() {
  fs.writeFileSync(playersFilePath, JSON.stringify(state.players, null, 2), "utf-8");
  //console.log("Saved players to file.");
}

function updatePlayerStatus(playerName, status) {
  state.players[playerName] = status;
  savePlayers();
}
loadPlayers();


module.exports = {
  loadPlayers,
  savePlayers,
  updatePlayerStatus,
};