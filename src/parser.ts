import * as vscode from "vscode";
import { TextDocument } from "vscode";
import { RootNode } from "./types/node";
import { Parser } from "./types/parser";

const root: { [uri: string]: RootNode } = {};

export function documentParse(document: TextDocument): void {
  const parser = new Parser(document);
  const key = document.uri.toString();
  root[key] = parser.parse();
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
