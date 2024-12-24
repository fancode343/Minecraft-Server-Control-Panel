const bedrock = require('bedrock-protocol');
const readline = require('readline');

// Set up the Bedrock client
const client = bedrock.createClient({
  host: 'localhost',
  port: 19132,
  version: '1.21.50',
  username: 'claire',
  offline: true,
});

let targetPlayerId = null; // Store the runtime ID of the target player

console.log('Connecting...');

// Handle the player list
client.on('player_list', (packet) => {
  console.log('Player list updated.');

  // Convert `records` to an array if necessary
  const records = Array.isArray(packet.records) ? packet.records : Object.values(packet.records || {});

  // Iterate over records safely
  records.forEach((record) => {
    if (record && record.username) {
      console.log(`Player: ${record.username}, Runtime ID: ${record.entityId}`);
      if (record.username === 'targetPlayerName') {
        // Replace 'targetPlayerName' with the name of the player you want to track
        targetPlayerId = record.entityId;
        console.log(`Tracking inventory for player: ${record.username}`);
      }
    } else {
      console.warn('Invalid or undefined record:', record);
    }
  });
});

// Function to listen for inventory updates
function listenForInventoryUpdates() {
  console.log('Listening for inventory updates...');

  client.on('inventory_content', (packet) => {
    if (packet.windowId === targetPlayerId) {
      console.log(`Inventory update for player with ID ${targetPlayerId}:`);
      const items = packet.input;

      if (!items || items.length === 0) {
        console.log('No items in inventory.');
        return;
      }

      items.forEach((item, index) => {
        if (item) {
          console.log(
            `Slot ${index}: ${item?.name || 'Unknown Item'} (Count: ${item?.count || 0}, Metadata: ${item?.metadata || 0})`
          );
        } else {
          console.log(`Slot ${index}: Empty`);
        }
      });
    }
  });

  client.on('inventory_slot', (packet) => {
    if (packet.windowId === targetPlayerId) {
      console.log(
        `Slot update for player with ID ${targetPlayerId} - Slot ${packet.slot}: ${
          packet.item?.name || 'Unknown Item'
        } (Count: ${packet.item?.count || 0}, Metadata: ${packet.item?.metadata || 0})`
      );
    }
  });
}

// Start listening for inventory updates
client.on('spawn', () => {
  console.log('Player has spawned.');
  listenForInventoryUpdates();
});

// Readline interface for terminating the process
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Type 'stop' to terminate the process.");

rl.on('line', (input) => {
  if (input.trim().toLowerCase() === 'stop') {
    console.log('Stopping the process...');
    cleanupAndExit();
  }
});

// Clean up resources and exit
function cleanupAndExit() {
  console.log('Cleaning up resources before exit...');
  client.removeAllListeners();
  client.disconnect('Client stopping as requested.');
  rl.close();

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}
