const fs = require("fs");
const path = require("path");
const os = require("os");

function getSystemIPv4() {
  const networkInterfaces = os.networkInterfaces();
  
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    for (const addr of addresses) {
      // Get IPv4 addresses that are not internal/localhost
      if (addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }
  
  // Fallback to localhost if no external IPv4 found
  return "localhost";
}

function checkAndSyncServerIP(settingsPath = path.join(__dirname, "../settings.json")) {
  try {
    const ip = getSystemIPv4();

    if (!ip || ip.length === 0) {
      return null;
    }

    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    if (settings.SERVER_IP !== ip) {
      settings.SERVER_IP = ip;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
    }

    return ip;
  } catch (error) {
    console.error("Error syncing SERVER_IP from system:", error);
    return null;
  }
}

function startIPSyncMonitor(intervalMs = 2000, settingsPath = path.join(__dirname, "../settings.json")) {
  checkAndSyncServerIP(settingsPath);

  if (global.__mcServerIPSyncInterval) {
    return global.__mcServerIPSyncInterval;
  }

  global.__mcServerIPSyncInterval = setInterval(() => {
    checkAndSyncServerIP(settingsPath);
  }, intervalMs);

  return global.__mcServerIPSyncInterval;
}

module.exports = {
  checkAndSyncServerIP,
  startIPSyncMonitor,
};

if (require.main === module) {
  const ip = checkAndSyncServerIP();
  if (ip !== null) {
    console.log(`SERVER_IP updated to ${ip} from system IPv4`);
  } else {
    console.log("Could not detect system IPv4 address");
  }
} else {
  startIPSyncMonitor();
}
