import * as vscode from "vscode";
import { tja } from "../constants/language";
import { DisposableMap } from "./documents";

export type DiagnosticResult = {
  realtime: vscode.Diagnostic[];
  unedited: vscode.Diagnostic[];
};

/**
 * 診断情報
 */
export class Diagnostics implements vscode.Disposable {
  private readonly diagnostics = vscode.languages.createDiagnosticCollection(tja);
  private readonly drafts = new DisposableMap<string, DiagnosticResult>();

  private readonly disposables: vscode.Disposable[] = [
    this.diagnostics,
    this.drafts,
    vscode.workspace.onDidOpenTextDocument(async (document) => {
      if (document.languageId === tja) {
        if (document.isDirty) {
          this.showRealtime(document);
        } else {
          this.showUnedited(document);
        }
      }
    }),
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      const document = event.document;
      if (document.languageId === tja) {
        if (document.isDirty) {
          this.showRealtime(document);
        } else {
          this.showUnedited(document);
        }
      }
    }),
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (document.languageId === tja) {
        this.showUnedited(document);
      }
    }),
  ];

  dispose() {
    this.disposables.forEach((x) => x.dispose());
  }

  set(document: vscode.TextDocument, value: DiagnosticResult): void {
    const uri = document.uri.toString();
    this.drafts.set(uri, { realtime: value.realtime, unedited: value.unedited });
  }

  clear(document: vscode.TextDocument): void {
    this.diagnostics.set(document.uri, undefined);
  }

  showRealtime(document: vscode.TextDocument): void {
    const uri = document.uri.toString();
    const draft = this.drafts.get(uri) ?? { realtime: [], unedited: [] };
    this.diagnostics.set(document.uri, draft.realtime);
  }

  showUnedited(document: vscode.TextDocument): void {
    const uri = document.uri.toString();
    const draft = this.drafts.get(uri) ?? { realtime: [], unedited: [] };
    this.diagnostics.set(document.uri, [...draft.realtime, ...draft.unedited]);
  }
}
