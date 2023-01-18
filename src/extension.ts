import * as vscode from 'vscode';
import hoverProvider from "./hoverProvider";
import { triggerCommandSnippetProvider } from "./snippetProvider";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(hoverProvider);
	context.subscriptions.push(triggerCommandSnippetProvider);
}

// このメソッドは、拡張機能が無効化されたときに呼び出されます。
export function deactivate() { }
