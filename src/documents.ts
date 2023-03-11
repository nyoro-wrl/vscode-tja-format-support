import * as vscode from "vscode";
import { Diagnostic, DiagnosticSeverity, Range, TextDocument } from "vscode";
import { onDidFirstParsedTextDocumentEmitter as onDidInitialParsedTextDocumentEmitter } from "./extension";
import { RootNode } from "./types/node";
import { Parser } from "./types/parser";

/**
 * 診断を表示するタイミング
 *
 *     "Realtime" // 即時に表示する
 *     "Unedited" // 未編集時に表示する
 */
type DiagnosticTiming = "Realtime" | "Unedited";

class DocumentInfo {
  private readonly document: TextDocument;
  private parsedText: string = "";
  protected _root: RootNode | undefined;
  private realtimeDiagnostics: Diagnostic[] = [];
  private uneditedDiagnostics: Diagnostic[] = [];

  constructor(document: TextDocument) {
    this.document = document;
  }

  public parse(): RootNode {
    const initial = this._root === undefined;
    if (this._root === undefined || this.parsedText !== this.document.getText()) {
      const parser = new Parser(this.document);
      this._root = parser.parse();
      this.parsedText = this.document.getText();
      if (initial) {
        onDidInitialParsedTextDocumentEmitter.fire(this.document);
      }
    }
    return this._root;
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
    timing: DiagnosticTiming = "Realtime",
    severity: DiagnosticSeverity = DiagnosticSeverity.Error
  ): void {
    const diagnostic = new Diagnostic(range, message, severity);
    if (timing === "Realtime") {
      this.realtimeDiagnostics.push(diagnostic);
    } else if (timing === "Unedited") {
      this.uneditedDiagnostics.push(diagnostic);
    }
  }

  /**
   * 即時の診断を表示する
   */
  public showRealtimeDiagnostic(): void {
    diagnostics.set(this.document.uri, this.realtimeDiagnostics);
  }

  /**
   * 未編集時の診断を表示する
   */
  public showUneditedDiagnostic(): void {
    diagnostics.set(this.document.uri, [...this.realtimeDiagnostics, ...this.uneditedDiagnostics]);
  }

  /**
   * 診断の削除
   */
  public clearDiagnostics(): void {
    this.realtimeDiagnostics.length = 0;
    this.uneditedDiagnostics.length = 0;
    diagnostics.delete(this.document.uri);
  }
}

class Documents implements vscode.Disposable {
  private documents: { [key: string]: DocumentInfo } = {};

  get(document: TextDocument): Readonly<DocumentInfo> {
    const key = document.uri.toString();
    if (!this.documents.hasOwnProperty(key)) {
      this.documents[key] = new DocumentInfo(document);
    }
    return this.documents[key];
  }

  delete(document: TextDocument): void {
    const key = document.uri.toString();
    if (this.documents.hasOwnProperty(key)) {
      this.documents[key].clearDiagnostics();
      delete this.documents[key];
    }
  }

  dispose() {
    this.documents = {};
  }
}

export const diagnostics = vscode.languages.createDiagnosticCollection("tja");
export const documents = new Documents();
