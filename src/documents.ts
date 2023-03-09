import * as vscode from "vscode";
import { Diagnostic, DiagnosticSeverity, Range, TextDocument } from "vscode";
import { RootNode } from "./types/node";
import { Parser } from "./types/parser";

type ErrorTiming = "Realtime" | "Saved";

const diagnostics = vscode.languages.createDiagnosticCollection("tja");

class DocumentInfo {
  private readonly document: TextDocument;
  private parsedText: string = "";
  protected _root: RootNode | undefined;
  private realtimeDiagnostics: Diagnostic[] = [];
  private savedDiagnostics: Diagnostic[] = [];

  get root(): Readonly<RootNode> {
    if (this._root === undefined || this.parsedText !== this.document.getText()) {
      const parser = new Parser(this.document);
      this.parsedText = this.document.getText();
      this._root = parser.parse();
    }
    return this._root;
  }

  constructor(document: TextDocument) {
    this.document = document;
  }

  /**
   * 診断の追加
   * @param range
   * @param message
   * @param timing
   * @param severity
   */
  public addDiagnostic(
    range: Range,
    message: string,
    timing: ErrorTiming = "Realtime",
    severity: DiagnosticSeverity = DiagnosticSeverity.Error
  ) {
    const diagnostic = new Diagnostic(range, message, severity);
    if (timing === "Realtime") {
      this.realtimeDiagnostics.push(diagnostic);
    } else if (timing === "Saved") {
      this.savedDiagnostics.push(diagnostic);
    }
    if (this.document.isDirty) {
      diagnostics.set(this.document.uri, this.realtimeDiagnostics);
    } else {
      this.showSavedDiagnostic();
    }
  }

  public showSavedDiagnostic() {
    diagnostics.set(this.document.uri, [...this.realtimeDiagnostics, ...this.savedDiagnostics]);
  }

  /**
   * 診断の削除
   */
  public clearDiagnostics() {
    this.realtimeDiagnostics.length = 0;
    this.savedDiagnostics.length = 0;
    diagnostics.set(this.document.uri, this.realtimeDiagnostics);
    diagnostics.set(this.document.uri, this.savedDiagnostics);
  }
}

export class Documents {
  private static readonly documents: { [key: string]: DocumentInfo } = {};

  static get(document: TextDocument): Readonly<DocumentInfo> {
    const key = document.uri.toString();
    if (!this.documents.hasOwnProperty(key)) {
      this.documents[key] = new DocumentInfo(document);
    }
    return this.documents[key];
  }

  static delete(document: TextDocument): void {
    const key = document.uri.toString();
    if (this.documents.hasOwnProperty(key)) {
      this.documents[key].clearDiagnostics();
      delete this.documents[key];
    }
  }
}
