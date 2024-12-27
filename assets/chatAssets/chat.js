  document.addEventListener("DOMContentLoaded", () => {
    const chatContainer = document.getElementById('chatContainer');
    const chatToggle = document.getElementById('chatToggle');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageButton = document.getElementById('sendMessageButton');

    // Rendered username from the server
    const username = "<%= username %>";

    if (!chatContainer || !chatMessages || !chatInput || !sendMessageButton || !chatToggle) {
      console.error('One or more required chat elements are missing.');
      return;
    }

    const ws = new WebSocket('ws://localhost:3000');

    // Toggle chat container visibility
    chatToggle.addEventListener('click', () => {
      chatContainer.style.display = chatContainer.style.display === 'none' || chatContainer.style.display === '' ? 'flex' : 'none';
    });

    // Send message through WebSocket
    sendMessageButton.addEventListener('click', () => {
      const message = chatInput.value.trim();
      if (message) {
        ws.send(JSON.stringify({ user: username, message })); // Use the username
        chatInput.value = ''; // Clear input field
      }
    });

    // Display incoming messages
    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data); // Parse JSON
      } catch (e) {
        console.error('Invalid JSON received from WebSocket:', event.data);
        return; // Exit on invalid JSON
      }

      const { user, message } = data;

      if (!chatMessages) {
        console.error('Chat messages container not found.');
        return;
      }

      const messageElement = document.createElement('div');
      messageElement.textContent = `${user}: ${message}`;
      chatMessages.appendChild(messageElement);
      chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to bottom
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.warn('WebSocket connection closed.');
    };
  });
