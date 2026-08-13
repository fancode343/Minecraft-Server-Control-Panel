const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const sendMessageDis = require("../utils/discord");
const authRequired = require("../middleware/auth");
const { activityLogPath } = require("../utils/folders");


router.post("/activity-log", authRequired, async (req, res) => {
  const { user, action, timestamp } = req.body;

  console.log("Request body received:", req.body);

  if (!user || !action || !timestamp) {
    console.error("Invalid activity data:", req.body);
    return res.status(400).json({ error: "Invalid activity data" });
  }

  // Validate the timestamp
  const utc8Date = new Date(timestamp);
  if (isNaN(utc8Date.getTime())) {
    console.error("Invalid timestamp format:", timestamp);
    return res.status(400).json({ error: "Invalid timestamp format" });
  }

  // Append log with validated timestamp
  try {
    const logs = JSON.parse(fs.readFileSync(activityLogPath, "utf8"));
    logs.push({ user, action, timestamp });
    fs.writeFileSync(activityLogPath, JSON.stringify(logs, null, 2), "utf8");

    console.log("Activity logged successfully");
    res.status(200).json({ message: "Activity logged successfully" });
  } catch (error) {
    console.error("Error logging activity:", error);
    res.status(500).json({ error: "Failed to log activity" });
  }
});

router.get("/activitylogss", authRequired, (req, res) => {
  const messageFilePath = path.join(__dirname, "../activity_log.json");

  // Read the JSON file
  fs.readFile(messageFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading activity_log.json:", err);
      return res.status(500).json({ error: "Failed to load activity logs." });
    }

    try {
      // Parse JSON data
      let logs = JSON.parse(data);

      // Ensure it's an array if not
      if (!Array.isArray(logs)) {
        logs = [logs];
      }

      // Sort logs by timestamp
      logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Send the sorted logs as a response
      res.json(logs);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      res.status(500).json({ error: "Invalid JSON format in activity_log.json." });
    }
  });
});
module.exports = router;