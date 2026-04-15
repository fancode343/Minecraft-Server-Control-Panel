const bedrock = require('bedrock-protocol');
const readline = require('readline');

// Create the client
const client = bedrock.createClient({ 
  host: 'localhost', 
  port: 19132, 
  version: '1.21.111', 
  username: 'bot3', 
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
