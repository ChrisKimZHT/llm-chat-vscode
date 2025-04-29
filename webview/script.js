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

function appendLatestAssistantContent(deltaContent) {
  const chatContainer = document.getElementById('chat-container');
  const lastMessage = chatContainer.lastElementChild;
  if (!lastMessage || !lastMessage.classList.contains('assistant')) {
    appendMessage('assistant', deltaContent);
    return;
  }
  const contentLine = lastMessage.querySelector('.content-line');
  contentLine.innerHTML += deltaContent;
}

document.getElementById('input-box').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    const userMessage = document.getElementById('input-box').value.trim();
    if (!userMessage) {
      return;
    }
    appendMessage('user', userMessage);
    vscode.postMessage({ command: 'sendQuery', messages });
    document.getElementById('input-box').value = '';
  }
});

window.addEventListener('message', (event) => {
  const message = event.data;
  switch (message.command) {
    case 'sendResponseDelta':
      const delta = message.delta;
      if (!delta) {
        return;
      }
      const content = delta.content;
      appendLatestAssistantContent(content);
      break;
  }
});