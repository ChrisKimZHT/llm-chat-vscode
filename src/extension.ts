import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "chatView",
      new ChatViewProvider(context)
    )
  );
}

export class ChatViewProvider implements vscode.WebviewViewProvider {
  constructor(private context: vscode.ExtensionContext) { }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getWebviewContent();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "showMessage":
          vscode.window.showInformationMessage(message.text);
          break;
      }
    });
  }

  getWebviewContent() {
    return `
<!DOCTYPE html>
<html>
<body>
    <h1>llm-chat</h1>
    <button onclick="sendMessage()">hello world!</button>
    <script>
        const vscode = acquireVsCodeApi();
        function sendMessage() {
            vscode.postMessage({
                command: 'showMessage',
                text: 'Hello!'
            });
        }
    </script>
</body>
</html>
`;
  }
}

export function deactivate() { }
