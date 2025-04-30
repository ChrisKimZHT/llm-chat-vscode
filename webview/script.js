const vscode = acquireVsCodeApi();

let isReceivingResponse = false;
const messages = [];

let l10nBundle = {};

function l10n(text) {
  return l10nBundle[text] || text;
}

function appendMessage(role, content, reasoning_content = '', skipUpdateJsObject = false) {
  // update js object
  if (!skipUpdateJsObject) {
    messages.push({ role, content, reasoning_content });
  }

  // update dom
  const chatContainer = document.getElementById('chat-container');
  const newResponseDiv = document.createElement('div');

  const renderedContent = marked.parse(content);
  newResponseDiv.className = `message ${role}`;
  newResponseDiv.innerHTML = `<div class="role-line">${role === 'user' ? `${l10n('user')} 🧑‍💻` : `🤖 ${l10n('assistant')}`}</div><div class="content-line"><pre class="reasoning-content">${reasoning_content}</pre><div class="assistant-content">${renderedContent}</div></div>`;
  chatContainer.appendChild(newResponseDiv);
}

function scrollToBottom() {
  const chatContainer = document.getElementById('chat-container');
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function initChat() {
  messages.length = 0; // Clear the messages array
  const chatContainer = document.getElementById('chat-container');
  chatContainer.innerHTML = ''; // Clear the chat container
  appendMessage('assistant', l10n('Hello! How can I help you today?'), '', true);
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

function initMessageListener() {
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
      case 'l10nBundle':
        if (message.bundle) {
          l10nBundle = message.bundle;
        }
        postInit();
        break;
    }
  });
}

function initEventListeners() {
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

    initChat();
  });
}

function initL10nBundle() {
  vscode.postMessage({ command: 'getL10nBundle' });
}

function preInit() {
  initMessageListener();
  initEventListeners();
  initL10nBundle();
}

function initDomLocalization() {
  const inputBox = document.getElementById('input-box');
  inputBox.placeholder = l10n('Type your message here, enter to submit.');
}

// This function is called after the l10nBundle is received
function postInit() {
  initDomLocalization();
  initChat();
}

preInit();