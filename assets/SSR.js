document.addEventListener("DOMContentLoaded", () => {
  const logContainer = document.getElementById("logs");
  const responseModal = new bootstrap.Modal(document.getElementById("responseModal"));

  /**
   * Display the response modal with a given message.
   * @param {string} message - The message to display in the modal.
   */
  function showModal(message) {
    document.getElementById("responseModalBody").innerText = message;
    responseModal.show();
  }

  /**
   * Toggle the loading state for buttons.
   * @param {string} buttonId - The ID of the button.
   * @param {string} spinnerId - The ID of the spinner.
   * @param {string} checkId - The ID of the check icon.
   * @param {boolean} isLoading - Whether the button is in a loading state.
   */
  function toggleLoading(buttonId, spinnerId, checkId, isLoading) {
    const button = document.getElementById(buttonId);
    const spinner = document.getElementById(spinnerId);
    const check = document.getElementById(checkId);

    if (isLoading) {
      button.disabled = true;
      spinner.style.display = "inline-block";
      check.style.display = "none";
    } else {
      button.disabled = false;
      spinner.style.display = "none";
      check.style.display = "inline-block";

      // Remove the check icon after 5 seconds
      setTimeout(() => {
        check.style.display = "none";
      }, 5000);
    }
  }

  /**
   * Handle server actions with loading states.
   * @param {string} buttonId - The button's ID.
   * @param {string} spinnerId - The spinner's ID.
   * @param {string} checkId - The check icon's ID.
   * @param {string} url - The endpoint to call.
   * @param {string} successMessage - The message to log on success.
   */
  function sendServerAction(buttonId, spinnerId, checkId, url, successMessage) {
    toggleLoading(buttonId, spinnerId, checkId, true);

    fetch(url, { method: "POST" })
      .then((response) => response.text())
      .then((result) => {
        showModal(result);
        console.log(successMessage);
        toggleLoading(buttonId, spinnerId, checkId, false);
      })
      .catch((error) => {
        console.error("Error:", error);
        showModal("An error occurred while processing your request.");
        toggleLoading(buttonId, spinnerId, checkId, false);
      });
  }

  /**
   * Append a log entry to the log container.
   * @param {string} logEntry - The log entry to append.
   */
  function appendLog(logEntry) {
    const logLine = document.createElement("div");

    try {
      const parsedLog = JSON.parse(logEntry);
      logLine.textContent = Array.isArray(parsedLog)
        ? parsedLog.join("\n")
        : JSON.stringify(parsedLog, null, 2);
    } catch {
      logLine.textContent = logEntry;
    }

    logLine.style.whiteSpace = "pre-wrap";
    logContainer.appendChild(logLine);

    // Limit visible logs to the latest 100 entries
    if (logContainer.children.length > 100) {
      logContainer.removeChild(logContainer.firstChild);
    }

    logContainer.scrollTop = logContainer.scrollHeight; // Auto-scroll to bottom
  }

  /**
   * Send a command to the server.
   * @param {string} command - The command to send.
   */
  function sendCommand(command) {
    logActivity(`${command}`)
    fetch("/command", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `command=${encodeURIComponent(command)}`,
    })
      .then((response) => response.text())
      .then((result) => {
        document.getElementById("commandInput").value = "";
        showModal(result);
      })
      .catch(() => showModal("An error occurred while processing your command."));
  }

  // WebSocket setup for live logs
  const socket = new WebSocket(
    `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`
  );

  socket.onopen = () => console.log("WebSocket connection established");
  socket.onmessage = (event) => appendLog(event.data);
  socket.onerror = (error) => console.error("WebSocket error:", error);
  socket.onclose = () => console.log("WebSocket connection closed");

  // Event listeners for server action buttons
  document.getElementById("startButton").addEventListener("click", () => {
    sendServerAction("startButton", "startSpinner", "startCheck", "/start", "Starting server...");
    logActivity("Server started");
  });

  document.getElementById("restartButton").addEventListener("click", () => {
    sendServerAction("restartButton", "restartSpinner", "restartCheck", "/restart", "Restarting server...");
    logActivity("Server Restarted")
  });

  document.getElementById("stopButton").addEventListener("click", () => {
    sendServerAction("stopButton", "stopSpinner", "stopCheck", "/stop", "Stopping server...");
    logActivity("Server Stop")
  });

  // Event listener for the command form
  document.getElementById("commandForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const command = document.getElementById("commandInput").value;
    sendCommand(command);
    
  });
});
