import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "chatView",
      new ChatViewProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
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

    webviewView.webview.html = this.getWebviewContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "showMessage":
          vscode.window.showInformationMessage(message.text);
          break;
      }
    });
  }

  getWebviewContent(webview: vscode.Webview) {
    const onDiskPath = vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'chatPanel.html'));
    const htmlContent = fs.readFileSync(onDiskPath.fsPath, 'utf-8');
    return htmlContent;
  }
}

export function deactivate() { }
