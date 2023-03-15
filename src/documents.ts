import * as vscode from "vscode";
import { TextDocument } from "vscode";
import { Diagnostics } from "./diagnostics";
import { Parser } from "./parser";
import { RootNode } from "./types/node";

export class Documents implements vscode.Disposable {
  private rootNodes: Record<string, RootNode> = {};
  private diagnostics: Diagnostics = new Diagnostics();
  private readonly disposables: vscode.Disposable[] = [];
  /**
   * ドキュメントの構文解析が完了したとき
   */
  readonly onDidParsedTextDocument;
  /**
   * ドキュメントの初回の構文解析が完了したとき
   */
  readonly onDidFirstParsedTextDocument;

  constructor() {
    this.onDidParsedTextDocument = new vscode.EventEmitter<TextDocument>();
    this.onDidFirstParsedTextDocument = new vscode.EventEmitter<TextDocument>();

    this.disposables.push(
      this.diagnostics,
      this.onDidParsedTextDocument,
      this.onDidFirstParsedTextDocument,
      vscode.workspace.onDidChangeTextDocument(async (event) => {
        if (event.document.languageId === "tja") {
          this.parse(event.document);
        }
      }),
      vscode.workspace.onDidCloseTextDocument(async (document) => {
        this.delete(document);
      }),
      this.onDidParsedTextDocument.event(async (document) => {
        if (document.languageId === "tja") {
          if (document.isDirty) {
            this.diagnostics.showRealtime(document);
          } else {
            this.diagnostics.showUnedited(document);
          }
        }
      }),
      this.onDidFirstParsedTextDocument.event(async (document) => {
        if (document.languageId === "tja" && !document.isDirty) {
          this.diagnostics.showUnedited(document);
        }
      })
    );
  }

  dispose() {
    this.disposables.forEach((x) => x.dispose());
    this.rootNodes = {};
  }

  delete(document: TextDocument): void {
    const uri = document.uri.toString();
    if (this.rootNodes.hasOwnProperty(uri)) {
      delete this.rootNodes[uri];
    }
  }

  parse(document: TextDocument): RootNode {
    let isFirst = false;
    const uri = document.uri.toString();
    if (!this.rootNodes.hasOwnProperty(uri)) {
      this.rootNodes[uri] = new RootNode("");
      isFirst = true;
    }
    const root = this.rootNodes[uri];
    if (document.getText() === root.text) {
      return root;
    }
    this.diagnostics.delete(document);
    const parser = new Parser(document);
    const parseResult = parser.parse();
    this.diagnostics.add(document, parseResult.diagnostics);
    this.rootNodes[uri] = parseResult.root;
    this.onDidParsedTextDocument.fire(document);
    if (isFirst) {
      this.onDidFirstParsedTextDocument.fire(document);
    }
    return parseResult.root;
  }
}
