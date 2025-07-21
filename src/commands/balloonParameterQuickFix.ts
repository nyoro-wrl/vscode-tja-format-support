import * as vscode from "vscode";

/**
 * 風船音符の打数設定クイックフィックス
 * カーソルを風船音符の位置に移動してリネーム機能を起動
 */
export async function balloonParameterQuickFix(
  uri: vscode.Uri,
  position: vscode.Position
): Promise<void> {
  // アクティブエディターを取得
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.uri.toString() !== uri.toString()) {
    // 指定されたドキュメントを開く
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
  }

  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }

  // カーソルを風船音符の位置に移動
  activeEditor.selection = new vscode.Selection(position, position);

  // リネーム機能を起動
  await vscode.commands.executeCommand("editor.action.rename");
}