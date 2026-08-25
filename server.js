require("dotenv").config();

const http = require("http");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());
app.use(session({ secret: "minecraft_server_secret", resave: false, saveUninitialized: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use((req, res, next) => {
  try {
    const settings = JSON.parse(fs.readFileSync(path.join(__dirname, "settings.json"), "utf8"));
    res.locals.serverName = settings.SERVER_NAME || "Minecraft Server";
    res.locals.serverDescription = settings.SERVER_DESCRIPTION || "";
    res.locals.serverIcon = settings.SERVER_ICON || "";
    res.locals.loader = settings.LOADER || "BEDROCK";
    res.locals.mcVersion = settings.MC_VERSION || "";
    res.locals.serverIP = settings.SERVER_IP || "";
    res.locals.serverPort = settings.SERVER_PORT || "";
  } catch (err) {
    console.error("Error loading settings.json for navbar:", err);
    // Fallback defaults when settings.json can't be read
    res.locals.serverName = "Minecraft Server";
    res.locals.serverDescription = "";
    res.locals.serverIcon = "";
    res.locals.loader = "BEDROCK";
    res.locals.mcVersion = "";
    res.locals.serverIP = "";
    res.locals.serverPort = "";
  }
  next();
});

const server = http.createServer(app);

module.exports = server;

const PORT = 3000;
server.listen(PORT, () => console.log(`App running at http://localhost:${PORT}`));

console.log("Loading services: ");
const servicesPath = path.join(__dirname, "services");
fs.readdirSync(servicesPath).forEach((file) => {
  if (file.endsWith(".js")) {
    const service = require(path.join(servicesPath, file));
    console.log(`   - ${file}\n`);
  }
});
console.log("All services loaded successfully.");

// Routes — auto-load every .js file in ./routes
const routesPath = path.join(__dirname, "routes");
console.log("Loading routes: ");
fs.readdirSync(routesPath).forEach((file) => {
  if (file.endsWith(".js")) {
    app.use(require(path.join(routesPath, file)));
    console.log(`   - ${file}`);
  }
});
console.log("All routes loaded successfully.");

app.get("/", require("./middleware/auth"), (req, res) => res.redirect("/dashboard"));
app.get("/logout", (req, res) => req.session.destroy(() => res.redirect("/auth")));
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "", "404.html"));
});