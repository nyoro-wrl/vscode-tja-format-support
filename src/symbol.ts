import * as vscode from "vscode";
import { DocumentSymbol, SymbolKind } from "vscode";
import { Parser } from "./types/parser";
import {
  ChartNode,
  CommandNode,
  CourseHeadersNode,
  CourseNode,
  HeaderNode,
  Node,
  ParentNode,
  RootHeadersNode,
  RootNode,
} from "./types/node";

export const symbol = vscode.languages.registerDocumentSymbolProvider("tja", {
  provideDocumentSymbols(document: vscode.TextDocument, token) {
    const nodeParser = new Parser(document);
    const node = nodeParser.parse();
    return nodeToSymbols(node);
  },
});

function nodeToSymbols<T extends Node>(node: T): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  if (node.range !== undefined) {
    let symbol: DocumentSymbol | undefined;
    // 親をシンボル化する場合はinstanceofで判定してsymbolを作成する
    if (node instanceof RootHeadersNode) {
      // TODO 曲のタイトルで書き換える
      symbol = new DocumentSymbol("Title", "", SymbolKind.Variable, node.range, node.range);
    } else if (node instanceof CourseNode) {
      // TODO 難易度で書き換える
      symbol = new DocumentSymbol("Course", "", SymbolKind.Variable, node.range, node.range);
    } else if (node instanceof HeaderNode) {
      symbol = new DocumentSymbol(
        node.properties.name + ":",
        node.properties.parameter,
        SymbolKind.Variable,
        node.range,
        node.range
      );
    } else if (node instanceof CommandNode && node.parent instanceof CourseNode) {
      symbol = new DocumentSymbol(
        "#" + node.properties.name,
        node.properties.parameter,
        SymbolKind.Variable,
        node.range,
        node.range
      );
    } else if (node instanceof ChartNode) {
      // TODO detailにプレイヤーを追記する
      symbol = new DocumentSymbol("#START", "", SymbolKind.Variable, node.range, node.range);
    }

    if (symbol !== undefined) {
      if (node instanceof ParentNode) {
        for (const child of node.children) {
          const childSymbols = nodeToSymbols(child);
          symbol.children.push(...childSymbols);
        }
      }
      symbols.push(symbol);
    } else {
      // 親をスルーして子をシンボル化する場合はinstanceofで判定する
      if (node instanceof RootNode || node instanceof CourseHeadersNode) {
        for (const child of node.children) {
          const childSymbols = nodeToSymbols(child);
          symbols.push(...childSymbols);
        }
      }
    }
  }
  return symbols;
}

/**
 * 全てのノードをシンボルに変換（検証用）
 * @param node
 * @returns
 */
function allNodeToSymbols<T extends Node>(node: T): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  if (node.range !== undefined) {
    const symbol = new DocumentSymbol(
      node.constructor.name,
      "",
      SymbolKind.Variable,
      node.range,
      node.range
    );
    if (node instanceof ParentNode) {
      for (const child of node.children) {
        const childSymbols = allNodeToSymbols(child);
        symbol.children.push(...childSymbols);
      }
    }
    symbols.push(symbol);
  }
  return symbols;
}
