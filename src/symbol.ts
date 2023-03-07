import * as vscode from "vscode";
import { DocumentSymbol, SymbolKind } from "vscode";
import { Parser } from "./types/parser";
import { unionRanges as newUnionRanges } from "./types/node";
import { Node } from "./types/node";

export const symbol = vscode.languages.registerDocumentSymbolProvider("tja", {
  provideDocumentSymbols(document: vscode.TextDocument, token) {
    const nodeParser = new Parser(document);
    const node = nodeParser.parse();
    return symbolNode(node);
  },
});

function symbolNode(node: Node): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  const range = newUnionRanges(node.ranges);
  if (range !== undefined) {
    const symbol = new DocumentSymbol(node.kind, "", SymbolKind.Variable, range, range);
    for (const child of node.children) {
      const childSymbols = symbolNode(child);
      symbol.children.push(...childSymbols);
    }
    symbols.push(symbol);
  }
  return symbols;
}
