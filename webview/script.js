const vscode = acquireVsCodeApi();

let isReceivingResponse = false;
const messages = [];

function appendMessage(role, content, reasoning_content = '') {
  // update js object
  messages.push({ role, content, reasoning_content });

  // update dom
  const chatContainer = document.getElementById('chat-container');
  const newResponseDiv = document.createElement('div');

  const renderedContent = marked.parse(content);
  newResponseDiv.className = `message ${role}`;
  newResponseDiv.innerHTML = `<div class="role-line">${role === 'user' ? 'user 🧑‍💻' : '🤖 assistant'}</div><div class="content-line"><pre class="reasoning-content">${reasoning_content}</pre><div class="assistant-content">${renderedContent}</div></div>`;
  chatContainer.appendChild(newResponseDiv);
}

function scrollToBottom() {
  const chatContainer = document.getElementById('chat-container');
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLatestAssistantContent(deltaContent, deltaReasoningContent = '') {
  const chatContainer = document.getElementById('chat-container');
  const lastMessage = chatContainer.lastElementChild;
  if (!lastMessage || !lastMessage.classList.contains('assistant')) {
    appendMessage('assistant', deltaContent, deltaReasoningContent);
    return;
  }
  // update js object
  messages[messages.length - 1].content += deltaContent;
  messages[messages.length - 1].reasoning_content += deltaReasoningContent;

  // update dom
  const renderedContent = marked.parse(messages[messages.length - 1].content);

  const assistantContent = lastMessage.querySelector('.assistant-content');
  assistantContent.innerHTML = renderedContent;
  const reasoningContent = lastMessage.querySelector('.reasoning-content');
  reasoningContent.innerHTML += deltaReasoningContent;

  scrollToBottom();
}

function handleSendMessage() {
  if (isReceivingResponse) {
    vscode.postMessage({ command: 'displayMessage', text: 'Please wait for the response to finish.' });
    return;
  }

  const userMessage = document.getElementById('input-box').value.trim();
  if (!userMessage) {
    return;
  }
  appendMessage('user', userMessage);
  vscode.postMessage({ command: 'sendQuery', messages });
  document.getElementById('input-box').value = '';

  isReceivingResponse = true;
}

document.getElementById('input-box').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSendMessage();
  }
});

document.getElementById('send-button').addEventListener('click', (event) => {
  handleSendMessage();
});

document.getElementById('reset-button').addEventListener('click', (event) => {
  if (isReceivingResponse) {
    vscode.postMessage({ command: 'displayMessage', text: 'Please wait for the response to finish.' });
    return;
  }

  messages.length = 0; // Clear the messages array
  const chatContainer = document.getElementById('chat-container');
  chatContainer.innerHTML = ''; // Clear the chat container
  vscode.postMessage({ command: 'resetChat' });
});

window.addEventListener('message', (event) => {
  const message = event.data;
  switch (message.command) {
    case 'sendResponseDelta':
      const delta = message.delta;
      if (!delta) {
        return;
      }
      if (delta.content) {
        appendLatestAssistantContent(delta.content);
      } else if (delta.reasoning_content) {
        appendLatestAssistantContent('', delta.reasoning_content);
      }
      break;
    case 'sendResponseEnd':
      isReceivingResponse = false;
      break;
  }
});