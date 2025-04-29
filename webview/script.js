const vscode = acquireVsCodeApi();

document.getElementById('send-button').addEventListener('click', () => {
    const userMessage = document.getElementById('query-input').value;
    if (userMessage.trim()) {
        vscode.postMessage({ command: 'sendQuery', userMessage });
        document.getElementById('query-input').value = '';
    }
});

window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.command) {
        case 'sendResponseDelta':
            const chatContainer = document.getElementById('chat-container');
            let lastResponseDiv = chatContainer.lastElementChild;
            if (!lastResponseDiv || !lastResponseDiv.classList.contains('response')) {
                lastResponseDiv = document.createElement('pre');
                lastResponseDiv.classList.add('response');
                chatContainer.appendChild(lastResponseDiv);
            }
            lastResponseDiv.textContent += message.delta.content;
            chatContainer.scrollTop = chatContainer.scrollHeight;
            break;
    }
});