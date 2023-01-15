// モジュール 'vscode' には、VS Code 拡張性 API が含まれています
// モジュールをインポートし、以下のコードでエイリアスのvscodeで参照します
import * as vscode from 'vscode';

vscode.languages.registerHoverProvider("tja", {
	provideHover(document, position, token) {
		let contents = [
			new vscode.MarkdownString(),
			new vscode.MarkdownString(),
		];
		let wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9#]+/);
		if (wordRange === undefined) {
			return Promise.reject("no word here");
		}

		let line = document.lineAt(position).text;
		let currentWord = document.lineAt(position.line).text.slice(wordRange.start.character, wordRange.end.character);

		// TODO #が先頭にあれば先頭じゃないテキストでも認識してしまう
		if (line[0] === "#") {
			switch (currentWord) {
				// 命令.太鼓さん次郎
				case "#START":
					contents[0].appendCodeblock(currentWord + " (<player>)");
					contents[1].appendMarkdown("譜面データの記述を開始します。  \n\n");
					contents[1].appendMarkdown("`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。  \n");
					contents[1].appendMarkdown("`<player>`を`P1`のように指定することで、譜面をプレイヤー別に記述することができます。");
					break;
				case "#END":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("譜面データの記述を終了します。  \n\n");
					contents[1].appendMarkdown("`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。");
					break;
				case "#BPMCHANGE":
					contents[0].appendCodeblock(currentWord + " <bpm>");
					contents[1].appendMarkdown("BPMを変更します。");
					break;
				case "#GOGOSTART":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("ゴーゴータイムを開始します。");
					break;
				case "#GOGOEND":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("ゴーゴータイムを終了します。");
					break;
				case "#MEASURE":
					contents[0].appendCodeblock(currentWord + " <numer>/<denom>");
					contents[1].appendMarkdown("拍子を変更します。  \n\n");
					contents[1].appendMarkdown("`4/4`で4分の4拍子、`6/8`で8分の6拍子になります。");
					break;
				case "#SCROLL":
					contents[0].appendCodeblock(currentWord + " <rate>");
					contents[1].appendMarkdown("譜面のスクロール速度を`<rate>`倍に変更します。  \n\n");
					contents[1].appendMarkdown("デフォルトは`1.00`です。");
					break;
				case "#DELAY":
					contents[0].appendCodeblock(currentWord + " <second>");
					contents[1].appendMarkdown("譜面が流れてくるタイミングを`<second>`秒だけ遅らせます。  \n\n");
					contents[1].appendMarkdown("`#BMSCROLL`,`#HBSCROLL`適用下では譜面停止になります。");
					break;
				case "#SECTION":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("（譜面分岐）譜面分岐の判定に使う連打数、精度をリセットします。  \n\n");
					contents[1].appendMarkdown("分岐したい個所の一小節以上前に置いてください。");
					break;
				case "#BRANCHSTART":
					contents[0].appendCodeblock(currentWord + " <type>, <expart>, <mastar>");
					contents[1].appendMarkdown("（譜面分岐）譜面分岐を開始します。  \n\n");
					contents[1].appendMarkdown("`<type>`: 条件の種類を指定します。`r`で連打数、`p`で精度（%）、`s`でスコアを条件に分岐されます。  \n");
					contents[1].appendMarkdown("`<expart>`: ここに指定された数値以上のとき玄人譜面に分岐します。  \n");
					contents[1].appendMarkdown("`<mastar>`: ここに指定された数値以上のとき達人譜面に分岐します。  \n\n");
					contents[1].appendMarkdown("分岐判定はこの命令の一小節前に行われます（一小節前から連打が始まる場合、その連打もカウントします）。  \n\n");
					contents[1].appendMarkdown("分岐後の譜面はそれぞれ 普通譜面`#N`、玄人譜面`#E`、達人譜面`#M`で記述します。");
					break;
				case "#BRANCHEND":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("（譜面分岐）譜面分岐を終了します。  \n\n");
					contents[1].appendMarkdown("以降は全ての分岐で共通の譜面が流れます。");
					break;
				case "#N":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("（譜面分岐）ここから普通譜面を記述します。");
					break;
				case "#E":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("（譜面分岐）ここから玄人譜面を記述します。");
					break;
				case "#M":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("（譜面分岐）ここから達人譜面を記述します。");
					break;
				case "#LEVELHOLD":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("（譜面分岐）現在の譜面分岐を固定します。  \n\n");
					contents[1].appendMarkdown("この命令がある小節に到達した場合、以後も譜面分岐が行われなくなります。");
					break;
				case "#BMSCROLL":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("譜面のスクロールがBMS形式になります。  \n\n");
					contents[1].appendMarkdown("`#START`より前に記述してください。");
					break;
				case "#HBSCROLL":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("譜面のスクロールが`#BMSCROLL`に`#SCROLL`の効果を含めた形式になります。  \n\n");
					contents[1].appendMarkdown("`#START`より前に記述してください。");
					break;
				case "#BARLINEOFF":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("小節線を非表示にします。");
					break;
				case "#BARLINEON":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("小節線を表示します。");
					break;
				// 命令.TJAPlayer2forPC
				case "#LYRIC":
					contents[0].appendCodeblock(currentWord + " <string>");
					contents[1].appendMarkdown("歌詞を表示します。");
					break;
				case "#SUDDEN":
					contents[0].appendCodeblock(currentWord + " <second1> <second2>");
					contents[1].appendMarkdown("譜面の出現タイミングと動作タイミングを指定します。  \n\n");
					contents[1].appendMarkdown("`<second1>`秒前に出現し、`<second2>`秒前に動き出します。");
					break;
				case "#DIRECTION":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("譜面の流れる方向を指定します。  \n\n");
					contents[1].appendMarkdown("解説準備中");
					break;
				// 命令.TJAPlayer3
				case "#JPOSSCROLL":
					contents[0].appendCodeblock(currentWord + " <second> <distance> <direction>");
					contents[1].appendMarkdown("判定枠を移動します。  \n\n");
					contents[1].appendMarkdown("解説準備中");
					break;
				// 命令.OpenTaiko
				case "#NEXTSONG":
					contents[0].appendCodeblock(currentWord + " <title>,<subtitle>,<genre>,<wave>,<scoreinit>,<scorediff>,<level>,<course>");
					contents[1].appendMarkdown("課題曲を指定します。  \n\n");
					contents[1].appendMarkdown("解説準備中");
					break;
				// 命令.TaikoManyGimmicks
				case "#JUDGEDELAY":
					contents[0].appendCodeblock(currentWord + " <x> <y> <z> <w>");
					contents[1].appendMarkdown("解説準備中");
					break;
				case "#DUMMYSTART":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("音符をダミーノーツにします。");
					break;
				case "#DUMMYEND":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("音符を普通のノーツに戻します。");
					break;
				case "#NOTESPAWN":
					contents[0].appendCodeblock(currentWord + " <type> <second>");
					contents[1].appendMarkdown("解説準備中");
					break;
				case "#SIZE":
					contents[0].appendCodeblock(currentWord + " <rate>");
					contents[1].appendMarkdown("ノーツのサイズを`<rate>`倍にします。");
					break;
				case "#COLOR":
					contents[0].appendCodeblock(currentWord + " <r> <g> <b> <a>");
					contents[1].appendMarkdown("ノーツの色彩を変更します。");
					break;
				case "#ANGLE":
					contents[0].appendCodeblock(currentWord + " <angle>");
					contents[1].appendMarkdown("ノーツの向きを`<angle>`度回転させます。");
					break;
				case "#GRADATION":
					contents[0].appendCodeblock(currentWord + " <type> <second> <type1> <type2>");
					contents[1].appendMarkdown("解説準備中");
					break;
				case "#BARLINESIZE":
					contents[0].appendCodeblock(currentWord + " <width> <height>");
					contents[1].appendMarkdown("小節線のサイズを変更します。  \n\n");
					contents[1].appendMarkdown("解説準備中");
					break;
				case "#RESETCOMMAND":
					contents[0].appendCodeblock(currentWord);
					contents[1].appendMarkdown("全ての命令文の効果を初期値に戻します。");
					break;
				default:
					// 命令.OpenTaiko
					if (currentWord.match(/^#EXAM\d+$/)) {
						contents[0].appendCodeblock("#EXAM<num> <type>,<red>,<gold>,<range>");
						contents[1].appendMarkdown("課題曲の合格条件を指定します。  \n\n");
						contents[1].appendMarkdown("解説準備中");
					}
					break;
			}
		}
		if (contents[0].value !== "" || contents[0].value !== "") {
			return {
				contents: contents,
			};
		}
	},
});

// このメソッドは、拡張機能が有効化されたときに呼び出されます
// コマンドを最初に実行したときに、拡張機能が有効になります
export function activate(context: vscode.ExtensionContext) {

	// コンソールを使って診断情報（console.log）やエラー（console.error）を出力する
	// このコードの行は、拡張機能が有効化されたときに一度だけ実行されます
	console.log('Congratulations, your extension "TJA Format Support" is now active!');

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
