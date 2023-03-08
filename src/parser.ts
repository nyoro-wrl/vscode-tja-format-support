import * as vscode from "vscode";
import { TextDocument } from "vscode";
import { RootNode } from "./types/node";
import { Parser } from "./types/parser";

interface NodeMap {
  [uri: string]: RootNode;
}

const root: NodeMap = {};

export const documentChange = vscode.workspace.onDidChangeTextDocument((event) => {
  const editor = vscode.window.activeTextEditor;
  const document = event.document;
  if (editor && document === editor.document) {
    documentParse(document);
  }
});

export function documentParse(document: TextDocument): void {
  const nodeParser = new Parser(document);
  root[document.uri.toString()] = nodeParser.parse();
}

export function getRoot(document: TextDocument): RootNode | undefined {
  const result = root[document.uri.toString()];
  if (result === undefined) {
    documentParse(document);
    return root[document.uri.toString()];
  }
  return result;
}
