import * as vscode from "vscode";
import { tja } from "../constants/language";

export class ActiveTjaFile implements vscode.Disposable {
  public onDidOpen = new vscode.EventEmitter<vscode.TextDocument>();
  public onDidClose = new vscode.EventEmitter<void>();
  private disposable: vscode.Disposable[] = [
    this.onDidOpen,
    this.onDidClose,
    vscode.workspace.onDidOpenTextDocument(async (openDocument) => {
      const document = vscode.window.activeTextEditor?.document;
      if (document !== undefined && document.uri.toString() === openDocument.uri.toString()) {
        if (document.languageId === tja) {
          this.onDidOpen.fire(document);
        } else {
          this.onDidClose.fire();
        }
      }
    }),
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (editor !== undefined && editor.document.languageId === tja) {
        this.onDidOpen.fire(editor.document);
      } else {
        this.onDidClose.fire();
      }
    }),
  ];
  dispose() {
    this.disposable.forEach((x) => x.dispose());
  }
}
