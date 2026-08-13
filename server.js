const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

//LoadPlayers
const loadPlayers = require("./services/loadPlayers");
const MCbot = require("./services/MCbot");

const app = express();
app.use(express.json());
app.use(cors());
app.use(session({ secret: "minecraft_server_secret", resave: false, saveUninitialized: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Routes — auto-load every .js file in ./routes
const routesPath = path.join(__dirname, "routes");
fs.readdirSync(routesPath).forEach((file) => {
  if (file.endsWith(".js")) {
    app.use(require(path.join(routesPath, file)));
  }
});

app.get("/", require("./middleware/auth"), (req, res) => res.redirect("/dashboard"));
app.get("/logout", (req, res) => req.session.destroy(() => res.redirect("/auth")));

const PORT = 3000;
const server = app.listen(PORT, () => console.log(`App running at http://localhost:${PORT}`));