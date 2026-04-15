const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { google } = require("googleapis");

// Google Drive API setup
const CLIENT_ID = "656806936758-3gu6etceoh3hml1tb6lq88r7hbcvp0n1.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = "1//049vBEoqfykyWCgYIARAAGAQSNwF-L9IrdOYbGyOi1fHRZNs0Cea2PrnK17KS1GO47pYrEJl-ZXPAhzpa34hvGTLhrXrcWuCFpZE";

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth: oauth2Client });

// Paths
const worldFolder = "/home/lmnet/server/server/worlds"; // Your Minecraft world folder
const tempZipPath = `/home/lmnet/server/server/backups/backup-${Date.now()}.zip`; // Temporary file
const folderId = "1qlpj1z54w0Q0HVE1TvgKB3qhdFJsSgW3"; // Google Drive folder ID

async function createBackup() {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(tempZipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => resolve());
        archive.on("error", (err) => reject(err));

        archive.pipe(output);
        archive.directory(worldFolder, false);
        archive.finalize();
    });
}

async function uploadBackup() {
    const fileName = path.basename(tempZipPath);

    const fileMetadata = {
        name: fileName,
        parents: [folderId],
    };

    const media = {
        mimeType: "application/zip",
        body: fs.createReadStream(tempZipPath),
    };

    const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id",
    });

    console.log(`✅ Backup uploaded: ${fileName}`);
    return response.data.id;
}

async function deleteOldDriveBackups() {
    const res = await drive.files.list({
        q: `'${folderId}' in parents`,
        fields: "files(id, name, createdTime)",
        orderBy: "createdTime asc",
    });

    const files = res.data.files;
    while (files.length > 12) {
        const oldest = files.shift();
        await drive.files.delete({ fileId: oldest.id });
        console.log(`🗑️ Deleted oldest Google Drive backup: ${oldest.name}`);
    }
}

function removeLocalBackup() {
    if (fs.existsSync(tempZipPath)) {
        fs.unlinkSync(tempZipPath);
        console.log("🧹 Removed local temporary backup file");
    }
}

async function backupProcess() {
    try {
        console.log("⏳ Creating backup...");
        await createBackup();
        console.log(`✅ Local backup created: ${tempZipPath}`);

        await uploadBackup();
        await deleteOldDriveBackups();
        removeLocalBackup();

        console.log("✅ Backup process completed!");
    } catch (error) {
        console.error("❌ Error during backup:", error);
    }
}

backupProcess();
