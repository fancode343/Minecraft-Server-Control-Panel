const bedrock = require('bedrock-protocol');
const { relativeTimeRounding } = require('moment-timezone');
const readine = require('readline')
const client = bedrock.createClient({ 
  host: 'localhost', 
  port: 19132, 
  version: '1.21.42', 
  username: 'finalbot', 
  offline: true
});

console.log("Connecting")
client.on('spawn', () => {
  console.log("Onine")
})

rl.on('line', (input) => {
  if (input.trim().toLowerCase() === 'stop') {
    console.log('Stopping the process...');
    cleanupAndExit();
  }
})
function cleanupAndExit() {
  console.log('Cleaning up resources before exit...');
  client.removeAllListeners();
  client.disconnect('Client stopping as requested.');
  rl.close();

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

