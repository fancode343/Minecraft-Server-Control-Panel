<script>
    document.addEventListener("DOMContentLoaded", () => {
      // DOM elements
      const chatContainer = document.getElementById("chatContainer");
      const chatMessages = document.getElementById("chatMessages");
      const chatInput = document.getElementById("chatInput");
      const sendMessageButton = document.getElementById("sendMessageButton");
      const chatToggle = document.getElementById("chatToggle");
      const closeChatButton = document.getElementById("closeChatButton");
  
      // Username
      const username = "<%= username %>";
  
      // WebSocket connection
      const ws = new WebSocket("wss://gjrj.lmnet.cf/ws"); 
  
      function appendMessage(user, message) {
        if (!chatMessages) return;
        const messageElement = document.createElement("div");
        messageElement.textContent = `${user}: ${message}`;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
      }
  
      function scrollToBottom() {
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }
  
      // --- SILENT MINECRAFT SENDER ---
      function sendToMinecraft(user, text) {
        const tellrawJson = JSON.stringify({
             rawtext: [{ text: `§a[Panel]:§r <${user}> ${text}` }] 
        });
        const commandString = `tellraw @a ${tellrawJson}`;
  
        fetch("/command", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `command=${encodeURIComponent(commandString)}`,
        })
        .then((response) => response.text()) // Convert response to text
        .then((result) => {
            console.log("Minecraft response:", result); // Log only
        })
        .catch((error) => {
            console.error("Minecraft command failed:", error); // Log only
        });
      }
      // -------------------------------
  
      function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
          // 1. Send via WebSocket
          ws.send(JSON.stringify({ user: username, message })); 
  
          // 2. Send via HTTP POST (Silently)
          sendToMinecraft(username, message);
  
          // 3. Clear input
          chatInput.value = ""; 
        }
      }
  
      ws.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (error) {
          return;
        }
  
        if (data.type === "history") {
          chatMessages.innerHTML = ""; 
          data.data.forEach((msg) => appendMessage(msg.user, msg.message));
          scrollToBottom(); 
        } else if (data.type === "message") {
          appendMessage(data.data.user, data.data.message);
          if (chatContainer.style.display === "none") {
            chatToggle.classList.add("new-message"); 
          }
        }
      };
  
      ws.onerror = (error) => console.error("WebSocket error:", error);
      
      sendMessageButton.addEventListener("click", sendMessage);
  
      chatInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault(); 
          sendMessage(); 
        }
      });
  
      chatToggle.addEventListener("click", () => {
        chatContainer.style.display = "flex";
        chatToggle.style.display = "none"; 
        chatToggle.classList.remove("new-message"); 
        scrollToBottom(); 
      });
  
      closeChatButton.addEventListener("click", () => {
        chatContainer.style.display = "none";
        chatToggle.style.display = "block"; 
      });
    });
    
    </script>