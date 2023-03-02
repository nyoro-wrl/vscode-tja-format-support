import * as vscode from "vscode";
import hover from "./hover";
import { headerSnippet, commandSnippet, triggerCommandSnippet } from "./snippet";
import { symbol } from "./symbol";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(hover);
  context.subscriptions.push(headerSnippet);
  context.subscriptions.push(commandSnippet);
  context.subscriptions.push(triggerCommandSnippet);
  context.subscriptions.push(symbol);
}

// このメソッドは、拡張機能が無効化されたときに呼び出されます。
export function deactivate() {}
