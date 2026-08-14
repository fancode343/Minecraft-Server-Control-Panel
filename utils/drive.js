// utils/drive.js
require("dotenv").config();
const fs = require("fs");
const { google } = require("googleapis");

const driveConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
};

const isDriveConfigured = () =>
  Boolean(
    driveConfig.clientId &&
      driveConfig.clientSecret &&
      driveConfig.redirectUri &&
      driveConfig.refreshToken
  );

const oauth2Client = isDriveConfigured()
  ? new google.auth.OAuth2(
      driveConfig.clientId,
      driveConfig.clientSecret,
      driveConfig.redirectUri
    )
  : null;

if (oauth2Client) {
  oauth2Client.setCredentials({ refresh_token: driveConfig.refreshToken });
}

const drive = oauth2Client ? google.drive({ version: "v3", auth: oauth2Client }) : null;

function requireDrive() {
  if (!isDriveConfigured() || !drive) {
    const error = new Error("Google Drive backup is not configured.");
    error.code = "DRIVE_NOT_CONFIGURED";
    throw error;
  }
  return drive;
}

// List files inside a Google Drive folder
async function listFiles(folderId) {
  const googleDrive = requireDrive();
  const response = await googleDrive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name)",
  });
  return response.data.files;
}

// Download a file from Google Drive to a local destination path
async function downloadFile(fileId, destination) {
  const googleDrive = requireDrive();
  const dest = fs.createWriteStream(destination);
  return new Promise((resolve, reject) => {
    googleDrive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" },
      (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        res.data
          .on("end", () => {
            console.log(`File downloaded to ${destination}`);
            resolve();
          })
          .on("error", (err) => {
            console.error("Error downloading file.");
            reject(err);
          })
          .pipe(dest);
      }
    );
  });
}

module.exports = { drive, listFiles, downloadFile, isDriveConfigured };