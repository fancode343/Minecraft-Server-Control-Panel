# Minecraft Server Control Panel

Take full control of your Minecraft server with a powerful and user-friendly control panel designed to make server management faster, easier, and more efficient. Whether you are hosting a small private world for friends or managing a large multiplayer community, this system helps simplify every aspect of server administration.

Monitor your server performance in real time, manage players effortlessly, and configure settings through an organized and modern dashboard. With built-in tools for automation and maintenance, you can start, stop, restart, and manage your server without dealing with complicated commands or manual processes.

This control panel is built to improve efficiency, reduce management time, and provide a smoother experience for both administrators and players. Its clean interface and reliable features allow you to focus more on building your community and enjoying gameplay instead of handling technical issues.

## ✨ Features
- 🚀 Easy server start, stop, and restart controls  
- 📊 Real-time server monitoring and performance tracking  
- 👥 Player management and moderation tools  
- 💾 Automated backups and maintenance system  
- ⚙️ User-friendly dashboard with organized controls  
- 🔒 Secure and reliable server management  
- 🌐 Efficient tools for both small and large servers  

> Make your Minecraft server management smarter, faster, and more reliable.


## How it Works?
**Edit index.js**
- Paste your webhook url on line 14
  - ```const WEBHOOK_URL = 'https://discord.com/api/webhooks/YOU_WENHOOK_URL';```
- Put Your Google Drive Authentication on line 135-140 (For Backup purposes)
  - ```const CLIENT_ID = "YOUR_ID";```
  - ```const CLIENT_SECRET = "YOOUR_SECRET";```
  - ```const REDIRECT_URI = "YOUR_URI";```
  - ```const REFRESH_TOKEN = "YOUR_TOKEN";```

**In your terminal**
- Install need packages
  - ```npm install express express-session body-parser child_process ws fs googleapis fs-extra https child_process bedrock-protocol```

**Run the program**
```
node index.js
```


**Ports that you need to open**
```
3000 --> Server
5000 --> Web socket (optional)
19132 --> Minecraft server port (You can change this on server.properties)
```
> This panel is only design for Minecraft Bedrock Edition.



