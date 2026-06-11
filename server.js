const express = require("express");
const app = express();

app.use(require("./routes/auth"));
app.use(require("./routes/dashboard"));
app.use(require("./routes/bots"));
app.use(require("./routes/server"));
app.use(require("./routes/backup"));
app.use(require("./routes/settings"));

app.listen(3000, () => {
    console.log("Server running");
});