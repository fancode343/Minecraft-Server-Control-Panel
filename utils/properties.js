// utils/properties.js

// Parse server.properties file content into a key-value object
function parseProperties(fileContent) {
  return fileContent
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .reduce((properties, line) => {
      const [key, value] = line.split("=").map((part) => part.trim());
      properties[key] = value;
      return properties;
    }, {});
}

// Convert a key-value object back into server.properties file format
function stringifyProperties(properties) {
  return Object.entries(properties)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

module.exports = { parseProperties, stringifyProperties };