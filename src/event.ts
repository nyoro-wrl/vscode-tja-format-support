import * as vscode from "vscode";
import { Documents } from "./documents";
import { hideMeasureStatusBar, updateMeasureStatusBar } from "./statusBar";

/**
 * カーソル位置の更新
 */
export const changeTextEditorSelection = vscode.window.onDidChangeTextEditorSelection((event) => {
  const document = event.textEditor.document;
  if (document.languageId !== "tja") {
    hideMeasureStatusBar();
    Documents.delete(document);
    return;
  }
  updateMeasureStatusBar(document, event.selections[0].active);
});

/**
 * テキストエディタの変更
 */
export const changeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor((textEditor) => {
  const document = textEditor?.document;
  if (document === undefined || document.languageId !== "tja") {
    hideMeasureStatusBar();
    if (document !== undefined) {
      Documents.delete(document);
    }
    return;
  }
});

/**
 * ドキュメントを開く
 */
export const openTextDocument = vscode.workspace.onDidOpenTextDocument((document) => {
  if (document.languageId !== "tja") {
    hideMeasureStatusBar();
    Documents.delete(document);
    return;
  }
  Documents.get(document).root;
  Documents.get(document).showSavedDiagnostic();
});

/**
 * ドキュメントの更新
 */
export const changeTextDocument = vscode.workspace.onDidChangeTextDocument((event) => {
  const document = event.document;
  if (document.languageId !== "tja") {
    hideMeasureStatusBar();
    Documents.delete(document);
    return;
  }
  Documents.get(document).root;
});

/**
 * ドキュメントの保存
 */
export const saveTextDocument = vscode.workspace.onDidSaveTextDocument((document) => {
  if (document.languageId !== "tja") {
    hideMeasureStatusBar();
    Documents.delete(document);
    return;
  }
  Documents.get(document).showSavedDiagnostic();
});

/**
 * ドキュメントを閉じる
 */
export const closeTextDocument = vscode.workspace.onDidCloseTextDocument((document) => {
  if (document.languageId !== "tja") {
    hideMeasureStatusBar();
    Documents.delete(document);
    return;
  }
  Documents.delete(document);
});
