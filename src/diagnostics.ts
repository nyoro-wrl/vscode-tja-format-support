import * as vscode from "vscode";
import { Diagnostic, TextDocument } from "vscode";

export type DiagnosticResult = {
  realtime: Diagnostic[];
  unedited: Diagnostic[];
};

export class Diagnostics implements vscode.Disposable {
  private diagnostics = vscode.languages.createDiagnosticCollection();
  private draftDiagnostics: Record<string, DiagnosticResult> = {};
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (document.languageId === "tja") {
          if (document.isDirty) {
            this.showRealtime(document);
          } else {
            this.showUnedited(document);
          }
        } else {
          this.delete(document);
        }
      }),
      vscode.workspace.onDidChangeTextDocument(async (event) => {
        const document = event.document;
        if (document.languageId === "tja") {
          if (document.isDirty) {
            this.showRealtime(document);
          } else {
            this.showUnedited(document);
          }
        } else {
          this.delete(document);
        }
      }),
      vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (document.languageId === "tja") {
          if (document.isDirty) {
            this.showRealtime(document);
          } else {
            this.showUnedited(document);
          }
        } else {
          this.delete(document);
        }
      }),
      vscode.workspace.onDidCloseTextDocument(async (document) => {
        this.delete(document);
      })
    );
  }

  dispose() {
    this.disposables.forEach((x) => x.dispose());
    this.diagnostics.dispose();
    this.draftDiagnostics = {};
  }

  add(document: TextDocument, diagnosticResult: DiagnosticResult): void {
    for (const diagnostic of diagnosticResult.realtime) {
      this.getDraft(document).realtime.push(diagnostic);
    }
    for (const diagnostic of diagnosticResult.unedited) {
      this.getDraft(document).unedited.push(diagnostic);
    }
  }

  showRealtime(document: TextDocument): void {
    const draft = this.getDraft(document);
    this.diagnostics.set(document.uri, draft.realtime);
  }

  showUnedited(document: TextDocument): void {
    const draft = this.getDraft(document);
    this.diagnostics.set(document.uri, [...draft.realtime, ...draft.unedited]);
  }

  delete(document: TextDocument): void {
    const uri = document.uri.toString();
    if (this.draftDiagnostics.hasOwnProperty(uri)) {
      this.diagnostics.set(document.uri, undefined);
      delete this.draftDiagnostics[uri];
    }
  }

  private getDraft(document: TextDocument): DiagnosticResult {
    const uri = document.uri.toString();
    if (!this.draftDiagnostics.hasOwnProperty(uri)) {
      this.draftDiagnostics[uri] = { realtime: [], unedited: [] };
    }
    return this.draftDiagnostics[uri];
  }
}
