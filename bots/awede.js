const bedrock = require('bedrock-protocol');
const client = bedrock.createClient({ 
  host: 'localhost', 
  port: 19132, 
  version: '1.21.50', 
  username: 'awede', 
  offline: true
});
console.log('connected');
console.log('Hit Control C If you want to stop');