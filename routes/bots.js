const fs = require("fs");
const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();
const authRequired = require("../middleware/auth");
const { exec } = require("child_process");
const path = require("path");
const fsExtra = require("fs-extra");
const state = require("../state");
const { botsFilePath } = require("../utils/folders");

const botDirectoryPath = path.join(__dirname, "..", "bots");

router.get(["/api/bots/new", "/api/bots/new/"], authRequired, (req, res) => {
  res.json(Array.isArray(state.bots) ? state.bots : []);
});

router.post("/api/bot/new", authRequired, (req, res) => {
  const { name, version = "1.21.50" } = req.body; // Default version if not provided

  if (!name) return res.status(400).json({ message: "Bot name is required" });

  const exists = state.bots.some((bot) => bot.name === name);
  if (exists) return res.status(400).json({ message: "Bot name already exists" });

  // Define the real bot file under the project root bots folder
  const folderPath = botDirectoryPath;
  const filePath = path.join(folderPath, `${name}.js`);

  const codeContent = `
const bedrock = require('bedrock-protocol');
const readline = require('readline');

// Create the client
const client = bedrock.createClient({ 
  host: 'localhost', 
  port: 19132, 
  version: '${version}', 
  username: '${name}', 
  offline: false,
});

console.log("Connecting...");

// Handle spawn event
client.on('spawn', () => {
  console.log("Online");
});

// Handle disconnection
client.on('disconnect', (reason) => {
  console.error("Disconnected");
  cleanupAndExit(); // Call cleanup when disconnected
});

// Handle connection close
client.on('close', (reason) => {
  console.error("Connection closed:");
  cleanupAndExit(); // Call cleanup when connection is closed
});

// Setup readline interface for manual stop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', (input) => {
  if (input.trim().toLowerCase() === 'stop') {
    console.log('Stopping the process...');
    cleanupAndExit();
  }
});

// Cleanup and exit function
function cleanupAndExit() {
  console.log('Cleaning up resources before exit...');
  client.removeAllListeners(); // Remove all client listeners
  client.disconnect('Client stopping as requested.'); // Send disconnect message
  rl.close(); // Close the readline interface

  // Wait briefly before exiting
  setTimeout(() => {
    console.log('Exiting...');
    process.exit(0); // Terminate the process
  }, 1000);
}
`;

  // Ensure the real root bot folder exists
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Write the bot file
  fs.writeFile(filePath, codeContent.trim(), (err) => {
    if (err) {
      return res.status(500).json({ message: "Error creating the bot file" });
    }

    state.bots.push({ name, status: "offline" }); // Add the bot to the list only on success

    // Save bots to a JSON file to persist between restarts
    fs.writeFileSync(botsFilePath, JSON.stringify(state.bots, null, 2));

    res.status(201).json({ message: "Bot added successfully", bots: state.bots });
  });
});

// Initialize bots from the real root-level bots.json on server startup
if (fs.existsSync(botsFilePath)) {
  try {
    const data = fs.readFileSync(botsFilePath, "utf8");
    state.bots = data.trim() ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading bots.json:", error);
    state.bots = [];
  }
} else {
  state.bots = [];
}

router.post('/api/bots/run/:name', authRequired, (req, res) => {
  const { name } = req.params;
  const BotPath = botDirectoryPath;
  const filePath = path.join(BotPath, `${name}.js`);
  const bot = state.bots.find((b) => b.name === name);

  if (!bot) {
    return res.status(404).json({ message: 'Bot not found' });
  }

  if (!state.runningProcesses[name]) {
    try {
      // Spawn the bot process
      const runbotProcess = spawn('node', [filePath], {
        cwd: BotPath,
      });

      // Handle stdout
      runbotProcess.stdout.on('data', (data) => {
        const message = data.toString().trim();
        bot.status = message;
        console.log(`Bot stdout (${name}): ${message}`);
      });

      // Handle stderr
      runbotProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        bot.status = `Error: ${message}`;
        console.error(`Bot stderr (${name}): ${message}`);
      });

      // Handle process exit
      runbotProcess.on('close', (code) => {
        bot.status = `Bot disconnected (exit code: ${code})`;
        delete state.runningProcesses[name]; // Cleanup process tracking
        console.log(`Bot process (${name}) closed with code: ${code}`);
      });

      // Store the process in the tracker
      state.runningProcesses[name] = runbotProcess;
      bot.status = 'Bot is joining';
      res.json({ message: `Bot ${name} is now running` });
    } catch (error) {
      console.error('Error starting the bot:', error);
      return res.status(500).json({ message: 'Error starting the bot' });
    }
  } else {
    res.json({ message: `Bot ${name} is already running` });
  }
});

// Stop Bot
router.post('/api/bots/stop/:name', authRequired, (req, res) => {
  const { name } = req.params;
  const runbotProcess = state.runningProcesses[name];

  if (runbotProcess) {
    try {
      // Signal the bot process to stop
      runbotProcess.stdin.write('stop\n'); // Ensure your bot script listens for this
      runbotProcess.kill(); // Kill the process if necessary
      delete state.runningProcesses[name]; // Cleanup
      res.json({ message: `Bot ${name} has been stopped` });
    } catch (error) {
      console.error('Error stopping the bot:', error);
      return res.status(500).json({ message: 'Error stopping the bot' });
    }
  } else {
    res.status(404).json({ message: `Bot ${name} is not running` });
  }
});

// Delete Bot
router.delete('/api/bots/:name', authRequired, (req, res) => {
  const { name } = req.params;
  const folderPath = botDirectoryPath;
  const filePath = path.join(folderPath, `${name}.js`);

  // Check if the bot exists
  const botIndex = state.bots.findIndex((bot) => bot.name === name);
  if (botIndex === -1) {
    return res.status(404).json({ message: 'Bot not found' });
  }
  // Remove the file
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath); // Delete the bot's file
    } catch (error) {
      console.error('Error deleting bot file:', error);
      return res.status(500).json({ message: 'Error deleting the bot file' });
    }
  }

  // Remove the bot from the array and update the real bots.json file
  state.bots.splice(botIndex, 1);
  fs.writeFileSync(botsFilePath, JSON.stringify(state.bots, null, 2));

  res.json({ message: 'Bot deleted successfully' });
});


module.exports = router;