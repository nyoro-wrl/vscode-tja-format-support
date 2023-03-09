import * as vscode from "vscode";
import { TextDocument } from "vscode";
import { RootNode } from "./types/node";
import { Parser } from "./types/parser";

const root: { [uri: string]: RootNode } = {};

export const documentChange = vscode.workspace.onDidChangeTextDocument((event) => {
  const editor = vscode.window.activeTextEditor;
  const document = event.document;
  if (editor && document === editor.document) {
    documentParse(document);
  }
});

export function documentParse(document: TextDocument): void {
  const nodeParser = new Parser(document);
  const key = document.uri.toString();
  root[key] = nodeParser.parse();
}

export function getRoot(document: TextDocument): RootNode {
  const key = document.uri.toString();
  if (!root.hasOwnProperty(key)) {
    documentParse(document);
  }
  const result = root[key];
  if (result === undefined) {
    vscode.window.showErrorMessage("構文解析に失敗しました。");
    throw new Error("構文解析に失敗しました。");
  }
  return result;
}

// TODO ファイルを閉じたときに構文解析結果を削除する
