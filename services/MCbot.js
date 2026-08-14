const { botsFilePath } = require("../utils/folders");
const fs = require("fs");

if (fs.existsSync(botsFilePath)) {
  try {
    const data = fs.readFileSync(botsFilePath, 'utf8');
    bots = JSON.parse(data);
    console.log("Bots loaded:", bots);
  } catch (err) {
    console.error("Error reading bots.json:", err);
  }
}