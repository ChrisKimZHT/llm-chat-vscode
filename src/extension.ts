import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'chatView',
      new ChatViewProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    )
  );
}

export function deactivate() { }

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
        case 'sendQuery':
          await queryModel(webviewView.webview, message.userMessage);
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

async function queryModel(webview: vscode.Webview, userMessage: string) {
  const client = new OpenAI({
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: '',
  });

  const stream = await client.chat.completions.create({
    model: 'qwen-max-latest',
    messages: [{ role: 'user', content: userMessage }],
    stream: true,
  });

  for await (const event of stream) {
    if (event.choices[0].delta) {
      const delta = event.choices[0].delta;
      webview.postMessage({ command: 'sendResponseDelta', delta });
    }
  }
}

