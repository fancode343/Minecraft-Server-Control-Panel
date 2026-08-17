const fs = require("fs");
const path = require("path");
const { serverPropertiesPath } = require("../utils/folders");
const { parseProperties } = require("../utils/properties");

function checkAndSyncServerPort(settingsPath = path.join(__dirname, "../settings.json"), filePath = serverPropertiesPath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const properties = parseProperties(fs.readFileSync(filePath, "utf-8"));
    const rawPort = properties["server-port"];

    if (rawPort === undefined || rawPort === null || rawPort === "") {
      return null;
    }

    const port = Number(rawPort);
    if (!Number.isInteger(port) || port <= 0) {
      return null;
    }

    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    if (settings.SERVER_PORT !== port) {
      settings.SERVER_PORT = port;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
    }

    return port;
  } catch (error) {
    console.error("Error syncing SERVER_PORT from server.properties:", error);
    return null;
  }
}

function startPortSyncMonitor(intervalMs = 2000, settingsPath = path.join(__dirname, "../settings.json"), filePath = serverPropertiesPath) {
  checkAndSyncServerPort(settingsPath, filePath);

  if (global.__mcServerPortSyncInterval) {
    return global.__mcServerPortSyncInterval;
  }

  global.__mcServerPortSyncInterval = setInterval(() => {
    checkAndSyncServerPort(settingsPath, filePath);
  }, intervalMs);

  return global.__mcServerPortSyncInterval;
}

module.exports = {
  checkAndSyncServerPort,
  startPortSyncMonitor,
};

if (require.main === module) {
  const port = checkAndSyncServerPort();
  if (port !== null) {
    console.log(`SERVER_PORT updated to ${port} from server.properties`);
  } else {
    console.log("No valid server-port value found in server.properties");
  }
} else {
  startPortSyncMonitor();
}
