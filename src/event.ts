import * as vscode from "vscode";
import { showSavedDiagnostic } from "./diagnostic";
import { documentParse } from "./parser";
import { measureShowStatusBar } from "./statusBar";

/**
 * ドキュメントの更新
 */
export const changeTextDocument = vscode.workspace.onDidChangeTextDocument((event) => {
  const document = event.document;
  // 構文解析
  documentParse(document);
});

/**
 * カーソル位置の更新
 */
export const changeTextEditorSelection = vscode.window.onDidChangeTextEditorSelection((event) => {
  // 小節のステータスバー表示
  measureShowStatusBar(event.textEditor.document, event.selections[0].active);
});

/**
 * ドキュメントの保存
 */
export const saveTextDocument = vscode.workspace.onDidSaveTextDocument((event) => {
  // 保存時のエラー表示
  showSavedDiagnostic();
});
