import * as vscode from "vscode";
import hover from "./hover";
import { measureStatusBar } from "./statusBar";
import { headerSnippet, commandSnippet, triggerCommandSnippet } from "./snippet";
import { symbol } from "./symbol";
import { documentChange } from "./parser";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(documentChange);
  context.subscriptions.push(documentChange);
  context.subscriptions.push(symbol);
  context.subscriptions.push(hover);
  context.subscriptions.push(headerSnippet);
  context.subscriptions.push(commandSnippet);
  context.subscriptions.push(triggerCommandSnippet);
  context.subscriptions.push(measureStatusBar);
}

export function deactivate() {}
