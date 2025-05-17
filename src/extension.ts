import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources.mjs';

let webViewPanel: vscode.WebviewView | undefined;

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

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'llm-chat.copyToChatBox', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; } // no open text editor

        const selections = editor.selections; // handle multiple selections
        const selectedTexts = selections.map(selection => editor.document.getText(selection));

        if (selectedTexts.every(text => text.trim() === '')) { return; } // no text selected

        webViewPanel?.webview.postMessage({
          command: 'copyToChatBox',
          selectedTexts,
        });
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
      localResourceRoots: [
        vscode.Uri.file(path.join(this.context.extensionPath, 'webview')),
      ],
    };

    webviewView.webview.html = this.getWebviewContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'displayMessage':
          vscode.window.showInformationMessage(vscode.l10n.t(message.text));
          break;
        case 'sendQuery':
          await queryModel(webviewView.webview, message.messages);
          break;
        case 'getL10nBundle':
          const bundle = vscode.l10n.bundle || {};
          webviewView.webview.postMessage({ command: 'l10nBundle', bundle });
          break;
      }
    });

    webViewPanel = webviewView;
  }

  getWebviewContent(webview: vscode.Webview) {
    const htmlOnDiskPath = vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'index.html'));
    const cssOnDiskPath = vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'style.css'));
    const jsOnDiskPath = vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'script.js'));
    const markedOnDiskPath = vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'marked.min.js'));

    const htmlContent = fs.readFileSync(htmlOnDiskPath.fsPath, 'utf-8');

    const cssWebviewUri = webview.asWebviewUri(cssOnDiskPath);
    const jsWebviewUri = webview.asWebviewUri(jsOnDiskPath);
    const markedWebviewUri = webview.asWebviewUri(markedOnDiskPath);
    const html = htmlContent
      .replace(/{{stylePath}}/g, cssWebviewUri.toString())
      .replace(/{{scriptPath}}/g, jsWebviewUri.toString())
      .replace(/{{markedPath}}/g, markedWebviewUri.toString());
    return html;
  }
}

async function queryModel(webview: vscode.Webview, messages: Array<ChatCompletionMessageParam>) {
  const config = vscode.workspace.getConfiguration('llmChat');
  const { baseURL, apiKey, model } = config;

  if (!baseURL || !apiKey || !model) {
    vscode.window.showErrorMessage(vscode.l10n.t('Please configure the LLM Chat extension settings: baseURL, apiKey, and model.'));
    webview.postMessage({ command: 'queryError' });
    return;
  }

  try {
    const client = new OpenAI({ baseURL, apiKey });

    const stream = await client.chat.completions.create({
      model,
      messages: messages,
      stream: true,
    });

    for await (const event of stream) {
      if (event.choices[0].delta) {
        const delta = event.choices[0].delta;
        webview.postMessage({ command: 'sendResponseDelta', delta });
      }
    }

    webview.postMessage({ command: 'sendResponseEnd' });
  } catch (error) {
    console.error('Error querying model:', error);
    vscode.window.showErrorMessage(vscode.l10n.t('Error occurred while querying the model.'));
    webview.postMessage({ command: 'queryError' });
  }
}

