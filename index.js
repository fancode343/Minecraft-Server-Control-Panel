// const express = require("express");
// const session = require("express-session");
// const bodyParser = require("body-parser");
// const { spawn } = require("child_process");
// const { WebSocketServer } = require("ws");
// const fs = require("fs");
// const path = require("path");
// const cors = require('cors');
// const { google } = require("googleapis");
// const fsExtra = require("fs-extra");
// const { exec } = require("child_process");
// const https = require('https');

// const WEBHOOK_URL = 'https://discord.com/api/webhooks/YOU_WENHOOK_URL';

// const PORT = 3000;
// const WS_PORT = 8080;

// const app = express();
// app.use(express.json()); // Parse JSON payloads
// app.use(cors());

// Ensure necessary directories exist
// const downloadsPath = path.join(__dirname, "downloads");
// const serverWorldsPath = path.join(__dirname, "server", "worlds");

// if (!fs.existsSync(serverWorldsPath)) {
//   fs.mkdirSync(serverWorldsPath, { recursive: true });
// }

// const botsFilePath = path.join(__dirname, 'bots.json'); // Path to save bot names
// let bots = []; // Initialize the bots array

// Load bots from the JSON file during server startup
// if (fs.existsSync(botsFilePath)) {
//   try {
//     const data = fs.readFileSync(botsFilePath, 'utf8');
//     bots = JSON.parse(data);
//     console.log("Bots loaded:", bots);
//   } catch (err) {
//     console.error("Error reading bots.json:", err);
//   }
// }

// const serverPropertiesPath = path.join(__dirname, "server", "server.properties");
// const playersFilePath = path.join(__dirname, "players.json");


// let players = {};
// const logs = [];
// const MAX_LOG_COUNT = 100;
// let minecraftProcess = null;

// //Webhook
// function sendMessageDis(content) {
//   if (!content || content.trim() === "") return;

//   content = content.toString().replace(/[^\x20-\x7E\n\r]/g, "");

//   // --- Discord ---
//   const data = JSON.stringify({ content });
//   const url = new URL(WEBHOOK_URL);

//   const req = https.request({
//     hostname: url.hostname,
//     path: url.pathname + url.search,
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Content-Length": Buffer.byteLength(data)
//     }
//   });

//   req.on("error", console.error);
//   req.write(data);
//   req.end();
// }



// // Load players from file
// function loadPlayers() {
//   if (fs.existsSync(playersFilePath)) {
//     try {
//       const data = fs.readFileSync(playersFilePath, "utf-8");
//       players = data.trim() ? JSON.parse(data) : {};
//       console.log("Loaded players from file:", players);
//     } catch (error) {
//       console.error("Error parsing players.json:", error);
//       players = {};
//     }
//   } else {
//     console.log("No existing players file found. Starting fresh.");
//     players = {};
//   }
// }

// // Save players to file
// function savePlayers() {
//   fs.writeFileSync(playersFilePath, JSON.stringify(players, null, 2), "utf-8");
//   console.log("Saved players to file.");
// }

// Parse server.properties content
// function parseProperties(fileContent) {
//   return fileContent
//     .split("\n")
//     .filter((line) => line.trim() && !line.startsWith("#"))
//     .reduce((properties, line) => {
//       const [key, value] = line.split("=").map((part) => part.trim());
//       properties[key] = value;
//       return properties;
//     }, {});
// }

// Convert object to server.properties format
// function stringifyProperties(properties) {
//   return Object.entries(properties)
//     .map(([key, value]) => `${key}=${value}`)
//     .join("\n");
// }




// // Middleware: Authentication check
// function authRequired(req, res, next) {
//   if (req.session && req.session.loggedIn) return next();
//   res.redirect("/auth");
// }

// // Update player status
// function updatePlayerStatus(playerName, status) {
//   players[playerName] = status;
// }
// loadPlayers();

// Google Drive Authentication
// const CLIENT_ID = "YOUR_ID";
// const CLIENT_SECRET = "YOOUR_SECRET";
// const REDIRECT_URI = "YOUR_URI";
// const REFRESH_TOKEN = "YOUR_TOKEN";

// const oauth2Client = new google.auth.OAuth2(
//   CLIENT_ID,
//   CLIENT_SECRET,
//   REDIRECT_URI
// );
// oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// const drive = google.drive({ version: "v3", auth: oauth2Client });

// // Function to list files from a Google Drive folder
// async function listFiles(folderId) {
//   const response = await drive.files.list({
//     q: `'${folderId}' in parents and trashed=false`,
//     fields: "files(id, name)",
//   });
//   return response.data.files;
// }

// // Function to download a file from Google Drive
// async function downloadFile(fileId, destination) {
//   const dest = fs.createWriteStream(destination);
//   return new Promise((resolve, reject) => {
//     drive.files.get(
//       { fileId, alt: "media" },
//       { responseType: "stream" },
//       (err, res) => {
//         if (err) {
//           reject(err);
//           return;
//         }
//         res.data
//           .on("end", () => {
//             console.log(`File downloaded to ${destination}`);
//             resolve();
//           })
//           .on("error", (err) => {
//             console.error("Error downloading file.");
//             reject(err);
//           })
//           .pipe(dest);
//       }
//     );
//   });
// }



// Middleware setup
// app.use(
//   session({
//     secret: "minecraft_server_secret", // Change this to a secure value in production
//     resave: false,
//     saveUninitialized: true,
//   })
// );
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static("public"));
// app.set("view engine", "ejs");






// // WebSocket setup
// const wss = new WebSocketServer({ noServer: true });
// function broadcastLogs(message) {
//   const logEntry = typeof message === "object" ? message.message : message;
//   logs.push(logEntry);
//   if (logs.length > MAX_LOG_COUNT) logs.shift();
//   wss.clients.forEach((client) => {
//     if (client.readyState === client.OPEN) client.send(logEntry);
//   });
// }

// const wsss = new WebSocketServer({ port: 8080, host: '0.0.0.0' });
// console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
// const messagesFilePath = path.join(__dirname, "messages.json");
// if (!fs.existsSync(messagesFilePath)) {
//   fs.writeFileSync(messagesFilePath, JSON.stringify([]), "utf8");
// }


// // Load messages from file
// function loadMessages() {
//   try {
//     return JSON.parse(fs.readFileSync(messagesFilePath, "utf8"));
//   } catch (error) {
//     console.error("Error reading messages.json:", error);
//     return [];
//   }
// }

// // Save messages to file
// function saveMessages(messages) {
//   try {
//     fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2), "utf8");
//   } catch (error) {
//     console.error("Error writing to messages.json:", error);
//   }
// }

// // WebSocket server logic
// const messages = loadMessages(); // Load messages globally

// wsss.on("connection", (ws) => {
//   console.log("New WebSocket connection established.");

//   // Send chat history to the newly connected client
//   ws.send(JSON.stringify({ type: "history", data: messages }));

//   // Handle incoming messages
//   ws.on("message", (message) => {
//     console.log("Received message:", message);

//     let parsedMessage;
//     try {
//       parsedMessage = JSON.parse(message); // Parse the incoming JSON
//     } catch (error) {
//       console.error("Invalid JSON received:", message);
//       ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
//       return;
//     }

//     // Add the new message to the global `messages` array
//     messages.push(parsedMessage);
//     saveMessages(messages); // Persist the updated messages to file

//     // Broadcast the message to all connected clients
//     wsss.clients.forEach((client) => {
//       if (client.readyState === client.OPEN) {
//         client.send(JSON.stringify({ type: "message", data: parsedMessage }));
//       }
//     });
//   });

//   ws.on("close", () => {
//     console.log("WebSocket connection closed.");
//   });
// });


// Routes
// app.get("/", authRequired, (req, res) => res.redirect("/dashboard"));

// app.get('/auth', (req, res) => {
//   res.render("login");
// });

// app.get('/api/bots/new/', authRequired, (req, res) => {
//   res.json(bots); // `bots` should be an array containing your bot data
// });

// app.use('/assets', express.static(path.join(__dirname, 'assets' )));


// app.post("/auth", (req, res) => {
//   const { username, password } = req.body;

//   // Load credentials from credentials.json
//   const credentialsPath = path.join(__dirname, "credentials.json");
//   fs.readFile(credentialsPath, "utf-8", (err, data) => {
//     if (err) {
//       console.error("Error reading credentials file:", err);
//       return res.status(500).render("login", { error: "Server error. Please try again later." });
//        sendMessageDis("Server is error");
//     }

//     let users;
//     try {
//       users = JSON.parse(data); // Parse JSON content
//     } catch (parseErr) {
//       console.error("Error parsing credentials file:", parseErr);
//       return res.status(500).render("login", { error: "Server error. Please try again later." });
//       sendMessageDis("Server is error");
//     }

//     // Check credentials
//     if (users[username] === password) {
//       req.session.loggedIn = true;
//       req.session.username = username;
//        sendMessageDis(`:white_check_mark:**${username}** has logged in to the panel`);
//       return res.redirect("/dashboard");
//     }

//     // Invalid login
//     res.render("login", { error: "Invalid username or password" });
//     sendMessageDis(`:x: Someone is trying to login\n\n**Username:** ${username}\n**Password: **${password}\n`);
    
//   });
// });


// Create New Bot
// app.post("/api/bot/new", authRequired, (req, res) => {
//   const { name, version = "1.21.50" } = req.body; // Default version if not provided

//   if (!name) return res.status(400).json({ message: "Bot name is required" });

//   const exists = bots.some((bot) => bot.name === name);
//   if (exists) return res.status(400).json({ message: "Bot name already exists" });

//   // Define the file
//   const folderPath = path.join(__dirname, 'bots');
//   const filePath = path.join(folderPath, `${name}.js`);

//   const codeContent = `
// const bedrock = require('bedrock-protocol');
// const readline = require('readline');

// // Create the client
// const client = bedrock.createClient({ 
//   host: 'localhost', 
//   port: 19132, 
//   version: '${version}', 
//   username: '${name}', 
//   offline: false,
// });

// console.log("Connecting...");

// // Handle spawn event
// client.on('spawn', () => {
//   console.log("Online");
// });

// // Handle disconnection
// client.on('disconnect', (reason) => {
//   console.error("Disconnected");
//   cleanupAndExit(); // Call cleanup when disconnected
// });

// // Handle connection close
// client.on('close', (reason) => {
//   console.error("Connection closed:");
//   cleanupAndExit(); // Call cleanup when connection is closed
// });

// // Setup readline interface for manual stop
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// rl.on('line', (input) => {
//   if (input.trim().toLowerCase() === 'stop') {
//     console.log('Stopping the process...');
//     cleanupAndExit();
//   }
// });

// // Cleanup and exit function
// function cleanupAndExit() {
//   console.log('Cleaning up resources before exit...');
//   client.removeAllListeners(); // Remove all client listeners
//   client.disconnect('Client stopping as requested.'); // Send disconnect message
//   rl.close(); // Close the readline interface

//   // Wait briefly before exiting
//   setTimeout(() => {
//     console.log('Exiting...');
//     process.exit(0); // Terminate the process
//   }, 1000);
// }
// `;

//   // Ensure the folder exists
//   if (!fs.existsSync(folderPath)) {
//     fs.mkdirSync(folderPath, { recursive: true });
//   }

//   // Write the bot file
//   fs.writeFile(filePath, codeContent.trim(), (err) => {
//     if (err) {
//       return res.status(500).json({ message: "Error creating the bot file" });
//     }

//     bots.push({ name, status: "offline" }); // Add the bot to the list only on success

//     // Save bots to a JSON file to persist between restarts
//     fs.writeFileSync(path.join(__dirname, 'bots.json'), JSON.stringify(bots, null, 2));

//     res.status(201).json({ message: "Bot added successfully", bots });
//   });
// });

// // Initialize bots from a JSON file on server startup
// if (fs.existsSync(path.join(__dirname, 'bots.json'))) {
//   bots = JSON.parse(fs.readFileSync(path.join(__dirname, 'bots.json')));
// } else {
//   bots = [];
// }

// // Panel Route
// app.get("/dashboard", authRequired, (req, res) => {
//   const settingsParam = req.query.settings;

//   if (settingsParam === "1") {
//     res.render("settings", { username: req.session.username });
//   } else {
//     res.render("panel", { username: req.session.username });
//   }
// });

// app.post("/save-settings", authRequired, (req, res) => {
//   const { oldPassword, password } = req.body;
//   const username = req.session.username;

//   // Validate input
//   if (!oldPassword || !password) {
//     return res.render("settings", {
//       username,
//       error: "Both old and new passwords are required.", // Passing error
//     });
//   }

//   // Path to credentials.json
//   const credentialsPath = path.join(__dirname, "credentials.json");

//   // Read and update credentials.json
//   fs.readFile(credentialsPath, "utf-8", (err, data) => {
//     if (err) {
//       console.error("Error reading credentials file:", err);
//       return res.render("settings", {
//         username,
//         error: "Server error. Please try again later.", // Passing error
//       });
//     }

//     let users;
//     try {
//       users = JSON.parse(data); // Parse existing credentials
//     } catch (parseErr) {
//       console.error("Error parsing credentials file:", parseErr);
//       return res.render("settings", {
//         username,
//         error: "Server error. Please try again later.", // Passing error
//       });
//     }

//     // Check if the old password is correct
//     if (users[username] !== oldPassword) {
//       return res.render("settings", {
//         username,
//         error: "Old password does not match.", // Passing error
//       });
//     }

//     // Update the password
//     users[username] = password; // Set the new password

//     // Write the updated credentials back to the file
//     fs.writeFile(credentialsPath, JSON.stringify(users, null, 2), (writeErr) => {
//       if (writeErr) {
//         console.error("Error writing credentials file:", writeErr);
//         return res.render("settings", {
//           username,
//           error: "Server error. Please try again later.", // Passing error
//         });
//       }

//       // Success message
//       res.render("settings", {
//         username,
//         success: "Password updated successfully.", // Passing success message
//       });
//     });
//   });
// });



// app.get("/bots-panel", authRequired, (req, res) => {
//   res.render("bots-panel", { username: req.session.username });
// });

// app.get("/Allowlist", authRequired, (req, res) => {
//   res.render("allowlist", { username: req.session.username });
// })

// app.get("/server-info", authRequired, (req, res) => {
//   res.render("server-info", { username: req.session.username });
// });

// app.get("/activitylogs", authRequired, (req, res) => {
//   res.render("activity-log", { username: req.session.username });
// });

// app.get("/activitylogss", authRequired, (req, res) => {
//   const messageFilePath = path.join(__dirname, "activity_log.json");

//   // Read the JSON file
//   fs.readFile(messageFilePath, 'utf8', (err, data) => {
//     if (err) {
//       console.error("Error reading activity_log.json:", err);
//       return res.status(500).json({ error: "Failed to load activity logs." });
//     }

//     try {
//       // Parse JSON data
//       let logs = JSON.parse(data);

//       // Ensure it's an array if not
//       if (!Array.isArray(logs)) {
//         logs = [logs];
//       }

//       // Sort logs by timestamp
//       logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

//       // Send the sorted logs as a response
//       res.json(logs);
//     } catch (parseError) {
//       console.error("Error parsing JSON:", parseError);
//       res.status(500).json({ error: "Invalid JSON format in activity_log.json." });
//     }
//   });
// });

// Command Center Route
// app.get("/command-center", authRequired, (req, res) => {
//   res.render("command-center", { username: req.session.username });
// });

// let runningProcesses = {}; // Track running bot processes

// Run Bot
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

// Stop Bot
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

// Delete Bot
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

// // Start Server
// app.post("/start", authRequired, (req, res) => {
//   if (!minecraftProcess) {
//     try {
//       minecraftProcess = spawn("./bedrock_server", [], {
//         cwd: "./server",
//         env: { ...process.env, LD_LIBRARY_PATH: "./server" },
//       });

//       minecraftProcess.stdout.on("data", (data) => {
//         const message = data.toString().trim();
//         broadcastLogs(`[Server]: ${message}`);
//         if (message.includes("Server started.")) {
//           broadcastLogs("[Server]: Server successfully started.");
//           res.send("Server Started");
//         }
//       });

//       minecraftProcess.stderr.on("data", (data) => {
//         broadcastLogs(`[Error]: ${data.toString().trim()}`);
//       });

//       minecraftProcess.on("close", (code) => {
//         broadcastLogs(`[Server]: Minecraft server stopped with code ${code}`);
//         minecraftProcess = null;
//       });

//       broadcastLogs("[Server]: Starting server...");
//     } catch (error) {
//       console.error("Error starting server:", error);
//       res.status(500).send("Error starting the server.");
//     }
//   } else {
//     broadcastLogs("[Server]: Server is already running.");
//     res.send("Server is already running.");
//   }
// });

// Restart Server
// app.post("/restart", authRequired, (req, res) => {
//   if (minecraftProcess) {
//     minecraftProcess.stdin.write("stop\n");
//     broadcastLogs("[Command]: stop");

//     minecraftProcess.on("close", () => {
//       minecraftProcess = spawn("./bedrock_server", [], {
//         cwd: "./server",
//         env: { ...process.env, LD_LIBRARY_PATH: "./server" },
//       });

//       minecraftProcess.stdout.on("data", (data) => {
//         const message = data.toString().trim();
//         broadcastLogs(`[Server]: ${message}`);
//         if (message.includes("Server started.")) {
//           broadcastLogs("[Server]: Server successfully restarted.");
//           res.send("Server Restarted");
//         }
//       });

//       minecraftProcess.stderr.on("data", (data) => {
//         broadcastLogs(`[Error]: ${data.toString().trim()}`);
//       });

//       broadcastLogs("[Server]: Server Restarting");
//     });
//   } else {
//     broadcastLogs("[Error]: Server is not running");
//     res.send("Server is not running.");
//   }
// });

// // Stop Server
// app.post("/stop", authRequired, (req, res) => {
//   if (minecraftProcess) {
//     minecraftProcess.stdin.write("stop\n");
//     broadcastLogs("[Command]: stop");

//     minecraftProcess.on("close", (code) => {
//       broadcastLogs(`[Server]: Minecraft server stopped with code ${code}`);
//       minecraftProcess = null;
//       res.send("Server stopped successfully.");
//     });
//   } else {
//     broadcastLogs("[Error]: Server is not running");
//     res.send("Server is not running.");
//   }
// }); 

// Get Players
// app.get("/getPlayers", authRequired, (req, res) => {
//   if (minecraftProcess) {
//     logs.forEach((log) => {
//       const connectMatch = log.match(/Player connected: (.+?), xuid:/);
//       if (connectMatch) updatePlayerStatus(connectMatch[1], "connected");

//       const disconnectMatch = log.match(/Player disconnected: (.+?), xuid:/);
//       if (disconnectMatch) updatePlayerStatus(disconnectMatch[1], "disconnected");

//       if (log.match(/Server stop requested\./)) {
//         Object.keys(players).forEach((playerName) => {
//           players[playerName] = "disconnected";
//         });
//       }
//     });

//     savePlayers();
//     res.json(
//       Object.entries(players).map(([name, status]) => ({ name, status }))
//     );
//   } else {
//     res.status(500).json({ error: "Server is not running" });
//   }
// });

// Send Command
// app.post("/command", authRequired, (req, res) => {
//   const command = req.body.command;
//   if (minecraftProcess) {
//     minecraftProcess.stdin.write(`${command}\n`);
//     broadcastLogs(`[Command]: ${command}`);
//     res.send("Command sent.");
//   } else {
//     broadcastLogs("[Error]: Server is not running");
//     res.status(500).send("Server is not running.");
//   }
// });

// // List Files from Google Drive
// app.get("/api/files", authRequired, async (req, res) => {
//   const { type } = req.query;
//   const folderId =
//     type === "dayToDay"
//       ? "1mrkAbQR1SoF_dlhPAa0xqQC0Hw3T81Se"
//       : "1qlpj1z54w0Q0HVE1TvgKB3qhdFJsSgW3";

//   if (!type || !folderId) {
//     return res.status(400).json({ error: "Invalid backup type." });
//   }

//   try {
//     // Retrieve files from Google Drive
//     const response = await drive.files.list({
//       q: `'${folderId}' in parents and trashed=false`,
//       fields: "files(id, name, modifiedTime)",
//     });

//     // Format the file list with date and time in UTC+8
//     const files = response.data.files.map((file) => ({
//       id: file.id,
//       name: file.name,
//       modifiedTime: new Intl.DateTimeFormat("en-US", {
//         timeZone: "Asia/Shanghai", // Specify UTC+8 timezone
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit",
//         hour: "2-digit",
//         minute: "2-digit",
//         second: "2-digit",
//       }).format(new Date(file.modifiedTime)), // Format date and time in UTC+8
//     }));

//     res.json(files);
//   } catch (error) {
//     console.error("Error listing files:", error);
//     res.status(500).json({ error: "Failed to retrieve files." });
//   }
// });



// // Backup Endpoint
// app.post("/api/backup", authRequired, async (req, res) => {
//   const { type, fileId, fileName } = req.body;
//   if (!type || !fileId || !fileName) {
//     return res.status(400).send("Invalid backup request.");
//   }

//   try {
//     // Stop the server
//     if (minecraftProcess) {
//       minecraftProcess.stdin.write("stop\n");
//       broadcastLogs("[Command]: stop");
  
//       minecraftProcess.on("close", (code) => {
//         broadcastLogs(`[Server]: Minecraft server stopped with code ${code}`);
//         minecraftProcess = null;
//       });
//     } else {
//       broadcastLogs("[Error]: server backuped");
//     }
//     console.log("Server stopped.");

//     // Download the selected file
//     const backupPath = path.join(downloadsPath, fileName);
//     console.log(`Downloading file ${fileName} from Google Drive...`);
//     await downloadFile(fileId, backupPath);
//     console.log(`Downloaded file to ${backupPath}`);

//     // Remove the existing worlds folder
//     if (fs.existsSync(serverWorldsPath)) {
//       console.log("Removing existing worlds folder...");
//       fsExtra.removeSync(serverWorldsPath);
//       console.log("Removed existing worlds folder.");
//     }

//     // Extract the new backup
//     console.log(`Extracting ${fileName} using unzip...`);
//     const extractDir = path.join(__dirname, "server/worlds");
//     const unzipCommand = `unzip -o ${backupPath} -d ${extractDir}`;

//     await new Promise((resolve, reject) => {
//       exec(unzipCommand, (err, stdout, stderr) => {
//         if (err) {
//           console.error("Error extracting ZIP file:", stderr);
//           reject(new Error("Failed to extract ZIP file using unzip command."));
//         } else {
//           console.log("Extraction output:", stdout);
//           resolve();
//         }
//       });
//     });

//     console.log(`Extracted ${fileName} to ${extractDir}.`);
//     res.send("Backup completed and server stopped.");
//   } catch (error) {
//     console.error("Backup process failed:", error);
//     res.status(500).send("An error's occurred during the backup process.");
//   }
// });

// Edit Server Properties
// app.get("/editserver-properties", authRequired, (req, res) => {
//   try {
//     const fileContent = fs.readFileSync(serverPropertiesPath, "utf-8");
//     const properties = parseProperties(fileContent);

//     // Combine `properties` and `username` into a single object
//     res.render("editserver-properties", {
//       properties,
//       username: req.session.username || "Admin", // Provide a default value if `username` is undefined
//     });
//   } catch (error) {
//     res.status(500).send("Error reading server.properties file");
//   }
// });

// const allowlistPath = path.join(__dirname, "server/allowlist.json");

// Endpoint to fetch the allowlist
// app.get("/getAllowlist", (req, res) => {
//   fs.readFile(allowlistPath, "utf-8", (err, data) => {
//     if (err) {
//       console.error("Error reading allowlist.json:", err);
//       return res.status(500).send("Internal Server Error");
//     }
//     try {
//       const allowlist = JSON.parse(data);
//       res.json(allowlist); // Send allowlist as JSON
//     } catch (parseError) {
//       console.error("Error parsing allowlist.json:", parseError);
//       res.status(500).send("Internal Server Error");
//     }
//   });
// });

// Update Server Properties
// app.post("/editserver-properties", authRequired, (req, res) => {
//   try {
//     const fileContent = fs.readFileSync(serverPropertiesPath, "utf-8");
//     const properties = parseProperties(fileContent);
//     const editableKeys = ["difficulty", "view-distance", "gamemode", "max-players", "server-name", "level-name", "texturepack-required", "level-seed", "tick-distance"];

//     editableKeys.forEach((key) => {
//       if (req.body[key] !== undefined) properties[key] = req.body[key];
//     });

//     fs.writeFileSync(serverPropertiesPath, stringifyProperties(properties), "utf-8");
//     res.json({ success: true, message: "Server properties updated successfully" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error updating server.properties file" });
//   }
// });

// const activityLogPath = path.join(__dirname, "activity_log.json");
// if (!fs.existsSync(activityLogPath)) {
//   fs.writeFileSync(activityLogPath, JSON.stringify([]), "utf8");
// }

// app.post("/activity-log", authRequired, async (req, res) => {
//   const { user, action, timestamp } = req.body;

//   console.log("Request body received:", req.body);

//   if (!user || !action || !timestamp) {
//     console.error("Invalid activity data:", req.body);
//     return res.status(400).json({ error: "Invalid activity data" });
//   }

//   // Validate the timestamp
//   const utc8Date = new Date(timestamp);
//   if (isNaN(utc8Date.getTime())) {
//     console.error("Invalid timestamp format:", timestamp);
//     return res.status(400).json({ error: "Invalid timestamp format" });
//   }

//   // Append log with validated timestamp
//   try {
//     const logs = JSON.parse(fs.readFileSync(activityLogPath, "utf8"));
//     logs.push({ user, action, timestamp });
//     fs.writeFileSync(activityLogPath, JSON.stringify(logs, null, 2), "utf8");

//     console.log("Activity logged successfully");
//     res.status(200).json({ message: "Activity logged successfully" });
//   } catch (error) {
//     console.error("Error logging activity:", error);
//     res.status(500).json({ error: "Failed to log activity" });
//   }
// });

// Logout Route
// app.get("/logout", (req, res) => {
//   req.session.destroy(() => res.redirect("/auth"));
// });

// WebSocket Handling
// const server = app.listen(PORT, () => {
//   console.log(`App running at http://localhost:${PORT}`);
// });

// server.on("upgrade", (req, socket, head) => {
//   wss.handleUpgrade(req, socket, head, (ws) => {
//     ws.send(JSON.stringify(logs));
//     wss.emit("connection", ws, req);
//   });
// });
