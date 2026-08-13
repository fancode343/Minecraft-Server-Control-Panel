const { WebSocketServer } = require("ws");
const path = require("path");
const fs = require("fs");
const server = require("../server"); // shared http server from server.js

const MAX_LOG_COUNT = 200;
const logs = [];

const wss = new WebSocketServer({ noServer: true });

// Hook into the existing HTTP server's upgrade event
server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

console.log("     - WebSocket server attached to HTTP server");

const messagesFilePath = path.join(__dirname, "..", "messages.json");
if (!fs.existsSync(messagesFilePath)) {
  fs.writeFileSync(messagesFilePath, JSON.stringify([]), "utf8");
}

// Load messages from file
function loadMessages() {
  try {
    return JSON.parse(fs.readFileSync(messagesFilePath, "utf8"));
  } catch (error) {
    return [];
  }
}

// Save messages to file
function saveMessages(messages) {
  try {
    fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2), "utf8");
  } catch (error) {
    // ignore
  }
}

// Broadcast a log line to all connected clients
function broadcastLogs(message) {
  const raw = typeof message === "object" ? message.message : message;

  // Split multi-line chunks into separate log entries
  const lines = raw.split(/\r?\n/).filter((line) => line.trim() !== "");

  lines.forEach((line) => {
    logs.push(line);
    if (logs.length > MAX_LOG_COUNT) logs.shift();

    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) client.send(line);
    });
  });
}

const messages = loadMessages(); // Load chat messages globally

wss.on("connection", (ws) => {
  // Send chat history to the newly connected client
  ws.send(JSON.stringify({ type: "history", data: messages }));

  // Also send existing logs on connect
  ws.send(JSON.stringify({ type: "logs", data: logs }));

  ws.on("message", (message) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch (error) {
      console.error("Invalid JSON received:", message);
      ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      return;
    }

    messages.push(parsedMessage);
    saveMessages(messages);

    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({ type: "message", data: parsedMessage }));
      }
    });
  });

  ws.on("close", () => {
    // connection closed
  });
});

module.exports = { wss, broadcastLogs };