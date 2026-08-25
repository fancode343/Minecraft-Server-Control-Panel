const fs = require("fs");
const path = require("path");
const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();
const authRequired = require("../middleware/auth");

router.post("/save-server-name", authRequired, (req, res) => {
  const settingsPath = path.join(__dirname, "../settings.json");
  const serverName = typeof req.body.serverName === "string" ? req.body.serverName.trim() : "";

  if (!serverName) {
    return res.status(400).json({ success: false, message: "Server name is required." });
  }

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    settings.SERVER_NAME = serverName;
    fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");

    res.json({ success: true, message: "Server name updated successfully." });
  } catch (error) {
    console.error("Error updating server name:", error);
    res.status(500).json({ success: false, message: "Unable to update server name." });
  }
});

router.post("/save-settings", authRequired, (req, res) => {
  const { oldPassword, password } = req.body;
  const username = req.session.username;

  // Validate input
  if (!oldPassword || !password) {
    return res.render("settings", {
      username,
      error: "Both old and new passwords are required.", // Passing error
    });
  }

  // Path to credentials.json
  const { credentialsPath} = require("../utils/folders");

  // Read and update credentials.json
  fs.readFile(credentialsPath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading credentials file:", err);
      return res.render("settings", {
        username,
        error: "Server error. Please try again later.", // Passing error
      });
    }

    let users;
    try {
      users = JSON.parse(data); // Parse existing credentials
    } catch (parseErr) {
      console.error("Error parsing credentials file:", parseErr);
      return res.render("settings", {
        username,
        error: "Server error. Please try again later.", // Passing error
      });
    }

    // Check if the old password is correct
    if (users[username] !== oldPassword) {
      return res.render("settings", {
        username,
        error: "Old password does not match.", // Passing error
      });
    }

    // Update the password
    users[username] = password; // Set the new password

    // Write the updated credentials back to the file
    fs.writeFile(credentialsPath, JSON.stringify(users, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Error writing credentials file:", writeErr);
        return res.render("settings", {
          username,
          error: "Server error. Please try again later.", // Passing error
        });
      }

      // Success message
      res.render("settings", {
        username,
        success: "Password updated successfully.", // Passing success message
      });
    });
  });
});

module.exports = router;