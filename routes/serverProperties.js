const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const authRequired = require("../middleware/auth");
const { serverPropertiesPath } = require("../utils/folders");
const { parseProperties, stringifyProperties } = require("../utils/properties");

router.get("/editserver-properties", authRequired, (req, res) => {
  try {
    const fileContent = fs.readFileSync(serverPropertiesPath, "utf-8");
    const properties = parseProperties(fileContent);

    res.render("editserver-properties", {
      properties,
      username: req.session.username || "Admin",
    });
  } catch (error) {
    res.locals.Error = "Error reading server.properties file";
    res.render("500");
    //res.status(500).send("Error reading server.properties file");
  }
});

router.post("/editserver-properties", authRequired, (req, res) => {
  try {
    const fileContent = fs.readFileSync(serverPropertiesPath, "utf-8");
    const properties = parseProperties(fileContent);
    const editableKeys = [
      "difficulty",
      "view-distance",
      "gamemode",
      "max-players",
      "server-name",
      "level-name",
      "texturepack-required",
      "level-seed",
      "tick-distance",
      "force-gamemode",
      "allow-cheats",
      "allow-list",
      "online-mode",
      "server-port",
      "server-portv6",
      "transport",
      "enable-lan-visibility"
    ];

    editableKeys.forEach((key) => {
      if (req.body[key] !== undefined) properties[key] = req.body[key];
    });

    fs.writeFileSync(serverPropertiesPath, stringifyProperties(properties), "utf-8");
    res.json({ success: true, message: "Server properties updated successfully" });
  } catch (error) {
    //res.status(500).json({ success: false, message: "Error updating server.properties file" });
    res.locals.Error = "Error reading server.properties file";
    res.render("500");
  }
});

module.exports = router;