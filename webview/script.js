const vscode = acquireVsCodeApi();

const messages = [];

function appendMessage(role, content) {
  messages.push({ role, content });
  const chatContainer = document.getElementById('chat-container');
  const newResponseDiv = document.createElement('div');
  newResponseDiv.className = `message ${role}`;
  newResponseDiv.innerHTML = `<div class="role-line">${role === 'user' ? 'user 🧑‍💻' : '🤖 assistant'}</div><div class="content-line">${content}</div>`;
  chatContainer.appendChild(newResponseDiv);
}

appendMessage('user', 'Hello, how can I assist you today?');
appendMessage('assistant', 'I am here to help you with your coding questions!');
appendMessage('user', 'What is the best way to learn JavaScript?');

document.getElementById('input-box').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    const userMessage = document.getElementById('input-box').value.trim();
    if (!userMessage) {
      return;
    }
    appendMessage('user', userMessage);
    vscode.postMessage({ command: 'sendQuery', messages });
    document.getElementById('query-input').value = '';
  }
});

window.addEventListener('message', (event) => {
  const message = event.data;
  switch (message.command) {
    case 'sendResponseDelta':

      break;
  }
});