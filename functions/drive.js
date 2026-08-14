const fs = require("fs");
const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();
const authRequired = require("../middleware/auth");
const { drive, listFiles, downloadFile, isDriveConfigured } = require("../utils/drive");
const { broadcastLogs } = require("../services/WebSocket");
const { exec } = require("child_process");
const path = require("path");
const fsExtra = require("fs-extra");
const { downloadsPath, serverWorldsPath } = require("../utils/folders");
const state = require("../state");

router.get("/api/files", authRequired, async (req, res) => {
  const { type } = req.query;

  if (!isDriveConfigured()) {
    return res.status(503).json({
      error: "Google Drive backup is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, and GOOGLE_REFRESH_TOKEN to enable this feature.",
    });
  }

  const folderId =
    type === "dayToDay"
      ? "1mrkAbQR1SoF_dlhPAa0xqQC0Hw3T81Se"
      : "1qlpj1z54w0Q0HVE1TvgKB3qhdFJsSgW3";

  if (!type || !folderId) {
    return res.status(400).json({ error: "Invalid backup type." });
  }

  try {
    // Retrieve files from Google Drive
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name, modifiedTime)",
    });

    // Format the file list with date and time in UTC+8
    const files = response.data.files.map((file) => ({
      id: file.id,
      name: file.name,
      modifiedTime: new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Shanghai", // Specify UTC+8 timezone
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(file.modifiedTime)), // Format date and time in UTC+8
    }));

    res.json(files);
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({ error: "Failed to retrieve files." });
  }
});

router.post("/api/backup", authRequired, async (req, res) => {
  const { type, fileId, fileName } = req.body;
  if (!type || !fileId || !fileName) {
    return res.status(400).send("Invalid backup request.");
  }

  if (!isDriveConfigured()) {
    return res.status(503).send(
      "Google Drive backup is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, and GOOGLE_REFRESH_TOKEN to enable this feature."
    );
  }

  try {
    // Stop the server
    if (state.minecraftProcess) {
      state.minecraftProcess.stdin.write("stop\n");
      broadcastLogs("[Command]: stop");
  
      state.minecraftProcess.on("close", (code) => {
        broadcastLogs(`[Server]: Minecraft server stopped with code ${code}`);
        state.minecraftProcess = null;
      });
    } else {
      broadcastLogs("[Error]: server backuped");
    }
    console.log("Server stopped.");

    // Download the selected file
    const backupPath = path.join(downloadsPath, fileName);
    console.log(`Downloading file ${fileName} from Google Drive...`);
    await downloadFile(fileId, backupPath);
    console.log(`Downloaded file to ${backupPath}`);

    // Remove the existing worlds folder
    if (fs.existsSync(serverWorldsPath)) {
      console.log("Removing existing worlds folder...");
      fsExtra.removeSync(serverWorldsPath);
      console.log("Removed existing worlds folder.");
    }

    // Extract the new backup
    console.log(`Extracting ${fileName} using unzip...`);
    const extractDir = path.join(__dirname, "server/worlds");
    const unzipCommand = `unzip -o ${backupPath} -d ${extractDir}`;

    await new Promise((resolve, reject) => {
      exec(unzipCommand, (err, stdout, stderr) => {
        if (err) {
          console.error("Error extracting ZIP file:", stderr);
          reject(new Error("Failed to extract ZIP file using unzip command."));
        } else {
          console.log("Extraction output:", stdout);
          resolve();
        }
      });
    });

    console.log(`Extracted ${fileName} to ${extractDir}.`);
    res.send("Backup completed and server stopped.");
  } catch (error) {
    console.error("Backup process failed:", error);
    res.status(500).send("An error's occurred during the backup process.");
  }
});




module.exports = router;