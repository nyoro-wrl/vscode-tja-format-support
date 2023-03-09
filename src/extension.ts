import * as vscode from "vscode";
import { headerHover, commandHover } from "./hover";
import { commandSnippet, headerSnippet } from "./snippet";
import { symbol } from "./symbol";
import { jumpMeasure } from "./command";
import {
  changeActiveTextEditor,
  changeTextDocument,
  changeTextEditorSelection,
  closeTextDocument,
  openTextDocument,
  saveTextDocument,
} from "./event";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(openTextDocument);
  context.subscriptions.push(changeTextDocument);
  context.subscriptions.push(saveTextDocument);
  context.subscriptions.push(closeTextDocument);
  context.subscriptions.push(changeTextEditorSelection);
  context.subscriptions.push(changeActiveTextEditor);
  context.subscriptions.push(symbol);
  context.subscriptions.push(headerHover);
  context.subscriptions.push(commandHover);
  context.subscriptions.push(headerSnippet);
  context.subscriptions.push(commandSnippet);
  context.subscriptions.push(jumpMeasure);
}

export function deactivate() {}
