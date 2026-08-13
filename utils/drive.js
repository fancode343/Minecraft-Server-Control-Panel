// utils/drive.js
const fs = require("fs");
const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth: oauth2Client });

// List files inside a Google Drive folder
async function listFiles(folderId) {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name)",
  });
  return response.data.files;
}

// Download a file from Google Drive to a local destination path
async function downloadFile(fileId, destination) {
  const dest = fs.createWriteStream(destination);
  return new Promise((resolve, reject) => {
    drive.files.get(
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

module.exports = { drive, listFiles, downloadFile };