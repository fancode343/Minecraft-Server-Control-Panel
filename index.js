const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const { WebSocketServer } = require("ws");
const fs = require("fs");
const path = require("path");
const serverPropertiesPath = path.join(__dirname, "server", "server.properties");
const playersFilePath = path.join(__dirname, "players.json");
let players = {};

const app = express();
const PORT = 8080;

function loadPlayers() {
  if (fs.existsSync(playersFilePath)) {
    try {
      const data = fs.readFileSync(playersFilePath, "utf-8");
      players = data.trim() ? JSON.parse(data) : {}; // Check if the file is not empty
      console.log("Loaded players from file:", players);
    } catch (error) {
      console.error("Error parsing players.json:", error);
      players = {}; // Default to an empty object on error
    }
  } else {
    console.log("No existing players file found. Starting fresh.");
    players = {}; // Start with an empty object
  }
}

// Save players to file
function savePlayers() {
  fs.writeFileSync(playersFilePath, JSON.stringify(players, null, 2), "utf-8");
  console.log("Saved players to file.");
}

// Initialize players from file
loadPlayers();

// Parse properties helper
function parseProperties(fileContent) {
  const properties = {};
  fileContent
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#")) // Ignore comments and empty lines
    .forEach((line) => {
      const [key, value] = line.split("=").map((part) => part.trim());
      properties[key] = value;
    });
  return properties;
}

// Helper: Convert an object back to server.properties format
function stringifyProperties(properties) {
  return Object.entries(properties)
    .map(([key, value]) => ${key}=${value})
    .join("\n");
}

// Middleware: Authentication check
function authRequired(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return next();
  }
  res.redirect("/login");
}

// Initialize session
app.use(
  session({
    secret: "minecraft_server_secret", // Change this to a secure value in production
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Minecraft server process and logs
let minecraftProcess = null;
const logs = [];
const MAX_LOG_COUNT = 100;
const wss = new WebSocketServer({ noServer: true });


function broadcastLogs(message) {
  const logEntry = typeof message === "object" ? message.message : message;

  logs.push(logEntry);
  if (logs.length > MAX_LOG_COUNT) logs.shift();

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(logEntry); // Send only the plain string
    }
  });
}
function broadcastLogs(message) {
  const logEntry = typeof message === "object" ? message.message : message;

  logs.push(logEntry);
  if (logs.length > MAX_LOG_COUNT) logs.shift();

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(logEntry); // Send the plain log message
    }
  });
}


// Routes
app.get("/", authRequired, (req, res) => {
  res.redirect("/panel");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const users = {
    GranGuorgeYT: "fancodeelastic",
    Kormit2000: "Jaymon5654",
    RedstoneProTech: "gab6522736",
    jemqr: "jemargwapo73627",
  };

  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    req.session.loggedIn = true;
    req.session.username = username;
    return res.redirect("/panel");
  }
  res.render("login", { error: "Invalid username or password" });
});

app.get("/panel", authRequired, (req, res) => {
  res.render("panel", { username: req.session.username });
});
app.get("/bots", authRequired, (req, res) => {
  res.render("Bots", { username: req.session.username });
});
app.get("/command-center", authRequired, (req, res) => {
  res.render("command-center", { username: req.session.username});
});


app.post("/start", authRequired, (req, res) => {
  if (!minecraftProcess) {
    try {
      minecraftProcess = spawn("./bedrock_server", [], {
        cwd: "./server",
        env: { ...process.env, LD_LIBRARY_PATH: "./server" }, // Ensure the library path is set correctly
      });

      // Handle server output
      minecraftProcess.stdout.on("data", (data) => {
        const message = data.toString().trim();
        broadcastLogs([Server]: ${message});

        // Check for server start confirmation
        if (message.includes("Server started.")) {
          broadcastLogs("[Server]: Server successfully started.");
          res.send("Server Started");
        }
      });

      minecraftProcess.stderr.on("data", (data) => {
        const error = data.toString().trim();
        broadcastLogs([Error]: ${error});
      });

      minecraftProcess.on("close", (code) => {
        broadcastLogs([Server]: Minecraft server stopped with code ${code});
        minecraftProcess = null; // Clear process reference
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
    broadcastLogs([Command]: stop);

    minecraftProcess.on("close", (code) => {
      if (code === 0) {
        minecraftProcess = spawn("./bedrock_server", [], {
          cwd: "./server",
          env: { ...process.env, LD_LIBRARY_PATH: "." },
        });
        minecraftProcess.stdout.on("data", (data) => {
          const message = data.toString().trim();
          broadcastLogs([Server]: ${message});
  
          // Check for server start confirmation
          if (message.includes("Server started.")) {
            broadcastLogs("[Server]: Server successfully started.");
            res.send("Server Restarted");
          }
        });

        minecraftProcess.stderr.on("data", (data) => {
          broadcastLogs([Error]: ${data.toString().trim()});
        });

        broadcastLogs("[Server]: Server Restarting");
      } else {
        broadcastLogs([Error]: Server failed to stop (code: ${code}));
        res.send("Server restart failed.");
      }
    });
  } else {
    broadcastLogs("[Error]: Server is not running");
    res.send("Server is not running.");
  }
});

// Endpoint to get the list of players
// Updated players list to include statuses

// Function to update player status (connected/disconnected)
function updatePlayerStatus(playerName, status) {
  const player = players.find((p) => p.name === playerName);
  if (player) {
    player.status = status; // Update status
  } else if (status === "connected") {
    players.push({ name: playerName, status }); // Add new player
  }
}

// Fetch player list logic in /getPlayers
// Persist player status here { playerName: status }

app.get("/getPlayers", authRequired, (req, res) => {
  if (minecraftProcess) {
    // Process connection logs
    logs.forEach((log) => {
      // Detect "Player connected"
      const connectMatch = log.match(/Player connected: (.+?), xuid:/); // Adjust regex as needed
      if (connectMatch) {
        const playerName = connectMatch[1];
        players[playerName] = "connected"; // Update status to connected
      }

      // Detect "Player disconnected"
      const disconnectMatch = log.match(/Player disconnected: (.+?), xuid:/); // Adjust regex as needed
      if (disconnectMatch) {
        const playerName = disconnectMatch[1];
        players[playerName] = "disconnected"; // Update status to disconnected
      }

      // Detect "Player disconnected when server is shutdown"
      const serverOffMatch = log.match(/Server stop requested\./); // Adjust regex as needed
      if (serverOffMatch) {
        // Mark all players as disconnected
        Object.keys(players).forEach((playerName) => {
          players[playerName] = "disconnected";
        });
      }
    });

    // Save players to file after processing logs
    savePlayers();

    // Respond with all players and their statuses
    const playerList = Object.entries(players).map(([name, status]) => ({
      name,
      status,
    }));

    res.json(playerList);
  } else {
    res.status(500).json({ error: "Server is not running" });
  }
});





app.post("/command", authRequired, (req, res) => {
  const command = req.body.command;
  if (minecraftProcess) {
    minecraftProcess.stdin.write(${command}\n);
    broadcastLogs([Command]: ${command});
  } else {
    broadcastLogs("[Error]: Server is not running");
    res.send("Server is not running.");
  } 
});

app.post("/stop", authRequired, (req, res) => {
  if (minecraftProcess) {
    // Send stop command
    minecraftProcess.stdin.write("stop\n");
    broadcastLogs([Command]: stop);

    // Wait for the process to close
    minecraftProcess.on("close", (code) => {
      broadcastLogs([Server]: Minecraft server stopped with code ${code});
      minecraftProcess = null; // Reset the process variable
      res.send("Server stopped successfully.");
    });
  } else {
    broadcastLogs("[Error]: Server is not running");
    res.send("Server is not running.");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});


app.get("/editserver-properties", authRequired, (req, res) => {
  try {
    const fileContent = fs.readFileSync(serverPropertiesPath, "utf-8");
    const properties = parseProperties(fileContent);
    res.render("editserver-properties", { properties });
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
      if (req.body[key] !== undefined) {
        properties[key] = req.body[key];
      }
    });

    fs.writeFileSync(serverPropertiesPath, stringifyProperties(properties), "utf-8");

    // Respond with JSON success message
    res.json({ success: true, message: "Server properties updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating server.properties file" });
  }
});


// WebSocket handling
const server = app.listen(PORT, () => {
  console.log(App running at http://localhost:${PORT});
});

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.send(JSON.stringify(logs));
    wss.emit("connection", ws, req);
  });
});