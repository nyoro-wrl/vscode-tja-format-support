// モジュール 'vscode' には、VS Code 拡張性 API が含まれています
// モジュールをインポートし、以下のコードでエイリアスのvscodeで参照します
import * as vscode from 'vscode';
import hoverProvider from "./hoverProvider";

// このメソッドは、拡張機能が有効化されたときに呼び出されます
// コマンドを最初に実行したときに、拡張機能が有効になります
export function activate(context: vscode.ExtensionContext) {

	// コンソールを使って診断情報（console.log）やエラー（console.error）を出力する
	// このコードの行は、拡張機能が有効化されたときに一度だけ実行されます
	console.log('Congratulations, your extension "TJA Format Support" is now active!');

	context.subscriptions.push(hoverProvider);

	// コマンドはpackage.jsonファイルに定義されています
	// registerCommand でコマンドの実装を行います
	// commandId パラメータは package.json の command フィールドと一致する必要があります
	let disposable = vscode.commands.registerCommand('TJA Format Support.helloWorld', () => {
		// ここに配置されたコードは、コマンドが実行されるたびに実行されます
		// ユーザーへのメッセージボックスを表示するコード
		vscode.window.showInformationMessage('Hello World from TJA Format Support!');
	});

	context.subscriptions.push(disposable);
}

// このメソッドは、拡張機能が無効化されたときに呼び出されます。
export function deactivate() { }
