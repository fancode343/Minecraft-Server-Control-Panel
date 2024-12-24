const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const { WebSocketServer } = require("ws");
const fs = require("fs");
const path = require("path");
const cors = require('cors');

const PORT = 3000;

const app = express();
app.use(express.json()); // Parse JSON payloads
app.use(cors());

const botsFilePath = path.join(__dirname, 'bots.json'); // Path to save bot names
let bots = []; // Initialize the bots array



// Load bots from the JSON file during server startup
if (fs.existsSync(botsFilePath)) {
  try {
    const data = fs.readFileSync(botsFilePath, 'utf8');
    bots = JSON.parse(data);
    console.log("Bots loaded:", bots);
  } catch (err) {
    console.error("Error reading bots.json:", err);
  }
}

const serverPropertiesPath = path.join(__dirname, "server", "server.properties");
const playersFilePath = path.join(__dirname, "players.json");
let players = {};
const logs = [];
const MAX_LOG_COUNT = 100;
let minecraftProcess = null;

// Load players from file
function loadPlayers() {
  if (fs.existsSync(playersFilePath)) {
    try {
      const data = fs.readFileSync(playersFilePath, "utf-8");
      players = data.trim() ? JSON.parse(data) : {};
      console.log("Loaded players from file:", players);
    } catch (error) {
      console.error("Error parsing players.json:", error);
      players = {};
    }
  } else {
    console.log("No existing players file found. Starting fresh.");
    players = {};
  }
}

// Save players to file
function savePlayers() {
  fs.writeFileSync(playersFilePath, JSON.stringify(players, null, 2), "utf-8");
  console.log("Saved players to file.");
}

// Parse server.properties content
function parseProperties(fileContent) {
  return fileContent
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .reduce((properties, line) => {
      const [key, value] = line.split("=").map((part) => part.trim());
      properties[key] = value;
      return properties;
    }, {});
}

// Convert object to server.properties format
function stringifyProperties(properties) {
  return Object.entries(properties)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

// Middleware: Authentication check
function authRequired(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.redirect("/login");
}

// Update player status
function updatePlayerStatus(playerName, status) {
  players[playerName] = status;
}

// Initialize players from file
loadPlayers();

// Middleware setup
app.use(
  session({
    secret: "minecraft_server_secret", // Change this to a secure value in production
    resave: false,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// WebSocket setup
const wss = new WebSocketServer({ noServer: true });
function broadcastLogs(message) {
  const logEntry = typeof message === "object" ? message.message : message;
  logs.push(logEntry);
  if (logs.length > MAX_LOG_COUNT) logs.shift();
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) client.send(logEntry);
  });
}

// Routes
app.get("/", authRequired, (req, res) => res.redirect("/panel"));

app.get("/login", (req, res) => res.render("login"));

app.get('/api/bots/new/', authRequired, (req, res) => {
  res.json(bots); // `bots` should be an array containing your bot data
});

app.use('/assets', express.static(path.join(__dirname, 'assets' )));


app.post("/login", (req, res) => {
  const users = {
    GranGuorgeYT: "fancodeelastic",
    Kormit2000: "Jaymon5654",
    RedstoneProTech: "gab6522736",
    jemqr: "jemargwapo73627",
    admin: "admin@123"
  };
  const { username, password } = req.body;
  if (users[username] === password) {
    req.session.loggedIn = true;
    req.session.username = username;
    return res.redirect("/panel");
  }
  res.render("login", { error: "Invalid username or password" });
});

app.post("/api/bot/new", authRequired, (req, res) => {
  const { name, version = "1.21.50" } = req.body; // Default version if not provided

  if (!name) return res.status(400).json({ message: "Bot name is required" });

  const exists = bots.some((bot) => bot.name === name);
  if (exists) return res.status(400).json({ message: "Bot name already exists" });

  // Define the file
  const folderPath = path.join(__dirname, 'bots');
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
  offline: true,
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

  // Ensure the folder exists
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Write the bot file
  fs.writeFile(filePath, codeContent.trim(), (err) => {
    if (err) {
      return res.status(500).json({ message: "Error creating the bot file" });
    }

    bots.push({ name, status: "offline" }); // Add the bot to the list only on success

    // Save bots to a JSON file to persist between restarts
    fs.writeFileSync(path.join(__dirname, 'bots.json'), JSON.stringify(bots, null, 2));

    res.status(201).json({ message: "Bot added successfully", bots });
  });
});

// Initialize bots from a JSON file on server startup
if (fs.existsSync(path.join(__dirname, 'bots.json'))) {
  bots = JSON.parse(fs.readFileSync(path.join(__dirname, 'bots.json')));
} else {
  bots = [];
}



app.get("/panel", authRequired, (req, res) => {
  res.render("panel", { username: req.session.username });
});

app.get("/bots-panel", authRequired, (req, res) => {
  res.render("bots-panel", { username: req.session.username });
});

app.get("/command-center", authRequired, (req, res) => {
  res.render("command-center", { username: req.session.username });
});

let runningProcesses = {}; // Track running bot processes

app.post('/api/bots/run/:name', authRequired, (req, res) => {
  const { name } = req.params;
  const BotPath = path.join(__dirname, 'bots');
  const filePath = path.join(BotPath, `${name}.js`);
  const bot = bots.find((b) => b.name === name);

  if (!bot) {
    return res.status(404).json({ message: 'Bot not found' });
  }

  if (!runningProcesses[name]) {
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
        delete runningProcesses[name]; // Cleanup process tracking
        console.log(`Bot process (${name}) closed with code: ${code}`);
      });

      // Store the process in the tracker
      runningProcesses[name] = runbotProcess;
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

app.post('/api/bots/stop/:name', authRequired, (req, res) => {
  const { name } = req.params;
  const runbotProcess = runningProcesses[name];

  if (runbotProcess) {
    try {
      // Signal the bot process to stop
      runbotProcess.stdin.write('stop\n'); // Ensure your bot script listens for this
      runbotProcess.kill(); // Kill the process if necessary
      delete runningProcesses[name]; // Cleanup
      res.json({ message: `Bot ${name} has been stopped` });
    } catch (error) {
      console.error('Error stopping the bot:', error);
      return res.status(500).json({ message: 'Error stopping the bot' });
    }
  } else {
    res.status(404).json({ message: `Bot ${name} is not running` });
  }
});

app.delete('/api/bots/:name', authRequired, (req, res) => {
  const { name } = req.params;
  const folderPath = path.join(__dirname, 'bots');
  const filePath = path.join(folderPath, `${name}.js`);

  // Check if the bot exists
  const botIndex = bots.findIndex((bot) => bot.name === name);
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

  // Remove the bot from the array and update the bots.json file
  bots.splice(botIndex, 1);
  fs.writeFileSync(path.join(__dirname, 'bots.json'), JSON.stringify(bots, null, 2));

  res.json({ message: 'Bot deleted successfully' });
});





app.post("/start", authRequired, (req, res) => {
  if (!minecraftProcess) {
    try {
      minecraftProcess = spawn("./bedrock_server", [], {
        cwd: "./server",
        env: { ...process.env, LD_LIBRARY_PATH: "./server" },
      });

      minecraftProcess.stdout.on("data", (data) => {
        const message = data.toString().trim();
        broadcastLogs(`[Server]: ${message}`);
        if (message.includes("Server started.")) {
          broadcastLogs("[Server]: Server successfully started.");
          res.send("Server Started");
        }
      });
     
      minecraftProcess.stderr.on("data", (data) => {
        broadcastLogs(`[Error]: ${data.toString().trim()}`);
      });

      minecraftProcess.on("close", (code) => {
        broadcastLogs(`[Server]: Minecraft server stopped with code ${code}`);
        minecraftProcess = null;
      });

      broadcastLogs("[Server]: Starting server...");
    } catch (error) {
      console.error("Error starting server:", error);
      res.status(500).send("Error starting the server.");
    }
  } else {
    broadcastLogs("[Server]: Server is already running.");
    res.send("Server is already running.");
  }
});

app.post("/restart", authRequired, (req, res) => {
  if (minecraftProcess) {
    minecraftProcess.stdin.write("stop\n");
    broadcastLogs("[Command]: stop");

    minecraftProcess.on("close", () => {
      minecraftProcess = spawn("./bedrock_server", [], {
        cwd: "./server",
        env: { ...process.env, LD_LIBRARY_PATH: "./server" },
      });

      minecraftProcess.stdout.on("data", (data) => {
        const message = data.toString().trim();
        broadcastLogs(`[Server]: ${message}`);
        if (message.includes("Server started.")) {
          broadcastLogs("[Server]: Server successfully restarted.");
          res.send("Server Restarted");
        }
      });

      minecraftProcess.stderr.on("data", (data) => {
        broadcastLogs(`[Error]: ${data.toString().trim()}`);
      });

      broadcastLogs("[Server]: Server Restarting");
    });
  } else {
    broadcastLogs("[Error]: Server is not running");
    res.send("Server is not running.");
  }
});

app.post("/stop", authRequired, (req, res) => {
  if (minecraftProcess) {
    minecraftProcess.stdin.write("stop\n");
    broadcastLogs("[Command]: stop");

    minecraftProcess.on("close", (code) => {
      broadcastLogs(`[Server]: Minecraft server stopped with code ${code}`);
      minecraftProcess = null;
      res.send("Server stopped successfully.");
    });
  } else {
    broadcastLogs("[Error]: Server is not running");
    res.send("Server is not running.");
  }
});

app.get("/getPlayers", authRequired, (req, res) => {
  if (minecraftProcess) {
    logs.forEach((log) => {
      const connectMatch = log.match(/Player connected: (.+?), xuid:/);
      if (connectMatch) updatePlayerStatus(connectMatch[1], "connected");

      const disconnectMatch = log.match(/Player disconnected: (.+?), xuid:/);
      if (disconnectMatch) updatePlayerStatus(disconnectMatch[1], "disconnected");

      if (log.match(/Server stop requested\./)) {
        Object.keys(players).forEach((playerName) => {
          players[playerName] = "disconnected";
        });
      }
    });

    savePlayers();
    res.json(
      Object.entries(players).map(([name, status]) => ({ name, status }))
    );
  } else {
    res.status(500).json({ error: "Server is not running" });
  }
});

app.post("/command", authRequired, (req, res) => {
  const command = req.body.command;
  if (minecraftProcess) {
    minecraftProcess.stdin.write(`${command}\n`);
    broadcastLogs(`[Command]: ${command}`);
  } else {
    broadcastLogs("[Error]: Server is not running");
    res.send("Server is not running.");
  }
});

app.get("/editserver-properties", authRequired, (req, res) => {
  try {
    const fileContent = fs.readFileSync(serverPropertiesPath, "utf-8");
    const properties = parseProperties(fileContent);

    // Combine `properties` and `username` into a single object
    res.render("editserver-properties", {
      properties,
      username: req.session.username || "Admin", // Provide a default value if `username` is undefined
    });
  } catch (error) {
    res.status(500).send("Error reading server.properties file");
  }
});


app.post("/editserver-properties", authRequired, (req, res) => {
  try {
    const fileContent = fs.readFileSync(serverPropertiesPath, "utf-8");
    const properties = parseProperties(fileContent);
    const editableKeys = ["difficulty", "view-distance", "gamemode", "max-players"];

    editableKeys.forEach((key) => {
      if (req.body[key] !== undefined) properties[key] = req.body[key];
    });

    fs.writeFileSync(serverPropertiesPath, stringifyProperties(properties), "utf-8");
    res.json({ success: true, message: "Server properties updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating server.properties file" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// WebSocket handling
const server = app.listen(PORT, () => {
  console.log(`App running at http://localhost:${PORT}`);
});

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.send(JSON.stringify(logs));
    wss.emit("connection", ws, req);
  });
});
