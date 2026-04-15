const bedrock = require('bedrock-protocol');
const readline = require('readline');
const https = require('https');
const WebSocket = require("ws");

// Your Discord Webhook URL
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1323555537803149357/n1zCkWkzwlqtHNbyqYP-htU4O-4eqQN9Om7P4ERHnSHGWjriRcxnVnyMAMVxlR1CUd5U';

let ws;
let wsReady = false;
let reconnectTimer = null;

let isAlive = false;

function heartbeat() {
  isAlive = true;
}

setInterval(() => {
  if (!ws) return;

  if (!isAlive) {
    console.warn("WS heartbeat failed, reconnecting...");
    ws.terminate();
    return;
  }

  isAlive = false;
  ws.ping();
}, 30000);


function connectWS() {
  ws = new WebSocket("wss://gjrj.lmnet.cf");

  ws.on("open", () => {
    wsReady = true;
    isAlive = true;
    console.log("WebSocket connected (bot)");
  });

  ws.on("pong", heartbeat);

  ws.on("close", () => {
    wsReady = false;
    console.log("WebSocket closed, reconnecting...");
    scheduleReconnect();
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);
    ws.terminate();
  });
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWS();
  }, 5000);
}

connectWS();


function sendWS(content) {
  if (!content || content.trim() === "") return;

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("WS not open, message skipped:", content);
    return;
  }

  ws.send(JSON.stringify({
    user: "[SERVER]",
    message: content
  }));

  console.log("Sent to WS:", content);
}

// Function to send message to Discord webhook
function sendMessage(content) {
  if (!content || content.trim() === "") return;

  content = content.toString().replace(/[^\x20-\x7E]/g, "");

  // --- Discord ---
  const data = JSON.stringify({ content });
  const url = new URL(WEBHOOK_URL);

  const req = https.request({
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data)
    }
  });

  req.on("error", console.error);
  req.write(data);
  req.end();
}


// Create the client
const client = bedrock.createClient({
  host: 'localhost',
  port: 19132,
  version: '1.21.130',
  username: 'bot1',
  offline: false,
});

console.log("Connecting...");

// Handle spawn event
client.on('spawn', () => {
  console.log("Online");
  sendMessage(':green_circle: **Bot is Online**');
});

// Handle disconnection
client.on('disconnect', (reason) => {
  console.error("Disconnected");
  sendMessage(':red_circle: **Bot Disconnected** Reason: ' + reason);
  cleanupAndExit();
});

// Handle connection close
client.on('close', (reason) => {
  console.error("Connection closed:", reason);
  sendMessage(':red_circle: **Connection Closed** Reason: ' + reason);
  cleanupAndExit();
});

// Setup readline interface for manual stop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', (input) => {
  if (input.trim().toLowerCase() === 'stop') {
    console.log('Stopping the process...');
    sendMessage(':warning: **Bot Stopping as requested**');
    cleanupAndExit();
  }
});

// Cleanup and exit function
function cleanupAndExit() {
  console.log('Cleaning up resources before exit...');
  client.removeAllListeners();
  client.disconnect('Client stopping as requested.');
  rl.close();

  setTimeout(() => {
    console.log('Exiting...');
    process.exit(0);
  }, 1000);
}

// Listen for text messages (chat + system messages)
client.on('text', (packet) => {
  const message = packet.message || '';
  const cleanMessage = message.replace(/§./g, ''); // Remove color codes

  // Detect join message using parameters
  if (message.includes('%multiplayer.player.joined')) {
    let playerName = 'Unknown Player';
    if (packet.parameters && packet.parameters.length > 0) {
      playerName = String(packet.parameters[0]);
    } else {
      const match = cleanMessage.match(/^(.+?) joined the game$/i);
      if (match && match[1]) playerName = match[1];
    }

    playerName = playerName.trim();
    console.log(`[JOIN] ${playerName} joined the game`);
    sendMessage(`✅ **${playerName} joined the game**`);
    sendWS(`${playerName} joined the server`);
    return;
  }

  // Detect leave message using parameters
  if (message.includes('%multiplayer.player.left')) {
    let playerName = 'Unknown Player';
    if (packet.parameters && packet.parameters.length > 0) {
      playerName = String(packet.parameters[0]);
    } else {
      const match = cleanMessage.match(/^(.+?) left the game$/i);
      if (match && match[1]) playerName = match[1];
    }

    playerName = playerName.trim();
    console.log(`[LEAVE] ${playerName} left the game`);
    sendMessage(`❌ **${playerName} left the game**`);
    sendWS(`${playerName} left the server`);
    return;
  }

  // Regular chat messages
  if (packet.source_name) {
    const msg = `**${packet.source_name}** said: "***${cleanMessage}***" on ${new Date().toLocaleString()}`;
    sendWS(`<${packet.source_name}> ${cleanMessage}`);
    console.log(msg);
    sendMessage(msg);
  }
});
