const socket = io();
const chatMessages = document.getElementById('chatMessages');

function addMessage(data, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const content = document.createElement('div');
    content.className = 'message-content';

    if (type === 'npc') {
        const messageType = document.createElement('div');
        messageType.className = 'message-type';
        messageType.textContent = data.type || 'Action'; // Could be 'Goal', 'Thought', 'Action', or 'Talk'
        content.appendChild(messageType);
    }

    const text = document.createElement('div');
    text.className = 'message-text';
    
    // Handle different types of messages
    if (typeof data === 'string') {
        text.textContent = data;
    } else {
        // Format the data based on what type of state it is
        if (data.hlp) {
            text.textContent = `Plan: ${data.hlp.plan.join(', ')}`;
        } else if (data.current_task) {
            text.textContent = `Task: ${data.current_task.task}`;
        } else {
            text.textContent = JSON.stringify(data, null, 2);
        }
    }
    
    content.appendChild(text);

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(content);
    messageDiv.appendChild(meta);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Listen for various NPC events
socket.on('npc_state', (data) => {
    addMessage(data, 'npc');
});

socket.on('npc_action', (data) => {
    addMessage(data, 'npc');
});

socket.on('npc_talk', (data) => {
    addMessage(data, 'npc');
});

socket.on('system_message', (data) => {
    addMessage(data, 'system');
});
