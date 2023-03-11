import * as vscode from "vscode";
import { headerHover, commandHover, balloonHover } from "./hover";
import { commandSnippet, headerSnippet } from "./snippet";
import { symbol } from "./symbol";
import { jumpMeasure } from "./command";
import { diagnostics, documents } from "./documents";
import { hideMeasureStatusBar, measureStatusBarItem, updateMeasureStatusBar } from "./statusBar";
import { TextDocument } from "vscode";
import { balloonNoteDefinition, balloonParameterDefinition } from "./definition";

// イベントハンドラ
export const onDidFirstParsedTextDocumentEmitter = new vscode.EventEmitter<TextDocument>();

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    diagnostics,
    documents,
    openTextDocument,
    changeTextDocument,
    saveTextDocument,
    closeTextDocument,
    changeTextEditorSelection,
    changeActiveTextEditor,
    changeVisibleTextEditors,
    onDidFirstParsedTextDocumentEmitter,
    initialParsedTextDocument,
    symbol,
    headerHover,
    commandHover,
    balloonHover,
    balloonParameterDefinition,
    balloonNoteDefinition,
    headerSnippet,
    commandSnippet,
    jumpMeasure,
    measureStatusBarItem
  );
}

/**
 * ファイルが開かれたとき
 * 言語モードが切り替わったとき
 */
const openTextDocument = vscode.workspace.onDidOpenTextDocument(async (document) => {
  if (document.languageId !== "tja") {
    hideMeasureStatusBar();
    documents.delete(document);
    return;
  }
});

/**
 * ファイルが保存されたとき
 */
const saveTextDocument = vscode.workspace.onDidSaveTextDocument(async (document) => {
  if (document.languageId !== "tja") {
    return;
  }
  documents.get(document).showUneditedDiagnostic();
});

/**
 * ファイルが閉じられたとき
 */
const closeTextDocument = vscode.workspace.onDidCloseTextDocument(async (document) => {
  documents.delete(document);
});

/**
 * テキストエディタの表示状態変更
 */
const changeVisibleTextEditors = vscode.window.onDidChangeVisibleTextEditors(
  async (textEditors) => {
    hideMeasureStatusBar();
    for (const textEditor of textEditors) {
      const document = textEditor.document;
    }
  }
);

/**
 * テキストエディタの変更
 */
const changeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(async (textEditor) => {
  const document = textEditor?.document;
  if (document === undefined) {
    return;
  }
  if (document.languageId !== "tja") {
    return;
  }
});

/**
 * カーソル位置の更新
 */
const changeTextEditorSelection = vscode.window.onDidChangeTextEditorSelection(async (event) => {
  const document = event.textEditor.document;
  if (document.languageId !== "tja") {
    return;
  }
  updateMeasureStatusBar(document, event.textEditor.selection.active);
});

/**
 * ドキュメントの更新
 */
const changeTextDocument = vscode.workspace.onDidChangeTextDocument(async (event) => {
  const document = event.document;
});

/**
 * ドキュメントの初回の構文解析が完了したとき
 */
const initialParsedTextDocument = onDidFirstParsedTextDocumentEmitter.event(async (document) => {
  if (document.languageId !== "tja") {
    return;
  }
  const activeTextEditor = vscode.window.activeTextEditor;
  if (document === activeTextEditor?.document) {
    updateMeasureStatusBar(document, activeTextEditor.selection.active);
  }
});

export function deactivate() {
  //
}
