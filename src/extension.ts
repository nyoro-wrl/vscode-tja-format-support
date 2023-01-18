// モジュール 'vscode' には、VS Code 拡張性 API が含まれています
// モジュールをインポートし、以下のコードでエイリアスのvscodeで参照します
import * as vscode from 'vscode';
import hoverProvider from "./hoverProvider";
import SharpSnippetProvider from "./snippetProvider";

// このメソッドは、拡張機能が有効化されたときに呼び出されます
// コマンドを最初に実行したときに、拡張機能が有効になります
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(hoverProvider);
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider("tja", new SharpSnippetProvider, "#"));
}

// このメソッドは、拡張機能が無効化されたときに呼び出されます。
export function deactivate() { }
