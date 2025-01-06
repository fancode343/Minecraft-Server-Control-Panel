







app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Load credentials from credentials.json
  const credentialsPath = path.join(__dirname, "credentials.json");
  fs.readFile(credentialsPath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading credentials file:", err);
      return res.status(500).render("login", { error: "Server error. Please try again later." });
    }

    let users;
    try {
      users = JSON.parse(data); // Parse JSON content
    } catch (parseErr) {
      console.error("Error parsing credentials file:", parseErr);
      return res.status(500).render("login", { error: "Server error. Please try again later." });
    }

    // Check credentials
    if (users[username] === password) {
      req.session.loggedIn = true;
      req.session.username = username;
      return res.redirect("/panel");
    }

    // Invalid login
    res.render("login", { error: "Invalid username or password" });
  });
});