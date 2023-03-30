import * as vscode from "vscode";
import { tja } from "../constants/language";
import { activeTjaFile } from "../extension";

/**
 * tjaファイルがアクティブになっているかどうかをコンテキストに格納する（package.jsonのwhen句で使用）
 */
export class ActiveFileContext implements vscode.Disposable {
  readonly events: vscode.Disposable[] = [
    activeTjaFile.onDidOpen.event(async () => {
      vscode.commands.executeCommand("setContext", "tja.activeFile", true);
    }),
    activeTjaFile.onDidClose.event(async () => {
      vscode.commands.executeCommand("setContext", "tja.activeFile", false);
    }),
  ];

  constructor() {
    const editor = vscode.window.activeTextEditor;
    if (editor?.document.languageId === tja) {
      vscode.commands.executeCommand("setContext", "tja.activeFile", true);
    }
  }

  dispose() {
    this.events.forEach((x) => x.dispose());
  }
}
