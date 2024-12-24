const bedrock = require('bedrock-protocol');
const client = bedrock.createClient({ 
  host: 'localhost', 
  port: 19132, 
  version: '1.21.42', 
  username: 'dfd', 
  offline: false
});
console.log('connected');
console.log('Hit Control C If you want to stop');