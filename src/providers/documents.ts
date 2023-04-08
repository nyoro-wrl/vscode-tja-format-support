import * as vscode from "vscode";
import { TextDocument } from "vscode";
import { tja } from "../constants/language";
import { Parser } from "../parser";
import { RootNode } from "../types/node";
import { Diagnostics } from "./diagnostics";
import { Configs } from "../configs";

/**
 * vscode.Disposableを実装したMapオブジェクト
 */
export class DisposableMap<K, V> extends Map<K, V> implements vscode.Disposable {
  dispose() {
    this.clear();
  }
}

/**
 * ファイルを開いている間保持される一時情報
 */
export class DocumentStateCollection<T> implements vscode.Disposable {
  private readonly map = new DisposableMap<string, T>();
  private isDisposed = false;
  private readonly disposables: vscode.Disposable[] = [
    this.map,
    vscode.workspace.onDidCloseTextDocument(async (document) => {
      this.delete(document);
    }),
  ];

  get(document: TextDocument): T | undefined {
    if (this.isDisposed) {
      throw new Error("Disposed.");
    }
    return this.map.get(document.uri.toString());
  }
  set(document: TextDocument, value: T): void {
    if (this.isDisposed) {
      throw new Error("Disposed.");
    }
    this.map.set(document.uri.toString(), value);
  }
  delete(document: TextDocument): boolean {
    if (this.isDisposed) {
      throw new Error("Disposed.");
    }
    return this.map.delete(document.uri.toString());
  }
  clear() {
    this.map.clear();
  }
  dispose() {
    this.isDisposed = true;
    this.disposables.forEach((x) => x.dispose());
  }
}

/**
 * ファイルに紐づく保持情報
 */
export class Documents implements vscode.Disposable {
  private readonly parses = new DocumentStateCollection<RootNode>();
  private readonly diagnostics = new Diagnostics();
  /**
   * ドキュメントの構文解析が完了したとき
   */
  readonly onDidParsedTextDocument = new vscode.EventEmitter<TextDocument>();
  /**
   * ドキュメントの初回の構文解析が完了したとき
   */
  readonly onDidFirstParsedTextDocument = new vscode.EventEmitter<TextDocument>();

  private readonly disposables: vscode.Disposable[] = [
    this.parses,
    this.onDidParsedTextDocument,
    this.onDidFirstParsedTextDocument,
    this.onDidParsedTextDocument.event(async (document) => {
      if (document.languageId === tja && !document.isDirty) {
        this.diagnostics.showUnedited(document);
      }
    }),
    vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration(new Configs().liteMode.getName())) {
        const liteMode = new Configs().liteMode.get();
        if (liteMode) {
          this.parses.clear();
        }
      }
    }),
  ];

  /**
   * 構文木の取得
   * @param document
   * @returns
   */
  parse(document: TextDocument, token?: vscode.CancellationToken): RootNode | undefined {
    const config = new Configs();
    const liteMode = config.liteMode.get();
    if (liteMode) {
      return;
    }
    const result = this.parses.get(document);
    if (result !== undefined && result.text === document.getText()) {
      return result;
    }
    const isFirst = result === undefined;
    const parser = new Parser(document);
    const parseResult = parser.parse(token);
    this.parses.set(document, parseResult.root);
    this.diagnostics.delete(document);
    this.diagnostics.set(document, parseResult.diagnostics);
    this.diagnostics.showRealtime(document);
    if (isFirst) {
      this.onDidFirstParsedTextDocument.fire(document);
    }
    this.onDidParsedTextDocument.fire(document);
    return parseResult.root;
  }

  dispose() {
    this.disposables.forEach((x) => x.dispose());
  }
}
