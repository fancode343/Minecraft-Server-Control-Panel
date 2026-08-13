// utils/discord.js
const https = require("https");

const WEBHOOK_URL = "https://discord.com/api/webhooks/1455535116548968531/BDtyQipPMB8fp_mmZMK2kaEqAxVFntAywrFNwTV66uFoPPQW46beAuRmJqe4obk0uqtj";

function sendMessageDis(content) {
  if (!content || content.trim() === "") return;

  content = content.toString().replace(/[^\x20-\x7E\n\r]/g, "");

  const data = JSON.stringify({ content });
  const url = new URL(WEBHOOK_URL);

  const req = https.request({
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
  });

  req.on("error", console.error);
  req.write(data);
  req.end();
}

module.exports = sendMessageDis;