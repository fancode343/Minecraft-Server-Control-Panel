const fs = require("fs");
const path = require("path");
const { serverPropertiesPath } = require("../utils/folders");
const { parseProperties } = require("../utils/properties");

function checkAndSyncServerName(settingsPath = path.join(__dirname, "../settings.json"), filePath = serverPropertiesPath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const properties = parseProperties(fs.readFileSync(filePath, "utf-8"));
    const rawName = properties["motd"];

    if (rawName === undefined || rawName === null || rawName === "") {
      return null;
    }

    const name = String(rawName).trim();
    if (name.length === 0) {
      return null;
    }

    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    if (settings.SERVER_NAME !== name) {
      settings.SERVER_NAME = name;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
    }

    return name;
  } catch (error) {
    console.error("Error syncing SERVER_NAME from server.properties:", error);
    return null;
  }
}

function startNameSyncMonitor(intervalMs = 2000, settingsPath = path.join(__dirname, "../settings.json"), filePath = serverPropertiesPath) {
  checkAndSyncServerName(settingsPath, filePath);

  if (global.__mcServerNameSyncInterval) {
    return global.__mcServerNameSyncInterval;
  }

  global.__mcServerNameSyncInterval = setInterval(() => {
    checkAndSyncServerName(settingsPath, filePath);
  }, intervalMs);

  return global.__mcServerNameSyncInterval;
}

module.exports = {
  checkAndSyncServerName,
  startNameSyncMonitor,
};

if (require.main === module) {
  const name = checkAndSyncServerName();
  if (name !== null) {
    console.log(`SERVER_NAME updated to ${name} from server.properties`);
  } else {
    console.log("No valid motd value found in server.properties");
  }
} else {
  startNameSyncMonitor();
}
