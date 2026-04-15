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

    // --- NEW: Function to send the command to Minecraft ---
    function sendToMinecraft(user, text) {
        // Construct the tellraw command
        // We use JSON.stringify inside the text to ensure special characters don't break the JSON
        const rawJson = JSON.stringify({
            rawtext: [{ text: `[Panel]: <${user}> ${text}` }]
        });
        
        const commandString = `tellraw @a ${rawJson}`;

        fetch("/command", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `command=${encodeURIComponent(commandString)}`,
        })
        .then((response) => {
            console.log("Minecraft Fetch Status:", response.status); 
            return response.text();
        })
        .then((result) => {
            console.log("Minecraft Server Response:", result);
            // Optional: call showModal(result) if that function exists in your scope
            if (typeof showModal === "function") showModal(result);
        })
        .catch((error) => {
            console.error("Minecraft Fetch Error:", error);
        });
    }
    // -----------------------------------------------------

    // Toggle chat container visibility
    chatToggle.addEventListener('click', () => {
        chatContainer.style.display = chatContainer.style.display === 'none' || chatContainer.style.display === '' ? 'flex' : 'none';
    });

    // Send message through WebSocket AND to Minecraft
    sendMessageButton.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message) {
            // 1. Send to WebSocket (for other web users)
            ws.send(JSON.stringify({ user: username, message })); 
            
            // 2. Send to Minecraft (Trigger the command)
            sendToMinecraft(username, message);

            // 3. Clear input
            chatInput.value = ''; 
        }
    });

    // Display incoming messages (from WebSocket)
    ws.onmessage = (event) => {
        let data;
        try {
            data = JSON.parse(event.data);
        } catch (e) {
            console.error('Invalid JSON received from WebSocket:', event.data);
            return;
        }

        const { user, message } = data;

        if (!chatMessages) {
            console.error('Chat messages container not found.');
            return;
        }

        const messageElement = document.createElement('div');
        messageElement.textContent = `${user}: ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; 
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.warn('WebSocket connection closed.');
    };
});